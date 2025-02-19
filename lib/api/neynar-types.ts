import { NeynarAPIClient as BaseNeynarAPIClient } from '@neynar/nodejs-sdk';

export interface NeynarAPIClient extends BaseNeynarAPIClient {
  lookupUserByFid(params: { fid: number }): Promise<{
    result: {
      user: {
        fid: number;
        username: string;
        display_name: string;
        pfp_url: string;
      };
    };
  }>;

  lookupCastById(params: { hash: string }): Promise<{
    result: {
      cast: {
        hash: string;
        thread_hash: string;
        parent_hash: string | null;
        parent_url: string | null;
        root_parent_url: string | null;
        parent_author: { fid: number | null };
        author: {
          fid: number;
          username: string;
          display_name: string;
          pfp_url: string;
        };
        text: string;
        timestamp: string;
        embeds: Array<{ url: string; type: string }>;
        reactions: {
          likes: Array<any>;
          recasts: Array<any>;
        };
        replies: {
          count: number;
        };
        mentioned_profiles: Array<any>;
      };
    };
  }>;
} 