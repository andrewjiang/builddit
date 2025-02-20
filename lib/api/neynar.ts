import { NeynarAPIClient as BaseNeynarAPIClient } from '@neynar/nodejs-sdk';
import { BuildRequestSchema } from './types';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

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

    private constructor() {
        const apiKey = process.env.NEYNAR_API_KEY;
        if (!apiKey) {
            throw new Error('NEYNAR_API_KEY environment variable is not set');
        }
        this.apiKey = apiKey;
        this.client = new BaseNeynarAPIClient({ apiKey: this.apiKey });
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
            await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
        }
        
        this.lastRequestTime = Date.now();
        return request();
    }

    async fetchBuildRequests(cursor?: string, limit: number = 50) {
        return this.rateLimitedRequest(async () => {
            const url = `https://api.neynar.com/v2/farcaster/feed/channels?channel_ids=someone-build&with_recasts=true&with_replies=false&members_only=true&limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'X-API-Key': this.apiKey,
                },
            });

            if (!response.ok) {
                throw new Error(`Neynar API responded with status: ${response.status}`);
            }

            const data = await response.json();
            return {
                casts: data.casts as NeynarCast[],
                next: data.next as { cursor: string } | undefined,
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