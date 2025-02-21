const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const fetch = require("node-fetch");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is required");
}

// Neynar API key
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
if (!NEYNAR_API_KEY) {
  throw new Error("NEYNAR_API_KEY environment variable is required");
}

// Neynar channel ID
const NEYNAR_CHANNEL_ID = process.env.NEYNAR_CHANNEL_ID;
if (!NEYNAR_CHANNEL_ID) {
  throw new Error("NEYNAR_CHANNEL_ID environment variable is required");
}

// Import models
const BuildRequestSchema = new mongoose.Schema(
  {
    hash: { type: String, required: true, unique: true },
    text: { type: String, required: true },
    publishedAt: { type: Date, required: true },
    author: {
      fid: { type: Number, required: true },
      username: { type: String, required: true },
      displayName: { type: String, required: true },
      pfpUrl: { type: String },
    },
    engagement: {
      likes: { type: Number, default: 0 },
      recasts: { type: Number, default: 0 },
      replies: { type: Number, default: 0 },
      watches: { type: Number, default: 0 },
    },
    claimsCount: { type: Number, default: 0 },
    parentHash: { type: String },
    mentions: [{ type: String }],
    embeds: [
      {
        url: { type: String },
        cast_id: {
          fid: { type: Number },
          hash: { type: String },
        },
        cast: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        },
        metadata: {
          html: {
            ogTitle: { type: String },
            ogDescription: { type: String },
            ogImage: [
              {
                url: { type: String },
                width: { type: String },
                height: { type: String },
              },
            ],
          },
        },
        type: { type: String },
      },
    ],
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const BuildClaimSchema = new mongoose.Schema(
  {
    castHash: { type: String, required: true, unique: true },
    buildRequestHash: { type: String, required: true },
    type: { type: String, required: true, enum: ["reply", "quote"] },
    author: {
      fid: { type: Number, required: true },
      username: { type: String, required: true },
      displayName: { type: String, required: true },
      pfpUrl: String,
    },
    text: { type: String, required: true },
    publishedAt: { type: Date, required: true },
    engagement: {
      likes: { type: Number, default: 0 },
      recasts: { type: Number, default: 0 },
      replies: { type: Number, default: 0 },
    },
    isTagged: { type: Boolean, default: false },
    isHighlighted: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const FarcasterUserSchema = new mongoose.Schema(
  {
    fid: { type: Number, required: true, unique: true },
    username: { type: String, required: true },
    displayName: { type: String, required: true },
    pfp: {
      url: { type: String },
      verified: { type: Boolean, default: true },
    },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Add indexes
BuildRequestSchema.index({ publishedAt: -1 });
BuildRequestSchema.index({ "author.fid": 1 });
BuildRequestSchema.index({ lastUpdated: -1 });
BuildRequestSchema.index({ "engagement.likes": -1 });
BuildRequestSchema.index({ "engagement.recasts": -1 });

BuildClaimSchema.index({ buildRequestHash: 1, publishedAt: -1 });
BuildClaimSchema.index({ buildRequestHash: 1, "engagement.likes": -1 });
BuildClaimSchema.index({ buildRequestHash: 1, "engagement.recasts": -1 });
BuildClaimSchema.index({ buildRequestHash: 1, isTagged: 1 });
BuildClaimSchema.index({ "author.fid": 1 });
BuildClaimSchema.index({ lastUpdated: -1 });

// Create models
const BuildRequest =
  mongoose.models.BuildRequest ||
  mongoose.model("BuildRequest", BuildRequestSchema);
const BuildClaim =
  mongoose.models.BuildClaim || mongoose.model("BuildClaim", BuildClaimSchema);
const FarcasterUser =
  mongoose.models.FarcasterUser ||
  mongoose.model("FarcasterUser", FarcasterUserSchema);

// Neynar client
class NeynarClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.maxRetries = 5;
    this.baseDelay = 5000; // Start with 5 seconds
  }

  async fetchWithRetry(url, retryCount = 0) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          "X-API-Key": this.apiKey,
        },
      });

      if (response.ok) {
        return response.json();
      }

      if (response.status === 503 && retryCount < this.maxRetries) {
        const delay = this.baseDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(
          `\nReceived 503 error (attempt ${retryCount + 1}/${this.maxRetries})`,
        );
        console.log(`Waiting ${delay / 1000} seconds before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, retryCount + 1);
      }

      throw new Error(`Neynar API responded with status: ${response.status}`);
    } catch (error) {
      if (retryCount < this.maxRetries) {
        const delay = this.baseDelay * Math.pow(2, retryCount);
        console.log(
          `\nNetwork error (attempt ${retryCount + 1}/${this.maxRetries}):`,
          error.message,
        );
        console.log(`Waiting ${delay / 1000} seconds before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, retryCount + 1);
      }
      throw error;
    }
  }

  async fetchBuildRequests(cursor, limit = 100) {
    const url = `https://api.neynar.com/v2/farcaster/feed/channels?channel_ids=someone-build&with_recasts=true&with_replies=true&members_only=false&limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`;

    console.log("Fetching URL:", url);
    const data = await this.fetchWithRetry(url);

    // Log the full structure of the first cast to debug replies and recasts
    if (data.casts && data.casts[0]) {
      console.log("First cast structure:", {
        hash: data.casts[0].hash,
        text: data.casts[0].text?.slice(0, 50) + "...",
        replies: {
          count: data.casts[0].replies?.count,
          result: data.casts[0].replies?.result?.length,
        },
        reactions: {
          recasts_count: data.casts[0].reactions?.recasts_count,
          recasts: data.casts[0].reactions?.recasts?.length,
        },
      });
    }

    return data;
  }
}

const neynarClient = new NeynarClient(NEYNAR_API_KEY);

// Helper to detect build claims
function isTaggedBuild(text) {
  return /@ibuiltit/i.test(text);
}

async function syncCasts(cursor, limit = 50) {
  console.log("\n=== Starting syncCasts ===");
  console.log("Fetching with cursor:", cursor);

  const response = await neynarClient.fetchBuildRequests(cursor, limit);
  console.log("\nAPI Response Structure:", {
    totalCasts: response.casts.length,
    hasNextPage: !!response.next,
    sampleCast: response.casts[0]
      ? {
          hash: response.casts[0].hash,
          timestamp: response.casts[0].timestamp,
          text: response.casts[0].text?.slice(0, 50) + "...",
          author: response.casts[0].author,
          repliesCount: response.casts[0].replies?.count,
          recastsCount: response.casts[0].reactions?.recasts_count,
          hasEmbeds: response.casts[0].embeds?.length > 0,
        }
      : "No casts found",
  });

  const processedCasts = [];
  let totalRepliesProcessed = 0;
  let totalQuotesProcessed = 0;
  let totalTaggedClaims = 0;

  for (const cast of response.casts) {
    try {
      console.log("\n--- Processing Cast ---");
      console.log("Cast:", {
        hash: cast.hash,
        timestamp: cast.timestamp,
        author: cast.author,
        repliesCount: cast.replies?.count,
        repliesAvailable: cast.replies?.result?.length || 0,
        recastsCount: cast.reactions?.recasts_count,
        recastsAvailable: cast.reactions?.recasts?.length || 0,
        embedsCount: cast.embeds?.length || 0,
      });

      // Sync author
      const authorData = {
        fid: cast.author.fid,
        username: cast.author.username || "",
        displayName: cast.author.display_name || cast.author.username || "",
        pfp: {
          url: cast.author.pfp_url || "",
          verified: true,
        },
        lastUpdated: new Date(),
      };

      console.log("Author Data:", authorData);

      // Update database
      await FarcasterUser.findOneAndUpdate(
        { fid: authorData.fid },
        authorData,
        { upsert: true },
      );

      // Process the main cast
      const buildRequestData = {
        hash: cast.hash,
        text: cast.text,
        publishedAt: new Date(cast.timestamp),
        author: {
          fid: cast.author.fid,
          username: cast.author.username || "",
          displayName: cast.author.display_name || cast.author.username || "",
          pfpUrl: cast.author.pfp_url || "",
        },
        engagement: {
          likes: cast.reactions.likes_count,
          recasts: cast.reactions.recasts_count,
          replies: cast.replies.count,
          watches: 0,
        },
        parentHash: cast.parent_hash || "",
        mentions: cast.mentioned_profiles
          .filter((p) => p.username)
          .map((p) => p.username || ""),
        embeds: cast.embeds.map((embed) => ({
          url: embed.url,
          cast_id: embed.cast_id,
          cast: embed.cast
            ? {
                author: embed.cast.author
                  ? {
                      fid: embed.cast.author.fid,
                      username: embed.cast.author.username || "",
                      displayName:
                        embed.cast.author.display_name ||
                        embed.cast.author.username ||
                        "",
                      pfpUrl: embed.cast.author.pfp_url || "",
                    }
                  : undefined,
                text: embed.cast.text || "",
                hash: embed.cast.hash,
                timestamp: embed.cast.timestamp,
                embeds: (embed.cast.embeds || []).map((e) => ({
                  url: e.url,
                  cast_id: e.cast_id,
                  cast: undefined,
                  metadata: e.metadata,
                  type: e.cast_id ? "cast" : "url",
                })),
              }
            : undefined,
          metadata: embed.metadata,
          type: embed.cast_id ? "cast" : "url",
        })),
        lastUpdated: new Date(),
      };

      const buildRequest = await BuildRequest.findOneAndUpdate(
        { hash: buildRequestData.hash },
        buildRequestData,
        { upsert: true, new: true },
      );

      console.log("\nStored Build Request:", {
        hash: buildRequest.hash,
        author: buildRequest.author,
        engagement: buildRequest.engagement,
        embedsCount: buildRequest.embeds?.length,
      });

      // Process replies
      const replies = cast.replies?.result || [];
      let taggedClaimsCount = 0;

      if (replies.length > 0) {
        const taggedReplies = replies.filter((reply) =>
          isTaggedBuild(reply.text),
        );
        taggedClaimsCount += taggedReplies.length;
        console.log("\nProcessing Replies:", {
          total: replies.length,
          tagged: taggedReplies.length,
          engagement: replies.reduce(
            (acc, reply) => ({
              likes: acc.likes + reply.reactions.likes_count,
              recasts: acc.recasts + reply.reactions.recasts_count,
            }),
            { likes: 0, recasts: 0 },
          ),
        });
      }

      for (const reply of replies) {
        await BuildClaim.findOneAndUpdate(
          { castHash: reply.hash },
          {
            castHash: reply.hash,
            buildRequestHash: cast.hash,
            type: "reply",
            author: {
              fid: reply.author.fid,
              username: reply.author.username || "",
              displayName:
                reply.author.display_name || reply.author.username || "",
              pfpUrl: reply.author.pfp_url || "",
            },
            text: reply.text,
            publishedAt: new Date(reply.timestamp),
            engagement: {
              likes: reply.reactions.likes_count,
              recasts: reply.reactions.recasts_count,
              replies: reply.replies.count,
            },
            isTagged: isTaggedBuild(reply.text),
            lastUpdated: new Date(),
          },
          { upsert: true },
        );
        totalRepliesProcessed++;
        if (isTaggedBuild(reply.text)) totalTaggedClaims++;
      }

      // Process recasts
      const recasts = cast.reactions?.recasts || [];
      if (recasts.length > 0) {
        const taggedQuotes = recasts.filter(
          (recast) => recast.cast && isTaggedBuild(recast.cast.text),
        );
        taggedClaimsCount += taggedQuotes.length;
        console.log("\nProcessing Recasts:", {
          total: recasts.length,
          tagged: taggedQuotes.length,
          engagement: recasts.reduce(
            (acc, recast) => ({
              likes: acc.likes + (recast.cast?.reactions.likes_count || 0),
              recasts:
                acc.recasts + (recast.cast?.reactions.recasts_count || 0),
            }),
            { likes: 0, recasts: 0 },
          ),
        });
      }

      for (const recast of recasts) {
        if (!recast.cast) {
          console.log("Skipping recast - no cast data available");
          continue;
        }

        await BuildClaim.findOneAndUpdate(
          { castHash: recast.cast.hash },
          {
            castHash: recast.cast.hash,
            buildRequestHash: cast.hash,
            type: "quote",
            author: {
              fid: recast.cast.author.fid,
              username: recast.cast.author.username || "",
              displayName:
                recast.cast.author.display_name ||
                recast.cast.author.username ||
                "",
              pfpUrl: recast.cast.author.pfp_url || "",
            },
            text: recast.cast.text,
            publishedAt: new Date(recast.cast.timestamp),
            engagement: {
              likes: recast.cast.reactions.likes_count,
              recasts: recast.cast.reactions.recasts_count,
              replies: recast.cast.replies.count,
            },
            isTagged: isTaggedBuild(recast.cast.text),
            lastUpdated: new Date(),
          },
          { upsert: true },
        );
        totalQuotesProcessed++;
        if (isTaggedBuild(recast.cast.text)) totalTaggedClaims++;
      }

      // Update the build request with the claims count
      await BuildRequest.findOneAndUpdate(
        { hash: cast.hash },
        { $set: { claimsCount: taggedClaimsCount } },
      );

      processedCasts.push(buildRequest);
    } catch (error) {
      console.error("\nError processing cast:", error);
      console.error("Raw cast data:", cast);
    }
  }

  console.log("\n=== Sync Summary ===");
  console.log("Total casts processed:", processedCasts.length);
  console.log("Claims processed:", {
    replies: totalRepliesProcessed,
    quotes: totalQuotesProcessed,
    tagged: totalTaggedClaims,
    total: totalRepliesProcessed + totalQuotesProcessed,
  });
  console.log("Next cursor:", response.next?.cursor);
  console.log("=====================\n");

  return {
    casts: processedCasts,
    next: response.next,
    stats: {
      casts: processedCasts.length,
      replies: totalRepliesProcessed,
      quotes: totalQuotesProcessed,
      tagged: totalTaggedClaims,
    },
  };
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function migrateClaimsCounts() {
  console.log("\n=== Migrating Claims Counts ===");

  // Get total count first
  const totalBuildRequests = await BuildRequest.countDocuments();
  console.log(`Found ${totalBuildRequests} build requests to process`);

  const BATCH_SIZE = 50;
  let processed = 0;
  let updated = 0;
  let startTime = Date.now();

  // Process in batches
  for (let skip = 0; skip < totalBuildRequests; skip += BATCH_SIZE) {
    const buildRequests = await BuildRequest.find({})
      .skip(skip)
      .limit(BATCH_SIZE)
      .select("hash claimsCount");

    for (const buildRequest of buildRequests) {
      // Count tagged claims for this build request
      const claimsCount = await BuildClaim.countDocuments({
        buildRequestHash: buildRequest.hash,
        isTagged: true,
      });

      // Update the build request if count is different
      if (buildRequest.claimsCount !== claimsCount) {
        await BuildRequest.updateOne(
          { hash: buildRequest.hash },
          { $set: { claimsCount } },
        );
        updated++;
      }
      processed++;

      // Log progress every 10 items
      if (processed % 10 === 0) {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const itemsPerSecond = processed / elapsedSeconds;
        const remainingItems = totalBuildRequests - processed;
        const estimatedSecondsLeft = remainingItems / itemsPerSecond;

        console.log(
          `Progress: ${processed}/${totalBuildRequests} (${Math.round((processed / totalBuildRequests) * 100)}%)`,
        );
        console.log(`Updated: ${updated} records`);
        console.log(`Speed: ${itemsPerSecond.toFixed(2)} items/sec`);
        console.log(
          `Estimated time remaining: ${Math.round(estimatedSecondsLeft)} seconds\n`,
        );
      }
    }
  }

  const totalTimeSeconds = (Date.now() - startTime) / 1000;
  console.log(`\nMigration Complete!`);
  console.log(
    `Processed ${processed} build requests in ${totalTimeSeconds.toFixed(1)} seconds`,
  );
  console.log(`Updated ${updated} records with new claims counts`);
  console.log("=== Migration Complete ===\n");
}

async function syncHistoricalBuilds() {
  try {
    console.log("\n=== Starting Historical Build Sync ===");
    console.log("Checking environment...");
    console.log("Environment variables verified");

    // Connect to MongoDB
    console.log("\nConnecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully");

    // Run the migration after connecting to MongoDB
    await migrateClaimsCounts();

    // Get current state
    const existingCount = await BuildRequest.countDocuments();
    const existingClaimsCount = await BuildClaim.countDocuments();
    const oldestBuild = await BuildRequest.findOne().sort({ publishedAt: 1 });
    const newestBuild = await BuildRequest.findOne().sort({ publishedAt: -1 });

    console.log("\nCurrent Database State:");
    console.log("- Existing build requests:", existingCount);
    console.log("- Existing claims:", existingClaimsCount);
    console.log(
      "- Oldest build:",
      oldestBuild ? new Date(oldestBuild.publishedAt).toISOString() : "none",
    );
    console.log(
      "- Newest build:",
      newestBuild ? new Date(newestBuild.publishedAt).toISOString() : "none",
    );

    // Check for future dates
    if (newestBuild && newestBuild.publishedAt > new Date()) {
      console.log("\nWARNING: Found builds with future dates!");
      console.log("Cleaning up future dates...");
      await BuildRequest.deleteMany({ publishedAt: { $gt: new Date() } });
      console.log("Future dates cleaned up");
    }

    let totalProcessed = 0;
    let totalUsers = new Set();
    let totalReplies = 0;
    let totalQuotes = 0;
    let totalTaggedClaims = 0;
    let cursor;
    let consecutiveEmptyResponses = 0;
    const MAX_EMPTY_RESPONSES = 3;
    const BATCH_SIZE = 100;
    const DELAY_BETWEEN_BATCHES = 1000; // 1 second

    console.log("\nStarting historical data fetch...");
    console.log("- Batch size:", BATCH_SIZE);
    console.log("- Delay between batches:", DELAY_BETWEEN_BATCHES, "ms");
    console.log("- Max empty responses before stopping:", MAX_EMPTY_RESPONSES);

    const startTime = Date.now();
    let lastBatchTime = startTime;

    while (consecutiveEmptyResponses < MAX_EMPTY_RESPONSES) {
      try {
        const batchStartTime = Date.now();
        console.log(
          `\nFetching batch starting at cursor: ${cursor || "initial"}`,
        );

        const { casts, next, stats } = await syncCasts(cursor, BATCH_SIZE);

        if (!casts || casts.length === 0) {
          consecutiveEmptyResponses++;
          console.log(
            `No casts found. Empty response count: ${consecutiveEmptyResponses}/${MAX_EMPTY_RESPONSES}`,
          );
          if (consecutiveEmptyResponses < MAX_EMPTY_RESPONSES) {
            const doubleDelay = DELAY_BETWEEN_BATCHES * 2;
            console.log(`Waiting ${doubleDelay}ms before next attempt...`);
            await delay(doubleDelay);
            continue;
          }
          console.log("Max empty responses reached, stopping sync");
          break;
        }

        consecutiveEmptyResponses = 0;

        // Track stats
        totalProcessed += stats.casts;
        totalReplies += stats.replies;
        totalQuotes += stats.quotes;
        totalTaggedClaims += stats.tagged;
        casts.forEach((cast) => totalUsers.add(cast.author.fid));

        const batchDuration = Date.now() - batchStartTime;
        const totalDuration = Date.now() - startTime;
        const avgTimePerBatch = totalDuration / (totalProcessed / BATCH_SIZE);

        console.log("\nBatch Statistics:");
        console.log(`- Processed: ${stats.casts} builds`);
        console.log(
          `- Claims: ${stats.replies} replies, ${stats.quotes} quotes (${stats.tagged} tagged)`,
        );
        console.log(`- Batch processing time: ${batchDuration}ms`);
        console.log(
          `- Average time per batch: ${avgTimePerBatch.toFixed(2)}ms`,
        );

        console.log("\nOverall Progress:");
        console.log(`- Total builds processed: ${totalProcessed}`);
        console.log(
          `- Total claims: ${totalReplies + totalQuotes} (${totalTaggedClaims} tagged)`,
        );
        console.log(`- Total unique users: ${totalUsers.size}`);
        console.log(
          `- Total time elapsed: ${((Date.now() - startTime) / 1000).toFixed(2)}s`,
        );

        cursor = next?.cursor || undefined;
        if (!cursor) {
          console.log("\nNo more pages to fetch, sync complete");
          break;
        }

        const timeSinceLastBatch = Date.now() - lastBatchTime;
        if (timeSinceLastBatch < DELAY_BETWEEN_BATCHES) {
          const remainingDelay = DELAY_BETWEEN_BATCHES - timeSinceLastBatch;
          console.log(`\nWaiting ${remainingDelay}ms before next batch...`);
          await delay(remainingDelay);
        }
        lastBatchTime = Date.now();
      } catch (error) {
        console.error("\nError fetching batch:", error);
        const longDelay = DELAY_BETWEEN_BATCHES * 5;
        console.log(`Waiting ${longDelay}ms before retry...`);
        await delay(longDelay);
      }
    }

    // Get final state
    const finalCount = await BuildRequest.countDocuments();
    const finalClaimsCount = await BuildClaim.countDocuments();
    const finalOldest = await BuildRequest.findOne().sort({ publishedAt: 1 });
    const finalNewest = await BuildRequest.findOne().sort({ publishedAt: -1 });

    console.log("\n=== Sync Complete ===");
    console.log("Final Database State:");
    console.log("- Total build requests:", finalCount);
    console.log("- Total claims:", finalClaimsCount);
    console.log("- Net new build requests:", finalCount - existingCount);
    console.log("- Net new claims:", finalClaimsCount - existingClaimsCount);
    console.log(
      "- Oldest build:",
      finalOldest ? new Date(finalOldest.publishedAt).toISOString() : "none",
    );
    console.log(
      "- Newest build:",
      finalNewest ? new Date(finalNewest.publishedAt).toISOString() : "none",
    );
    console.log("\nSync Statistics:");
    console.log("- Total builds processed:", totalProcessed);
    console.log("- Total claims:", {
      replies: totalReplies,
      quotes: totalQuotes,
      tagged: totalTaggedClaims,
      total: totalReplies + totalQuotes,
    });
    console.log("- Total unique users:", totalUsers.size);
    console.log(
      "- Total time:",
      ((Date.now() - startTime) / 1000).toFixed(2),
      "seconds",
    );
    console.log("=====================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\nFatal error during sync:", error);
    process.exit(1);
  }
}

// Run the sync
syncHistoricalBuilds();
