import { neynarClient } from "@/lib/api/neynar";
import { cacheService } from "@/lib/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { BuildRequest, IBuildRequest } from "@/lib/db/models/BuildRequest";
import { BuildClaim, IBuildClaim } from "@/lib/db/models/BuildClaim";
import { FarcasterUser, IFarcasterUser } from "@/lib/db/models/User";
import {
  EngagementScore,
  IEngagementScore,
} from "@/lib/db/models/EngagementScore";
import { Model } from "mongoose";
import { BuildRequestSchema } from "@/lib/api/types";
import { isTaggedBuild } from "@/lib/utils/buildDetection";

interface FarcasterUserModel extends Model<IFarcasterUser> {
  upsertUser(userData: Partial<IFarcasterUser>): Promise<IFarcasterUser>;
}

interface BuildRequestModel extends Model<IBuildRequest> {
  upsertBuildRequest(
    buildRequestData: Partial<IBuildRequest>,
  ): Promise<IBuildRequest>;
}

interface BuildClaimModel extends Model<IBuildClaim> {
  upsertClaim(claimData: Partial<IBuildClaim>): Promise<IBuildClaim>;
}

interface EngagementScoreModel extends Model<IEngagementScore> {
  upsertScore(
    buildRequestHash: string,
    timeRange: IEngagementScore["timeRange"],
    metrics: IEngagementScore["metrics"],
    periodStart: Date,
    periodEnd: Date,
  ): Promise<IEngagementScore>;
}

// Type definitions for Neynar API responses
interface NeynarEmbed {
  url?: string;
  cast_id?: { fid: number; hash: string };
  cast?: {
    author?: {
      fid: number;
      username?: string;
      display_name?: string;
      pfp_url?: string;
    };
    text: string;
    hash: string;
    timestamp: string;
    embeds?: NeynarEmbed[];
  };
  metadata?: {
    html?: {
      ogTitle?: string;
      ogDescription?: string;
      ogImage?: Array<{
        url: string;
        width?: string;
        height?: string;
      }>;
    };
  };
}

interface NeynarCast {
  hash: string;
  author: {
    fid: number;
    username?: string;
    display_name?: string;
    pfp_url?: string;
  };
  text: string;
  timestamp: string;
  reactions: {
    likes_count: number;
    recasts_count: number;
    recasts?: Array<{
      cast: {
        hash: string;
        author: {
          fid: number;
          username?: string;
          display_name?: string;
          pfp_url?: string;
        };
        text: string;
        timestamp: string;
        reactions: {
          likes_count: number;
          recasts_count: number;
        };
        replies: {
          count: number;
        };
      };
    }>;
  };
  replies: {
    count: number;
    result?: Array<{
      hash: string;
      author: {
        fid: number;
        username?: string;
        display_name?: string;
        pfp_url?: string;
      };
      text: string;
      timestamp: string;
      reactions: {
        likes_count: number;
        recasts_count: number;
      };
      replies: {
        count: number;
      };
    }>;
  };
  parent_hash?: string;
  mentioned_profiles: Array<{
    username?: string;
  }>;
  embeds: NeynarEmbed[];
}

// Shared utility function for syncing casts and their interactions
export async function syncCasts(cursor?: string, limit: number = 50) {
  console.log("\n=== Starting syncCasts ===");
  console.log("Fetching with cursor:", cursor);

  const response = await neynarClient.fetchBuildRequests(cursor, limit);
  console.log("\nAPI Response Structure:", {
    totalCasts: response.casts.length,
    hasNextPage: !!response.next,
    sampleCast: response.casts[0]
      ? {
          hash: response.casts[0].hash,
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

  for (const rawCast of response.casts) {
    try {
      // Cast to unknown first to avoid type mismatch
      const cast = rawCast as unknown as NeynarCast;

      console.log("\n--- Processing Cast ---");
      console.log("Cast:", {
        hash: cast.hash,
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

      // Update cache and database
      cacheService.setFarcasterUser(cast.author.fid, authorData);
      await (FarcasterUser as FarcasterUserModel).upsertUser(authorData);

      // Process embeds
      if (cast.embeds?.length > 0) {
        console.log(
          "\nProcessing Embeds:",
          cast.embeds.map((embed) => ({
            type: embed.cast_id ? "cast" : "url",
            url: embed.url,
            hasCast: !!embed.cast,
            hasMetadata: !!embed.metadata,
          })),
        );
      }

      // Process the main cast
      const buildRequestData: Partial<IBuildRequest> = {
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
      };

      const buildRequest = await (
        BuildRequest as BuildRequestModel
      ).upsertBuildRequest(buildRequestData);
      console.log("\nStored Build Request:", {
        hash: buildRequest.hash,
        author: buildRequest.author,
        engagement: buildRequest.engagement,
        embedsCount: buildRequest.embeds?.length,
      });

      // Process replies
      const replies = cast.replies.result || [];
      if (replies.length > 0) {
        const taggedReplies = replies.filter((reply) =>
          isTaggedBuild(reply.text),
        );
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
        await (BuildClaim as BuildClaimModel).upsertClaim({
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
        });
        totalRepliesProcessed++;
        if (isTaggedBuild(reply.text)) totalTaggedClaims++;
      }

      // Process recasts
      const recasts = cast.reactions.recasts || [];
      if (recasts.length > 0) {
        const taggedQuotes = recasts.filter(
          (recast) => recast.cast && isTaggedBuild(recast.cast.text),
        );
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

        await (BuildClaim as BuildClaimModel).upsertClaim({
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
        });
        totalQuotesProcessed++;
        if (isTaggedBuild(recast.cast.text)) totalTaggedClaims++;
      }

      // Update engagement scores
      await updateEngagementScores(buildRequest);
      console.log("\nEngagement Scores Updated");

      processedCasts.push(buildRequest);
    } catch (error) {
      console.error("\nError processing cast:", error);
      console.error("Raw cast data:", rawCast);
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

async function updateEngagementScores(buildRequest: IBuildRequest) {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (buildRequest.publishedAt >= dayAgo) {
    await (EngagementScore as EngagementScoreModel).upsertScore(
      buildRequest.hash,
      "day",
      buildRequest.engagement,
      dayAgo,
      now,
    );
  }

  if (buildRequest.publishedAt >= weekAgo) {
    await (EngagementScore as EngagementScoreModel).upsertScore(
      buildRequest.hash,
      "week",
      buildRequest.engagement,
      weekAgo,
      now,
    );
  }

  if (buildRequest.publishedAt >= monthAgo) {
    await (EngagementScore as EngagementScoreModel).upsertScore(
      buildRequest.hash,
      "month",
      buildRequest.engagement,
      monthAgo,
      now,
    );
  }

  await (EngagementScore as EngagementScoreModel).upsertScore(
    buildRequest.hash,
    "all",
    buildRequest.engagement,
    new Date(0),
    now,
  );
}

export class PollingService {
  private static instance: PollingService;
  private isPolling: boolean = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private retryAttempt: number = 0;
  private readonly maxRetries: number = 5;
  private readonly baseDelay: number = 1000; // 1 second
  private readonly maxDelay: number = 30000; // 30 seconds

  private constructor() {}

  public static getInstance(): PollingService {
    if (!PollingService.instance) {
      PollingService.instance = new PollingService();
    }
    return PollingService.instance;
  }

  private calculateBackoff(): number {
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.retryAttempt),
      this.maxDelay,
    );
    return delay + Math.random() * 1000; // Add jitter
  }

  private async pollForUpdates() {
    try {
      await connectToDatabase();

      // Use the shared syncCasts utility
      const { casts } = await syncCasts();

      // Update cache
      cacheService.setLatestBuildRequests(casts);

      // Reset retry count on success
      this.retryAttempt = 0;
    } catch (error) {
      console.error("Error polling for updates:", error);

      if (this.retryAttempt < this.maxRetries) {
        this.retryAttempt++;
        const backoff = this.calculateBackoff();
        console.log(
          `Retrying in ${backoff}ms (attempt ${this.retryAttempt}/${this.maxRetries})`,
        );

        setTimeout(() => this.pollForUpdates(), backoff);
      } else {
        console.error("Max retries reached, stopping polling");
        this.stop();
      }
    }
  }

  public start(interval: number = 5 * 60 * 1000) {
    // 5 minutes default
    if (this.isPolling) {
      console.log("Polling already in progress");
      return;
    }

    this.isPolling = true;
    this.pollForUpdates(); // Initial poll

    this.pollInterval = setInterval(() => {
      if (this.isPolling) {
        this.pollForUpdates();
      }
    }, interval);

    console.log(`Started polling with ${interval}ms interval`);
  }

  public stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
    this.retryAttempt = 0;
    console.log("Stopped polling");
  }

  public isActive(): boolean {
    return this.isPolling;
  }
}

export const pollingService = PollingService.getInstance();
