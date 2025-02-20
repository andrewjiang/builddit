import NodeCache from 'node-cache';
import { IBuildRequest } from '@/lib/db/models/BuildRequest';
import { TimeRange } from '@/lib/db/models/EngagementScore';

export class CacheService {
  private static instance: CacheService;
  private cache: NodeCache;
  private readonly CAST_PREFIX = 'cast';
  private readonly FARCASTER_USER_PREFIX = 'farcaster_user';
  private readonly ENGAGEMENT_PREFIX = 'engagement';
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  // Cache keys
  private readonly LATEST_BUILDS_KEY = 'latest_builds';
  private readonly TOP_BUILDS_PREFIX = 'top_builds';
  private readonly BUILD_REQUEST_PREFIX = 'build';
  private readonly USER_PREFIX = 'user';

  private constructor() {
    this.cache = new NodeCache({
      stdTTL: 5 * 60, // 5 minutes default TTL
      checkperiod: 60, // Check for expired keys every minute
    });
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Latest build requests
  public setLatestBuildRequests(buildRequests: IBuildRequest[]) {
    return this.cache.set(this.LATEST_BUILDS_KEY, buildRequests, 5 * 60); // 5 minutes TTL
  }

  public getLatestBuildRequests(): IBuildRequest[] | undefined {
    return this.cache.get<IBuildRequest[]>(this.LATEST_BUILDS_KEY);
  }

  // Top build requests by time range
  private getTopBuildsKey(timeRange: TimeRange): string {
    return `${this.TOP_BUILDS_PREFIX}_${timeRange}`;
  }

  public setTopBuildRequests(timeRange: TimeRange, buildRequests: IBuildRequest[]) {
    const ttl = {
      day: 15 * 60, // 15 minutes
      week: 30 * 60, // 30 minutes
      month: 60 * 60, // 1 hour
      all: 2 * 60 * 60, // 2 hours
    }[timeRange];

    return this.cache.set(
      this.getTopBuildsKey(timeRange),
      buildRequests,
      ttl
    );
  }

  public getTopBuildRequests(timeRange: TimeRange): IBuildRequest[] | undefined {
    return this.cache.get<IBuildRequest[]>(this.getTopBuildsKey(timeRange));
  }

  // Individual build requests
  private getBuildRequestKey(hash: string): string {
    return `${this.BUILD_REQUEST_PREFIX}_${hash}`;
  }

  public setBuildRequest(hash: string, buildRequest: IBuildRequest) {
    return this.cache.set(
      this.getBuildRequestKey(hash),
      buildRequest,
      30 * 60 // 30 minutes TTL
    );
  }

  public getBuildRequest(hash: string): IBuildRequest | undefined {
    return this.cache.get<IBuildRequest>(this.getBuildRequestKey(hash));
  }

  // Farcaster user profiles
  private getFarcasterUserKey(fid: number): string {
    return `${this.FARCASTER_USER_PREFIX}_${fid}`;
  }

  public setFarcasterUser(fid: number, user: any) {
    this.cache.set(
      this.getFarcasterUserKey(fid),
      user,
      this.TTL
    );
  }

  public getFarcasterUser(fid: number): any | undefined {
    return this.cache.get(this.getFarcasterUserKey(fid));
  }

  // Cache management
  public flush() {
    return this.cache.flushAll();
  }

  public del(key: string) {
    return this.cache.del(key);
  }

  public stats() {
    return this.cache.getStats();
  }
}

export const cacheService = CacheService.getInstance(); 