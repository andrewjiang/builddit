import NodeCache from 'node-cache';
import { Cast } from '@/lib/api/types';
import { IBuildRequest } from '@/lib/db/models/BuildRequest';
import { TimeRange } from '@/lib/db/models/EngagementScore';

class CacheManager {
  private static instance: CacheManager;
  private cache: NodeCache;

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

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
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

  // User profiles
  private getUserKey(fid: number): string {
    return `${this.USER_PREFIX}_${fid}`;
  }

  public setUser(fid: number, user: any) {
    return this.cache.set(
      this.getUserKey(fid),
      user,
      60 * 60 // 1 hour TTL
    );
  }

  public getUser(fid: number): any | undefined {
    return this.cache.get(this.getUserKey(fid));
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

export const cacheManager = CacheManager.getInstance(); 