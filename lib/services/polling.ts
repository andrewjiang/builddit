import { neynarClient } from '@/lib/api/neynar';
import { cacheService } from '@/lib/cache';
import { connectToDatabase } from '@/lib/db/connect';
import { BuildRequest, IBuildRequest } from '@/lib/db/models/BuildRequest';
import { FarcasterUser, IFarcasterUser } from '@/lib/db/models/User';
import { EngagementScore, IEngagementScore } from '@/lib/db/models/EngagementScore';
import { Model } from 'mongoose';
import { BuildRequestSchema } from '@/lib/api/types';

interface FarcasterUserModel extends Model<IFarcasterUser> {
  upsertUser(userData: Partial<IFarcasterUser>): Promise<IFarcasterUser>;
}

interface BuildRequestModel extends Model<IBuildRequest> {
  upsertBuildRequest(buildRequestData: Partial<IBuildRequest>): Promise<IBuildRequest>;
}

interface EngagementScoreModel extends Model<IEngagementScore> {
  upsertScore(
    buildRequestHash: string,
    timeRange: IEngagementScore['timeRange'],
    metrics: IEngagementScore['metrics'],
    periodStart: Date,
    periodEnd: Date
  ): Promise<IEngagementScore>;
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
      this.maxDelay
    );
    return delay + Math.random() * 1000; // Add jitter
  }

  private async syncBuildRequest(cast: any) {
    try {
      // Sync author
      const authorData = {
        fid: cast.author.fid,
        username: cast.author.username,
        displayName: cast.author.display_name,
        pfp: {
          url: cast.author.pfp_url || '',
          verified: true,
        },
        lastUpdated: new Date(),
      };

      // Update cache and database
      cacheService.setFarcasterUser(cast.author.fid, authorData);
      await (FarcasterUser as FarcasterUserModel).upsertUser(authorData);

      // Sync build request
      const buildRequestData = {
        hash: cast.hash,
        text: cast.text,
        publishedAt: new Date(cast.timestamp),
        author: {
          fid: cast.author.fid,
          username: cast.author.username,
          displayName: cast.author.display_name,
          pfpUrl: cast.author.pfp_url,
        },
        engagement: {
          likes: cast.reactions.likes_count,
          recasts: cast.reactions.recasts_count,
          replies: cast.replies.count,
          watches: 0,
        },
        parentHash: cast.parent_hash,
        mentions: cast.mentioned_profiles.map((p: any) => p.username),
        embeds: cast.embeds.map((e: any) => ({
          url: e.url,
          cast_id: e.cast_id,
          cast: e.cast && {
            author: {
              fid: e.cast.author.fid,
              username: e.cast.author.username,
              displayName: e.cast.author.display_name,
              pfpUrl: e.cast.author.pfp_url,
            },
            text: e.cast.text,
            hash: e.cast.hash,
            timestamp: e.cast.timestamp,
            embeds: e.cast.embeds,
          },
          metadata: e.metadata,
          type: e.cast_id ? 'cast' : 'url',
        })),
      };

      const buildRequest = await (BuildRequest as BuildRequestModel).upsertBuildRequest(buildRequestData);
      cacheService.setBuildRequest(buildRequest.hash, buildRequest);

      // Update engagement scores
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      if (buildRequest.publishedAt >= dayAgo) {
        await (EngagementScore as EngagementScoreModel).upsertScore(
          buildRequest.hash,
          'day',
          buildRequest.engagement,
          dayAgo,
          now
        );
      }

      if (buildRequest.publishedAt >= weekAgo) {
        await (EngagementScore as EngagementScoreModel).upsertScore(
          buildRequest.hash,
          'week',
          buildRequest.engagement,
          weekAgo,
          now
        );
      }

      if (buildRequest.publishedAt >= monthAgo) {
        await (EngagementScore as EngagementScoreModel).upsertScore(
          buildRequest.hash,
          'month',
          buildRequest.engagement,
          monthAgo,
          now
        );
      }

      await (EngagementScore as EngagementScoreModel).upsertScore(
        buildRequest.hash,
        'all',
        buildRequest.engagement,
        new Date(0),
        now
      );

      return buildRequest;
    } catch (error) {
      console.error('Error syncing build request:', error);
      throw error;
    }
  }

  private async pollForUpdates() {
    try {
      await connectToDatabase();

      // Fetch latest build requests
      const response = await neynarClient.fetchBuildRequests();
      const buildRequests = await Promise.all(
        response.casts.map(cast => this.syncBuildRequest(cast))
      );

      // Update cache
      cacheService.setLatestBuildRequests(buildRequests);

      // Reset retry count on success
      this.retryAttempt = 0;
    } catch (error) {
      console.error('Error polling for updates:', error);
      
      if (this.retryAttempt < this.maxRetries) {
        this.retryAttempt++;
        const backoff = this.calculateBackoff();
        console.log(`Retrying in ${backoff}ms (attempt ${this.retryAttempt}/${this.maxRetries})`);
        
        setTimeout(() => this.pollForUpdates(), backoff);
      } else {
        console.error('Max retries reached, stopping polling');
        this.stop();
      }
    }
  }

  public start(interval: number = 5 * 60 * 1000) { // 5 minutes default
    if (this.isPolling) {
      console.log('Polling already in progress');
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
    console.log('Stopped polling');
  }

  public isActive(): boolean {
    return this.isPolling;
  }
}

export const pollingService = PollingService.getInstance(); 