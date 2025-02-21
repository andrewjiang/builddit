import { NeynarAPIClient as BaseNeynarAPIClient } from "@neynar/nodejs-sdk";
import { BuildRequestSchema } from "./types";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env") });

interface NeynarCast {
  hash: string;
  author: {
    fid: number;
    username: string;
    display_name: string;
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
  parent_hash?: string;
  mentioned_profiles: Array<{
    username?: string;
  }>;
  embeds: Array<{
    url?: string;
    cast_id?: string;
  }>;
}

class NeynarClient {
  private static instance: NeynarClient;
  private client: BaseNeynarAPIClient;
  private lastRequestTime: number = 0;
  private readonly minRequestInterval: number = 200; // 5 requests per second = 200ms between requests
  private apiKey: string;
  private readonly channelId: string;

  private constructor(apiKey: string, channelId: string) {
    this.apiKey = apiKey;
    this.client = new BaseNeynarAPIClient({ apiKey: this.apiKey });
    this.channelId = channelId;
  }

  public static getInstance(): NeynarClient {
    if (!NeynarClient.instance) {
      const apiKey = process.env.NEYNAR_API_KEY;
      if (!apiKey) {
        throw new Error("NEYNAR_API_KEY environment variable is not set");
      }
      const channelId = process.env.NEYNAR_CHANNEL_ID;
      if (!channelId) {
        throw new Error("NEYNAR_CHANNEL_ID environment variable is not set");
      }
      NeynarClient.instance = new NeynarClient(apiKey, channelId);
    }
    return NeynarClient.instance;
  }

  private async rateLimitedRequest<T>(request: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest),
      );
    }

    this.lastRequestTime = Date.now();
    return request();
  }

  async fetchBuildRequests(cursor?: string, limit: number = 50) {
    return this.rateLimitedRequest(async () => {
      const response = await this.client.fetchFeedByChannelIds({
        channelIds: [this.channelId],
        withRecasts: true,
        withReplies: true,
        membersOnly: true,
        limit,
        cursor,
      });

      return {
        casts: response.casts,
        next: response.next,
      };
    });
  }

  public async fetchUserProfile(fid: number) {
    return this.rateLimitedRequest(async () => {
      try {
        const response = await this.client.fetchBulkUsers({
          fids: [fid],
        });
        return response.users[0];
      } catch (error) {
        console.error(`Error fetching user profile for FID ${fid}:`, error);
        throw error;
      }
    });
  }

  public async fetchCastEngagement(hash: string) {
    return this.rateLimitedRequest(async () => {
      try {
        const [likesResponse, recastsResponse, castResponse] =
          await Promise.all([
            this.client.fetchCastReactions({
              hash,
              types: ["likes"],
            }),
            this.client.fetchCastReactions({
              hash,
              types: ["recasts"],
            }),
            this.client.fetchBulkCasts({
              casts: [hash],
            }),
          ]);

        const cast = castResponse.result.casts[0];

        return {
          likes: likesResponse.reactions.length,
          recasts: recastsResponse.reactions.length,
          replies: cast.replies.count,
          watches: 0, // Not available in current API
        };
      } catch (error) {
        console.error(
          `Error fetching cast engagement for hash ${hash}:`,
          error,
        );
        throw error;
      }
    });
  }

  async fetchReplies(castHash: string): Promise<any[]> {
    return this.rateLimitedRequest(async () => {
      try {
        const response = await fetch(
          `https://api.neynar.com/v2/farcaster/cast/conversation?identifier=${castHash}&type=hash&reply_depth=1&include_chronological_parent_casts=false&limit=50`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              "X-API-Key": this.apiKey,
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `Neynar API responded with status: ${response.status}`,
          );
        }

        const data = await response.json();
        return data.conversation?.cast?.direct_replies || [];
      } catch (error) {
        console.error(`Error fetching replies for cast ${castHash}:`, error);
        return [];
      }
    });
  }

  async fetchQuotes(castHash: string): Promise<any[]> {
    return [];
  }
}

export const neynarClient = NeynarClient.getInstance();
