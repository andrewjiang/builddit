import { connectToDatabase } from "@/lib/db/connect";
import { neynarClient } from "@/lib/api/neynar";
import { BuildRequest } from "@/lib/db/models/BuildRequest";
import { FarcasterUser } from "@/lib/db/models/User";
import { BuildRequestSchema } from "@/lib/api/types";

async function syncRecentCasts() {
  console.log("Starting recent sync...");
  
  try {
    // Connect to MongoDB
    await connectToDatabase();
    console.log("Connected to MongoDB");

    let cursor: string | undefined = undefined;
    let existingPostsFound = 0;
    const EXISTING_POSTS_THRESHOLD = 5;
    let totalNewPosts = 0;
    let totalUpdatedPosts = 0;
    let batchNumber = 0;
    const BATCH_SIZE = 25;

    while (existingPostsFound < EXISTING_POSTS_THRESHOLD) {
      batchNumber++;
      console.log(`=== Processing Batch ${batchNumber} ===`);
      console.log(`Fetching casts from cursor ${cursor}`);
      
      const response = await neynarClient.fetchBuildRequests(
        cursor ? String(cursor) : undefined,
        BATCH_SIZE
      );
      if (!response.casts || response.casts.length === 0) {
        console.log("No more casts to process");
        break;
      }

      console.log(`\nBatch Stats:`);
      console.log(`Total casts in batch: ${response.casts.length}`);
      console.log(`Has next page: ${!!response.next}`);
      if (response.casts[0]) {
        console.log(`Sample cast:`, {
          hash: response.casts[0].hash,
          timestamp: response.casts[0].timestamp,
          engagement: {
            likes: response.casts[0].reactions.likes_count,
            recasts: response.casts[0].reactions.recasts_count,
            replies: response.casts[0].replies.count,
          }
        });
      }

      for (const cast of response.casts) {
        try {
          const parsed = BuildRequestSchema.parse(cast);
          
          // Check if post exists
          const existingPost = await BuildRequest.findOne({ hash: parsed.hash });
          
          if (existingPost) {
            console.log(`Found existing post: ${parsed.hash}`);
            existingPostsFound++;
            
            // Update engagement metrics for existing post
            await BuildRequest.findOneAndUpdate(
              { hash: parsed.hash },
              {
                $set: {
                  engagement: {
                    likes: parsed.reactions.likes_count,
                    recasts: parsed.reactions.recasts_count,
                    replies: parsed.replies.count,
                    watches: 0,
                  },
                  lastUpdated: new Date(),
                },
              }
            );
            totalUpdatedPosts++;
            
            if (existingPostsFound >= EXISTING_POSTS_THRESHOLD) {
              console.log("\nReached existing posts threshold, stopping sync");
              break;
            }
          } else {
            // Store new post
            if (parsed.author.username && parsed.author.display_name) {
              // Store user information
              await FarcasterUser.findOneAndUpdate(
                { fid: parsed.author.fid },
                {
                  $set: {
                    username: parsed.author.username,
                    displayName: parsed.author.display_name,
                    pfp: {
                      url: parsed.author.pfp_url || "",
                      verified: true,
                    },
                    lastUpdated: new Date(),
                  },
                },
                { upsert: true }
              );

              // Store build request
              const buildRequest = {
                hash: parsed.hash,
                text: parsed.text,
                publishedAt: new Date(parsed.timestamp),
                author: {
                  fid: parsed.author.fid,
                  username: parsed.author.username,
                  displayName: parsed.author.display_name,
                  pfpUrl: parsed.author.pfp_url || "",
                },
                engagement: {
                  likes: parsed.reactions.likes_count,
                  recasts: parsed.reactions.recasts_count,
                  replies: parsed.replies.count,
                  watches: 0,
                },
                parentHash: parsed.parent_hash || "",
                mentions: parsed.mentioned_profiles
                  .filter((p) => p.username)
                  .map((p) => p.username as string),
                embeds: parsed.embeds.map((e) => ({
                  url: e.url,
                  cast_id: e.cast_id,
                  cast: e.cast,
                  metadata: e.metadata,
                  type: e.cast_id ? "cast" : "url",
                })),
                lastUpdated: new Date(),
              };

              await BuildRequest.create(buildRequest);
              totalNewPosts++;
              console.log(`Stored new post: ${parsed.hash}`);
            }
          }
        } catch (e) {
          console.error("Failed to process cast:", e);
        }
      }

      // Convert the next cursor to string if it exists
      cursor = response.next ? String(response.next) : undefined;
      
      if (!cursor) {
        console.log("\nNo more pages to fetch");
        break;
      }

      // Add a small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log("\n=== Sync Summary ===");
    console.log(`Total batches processed: ${batchNumber}`);
    console.log(`Total new posts stored: ${totalNewPosts}`);
    console.log(`Total posts updated: ${totalUpdatedPosts}`);
    console.log(`Existing posts found: ${existingPostsFound}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error during sync:", error);
    process.exit(1);
  }
}

// Run the sync
syncRecentCasts(); 