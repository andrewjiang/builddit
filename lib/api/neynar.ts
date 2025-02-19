import { NeynarAPIClient as BaseNeynarAPIClient } from '@neynar/nodejs-sdk';
import { BuildRequestSchema } from './types';

class NeynarClient {
  private client: BaseNeynarAPIClient;
  private static instance: NeynarClient;
  private lastRequestTime: number = 0;
  private readonly minRequestInterval: number = 200; // 5 requests per second = 200ms between requests

  private constructor() {
    if (!process.env.NEYNAR_API_KEY) {
      throw new Error('NEYNAR_API_KEY is not defined in environment variables');
    }
    this.client = new BaseNeynarAPIClient({ apiKey: process.env.NEYNAR_API_KEY });
  }

  public static getInstance(): NeynarClient {
    if (!NeynarClient.instance) {
      NeynarClient.instance = new NeynarClient();
    }
    return NeynarClient.instance;
  }

  private async rateLimitedRequest<T>(request: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
    return request();
  }

  public async fetchBuildRequests(cursor?: string, limit: number = 25) {
    return this.rateLimitedRequest(async () => {
      try {
        const response = await this.client.fetchFeedByChannelIds({
          channelIds: ['someone-build'],
          cursor,
          limit,
          withRecasts: true,
        });

        // Parse each cast through our schema
        const casts = response.casts.map(cast => {
          try {
            return BuildRequestSchema.parse(cast);
          } catch (error) {
            console.error('Failed to parse cast:', cast, error);
            return null;
          }
        }).filter(Boolean); // Remove any null values from failed parses

        return {
          casts,
          next: response.next?.cursor,
        };
      } catch (error) {
        console.error('Error fetching build requests from Neynar:', error);
        throw error;
      }
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
        const [likesResponse, recastsResponse, castResponse] = await Promise.all([
          this.client.fetchCastReactions({ 
            hash,
            types: ['likes'],
          }),
          this.client.fetchCastReactions({ 
            hash,
            types: ['recasts'],
          }),
          this.client.fetchBulkCasts({
            casts: [hash],
          })
        ]);
        
        const cast = castResponse.result.casts[0];
        
        return {
          likes: likesResponse.reactions.length,
          recasts: recastsResponse.reactions.length,
          replies: cast.replies.count,
          watches: 0, // Not available in current API
        };
      } catch (error) {
        console.error(`Error fetching cast engagement for hash ${hash}:`, error);
        throw error;
      }
    });
  }
}

export const neynarClient = NeynarClient.getInstance(); 