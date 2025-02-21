import { NextResponse } from "next/server";
import {
  BuildRequestSchema,
  BuildRequest as BuildRequestType,
} from "@/lib/api/types";
import { connectToDatabase } from "@/lib/db/connect";
import { BuildRequest } from "@/lib/db/models/BuildRequest";
import { neynarClient } from "@/lib/api/neynar";
import { IBuildRequest } from "@/lib/db/models/BuildRequest";
import { Document, FlattenMaps, SortOrder, Model } from "mongoose";
import { SortOption } from "@/components/FilterBar";
import { FarcasterUser, IFarcasterUser } from "@/lib/db/models/User";

interface FarcasterUserModel extends Model<IFarcasterUser> {
  upsertUser(userData: Partial<IFarcasterUser>): Promise<IFarcasterUser>;
}

type MongoDBBuildRequest = FlattenMaps<IBuildRequest> & {
  _id: unknown;
  __v: number;
};

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor");
    const limit = parseInt(url.searchParams.get("limit") || "25", 10);
    const sort = (url.searchParams.get("sort") as SortOption) || "top_day";
    const search = url.searchParams.get("search") || "";

    console.log("Fetching build requests with params:", {
      cursor,
      limit,
      sort,
      search,
    });

    // Connect to MongoDB
    await connectToDatabase();

    let buildRequests: Omit<IBuildRequest, keyof Document>[] = [];
    let nextCursor: string | undefined;

    try {
      // Determine time window based on sort option
      const now = new Date();
      const timeWindow = sort.startsWith("top_") ? sort.split("_")[1] : null;
      const timeWindowMs = timeWindow
        ? {
            day: 24 * 60 * 60 * 1000, // 1 day
            week: 7 * 24 * 60 * 60 * 1000, // 1 week
            month: 30 * 24 * 60 * 60 * 1000, // 1 month
            all: Number.MAX_SAFE_INTEGER, // All time
          }[timeWindow]
        : null;

      // Build query
      const query: Record<string, any> = {};

      // Add time window filter
      if (timeWindowMs && timeWindow !== "all") {
        const startDate = new Date(now.getTime() - timeWindowMs);
        query.publishedAt = {
          $gte: startDate,
        };
      }

      // Add cursor-based pagination
      if (cursor) {
        const cursorDate = new Date(cursor);
        if (!isNaN(cursorDate.getTime())) {
          query.publishedAt = {
            ...(query.publishedAt || {}),
            $lt: cursorDate,
          };
        }
      }

      // Add search filter
      if (search) {
        query.$or = [
          { text: { $regex: search, $options: "i" } },
          { "author.username": { $regex: search, $options: "i" } },
          { "author.displayName": { $regex: search, $options: "i" } },
        ];
      }

      // Determine sort order
      const sortOrder: { [key: string]: SortOrder } =
        sort === "newest"
          ? { publishedAt: -1 }
          : {
              "engagement.likes": -1,
              "engagement.recasts": -1,
              publishedAt: -1,
            };

      const mongoResults = await BuildRequest.find(query)
        .sort(sortOrder)
        .limit(limit + 1)
        .lean();

      buildRequests = (mongoResults as MongoDBBuildRequest[]).map((doc) => {
        const publishedAt =
          doc.publishedAt instanceof Date
            ? doc.publishedAt
            : new Date(doc.publishedAt);
        return {
          hash: doc.hash,
          text: doc.text,
          publishedAt,
          author: {
            fid: doc.author.fid,
            username: doc.author.username,
            displayName: doc.author.displayName,
            pfpUrl: doc.author.pfpUrl || "",
          },
          engagement: doc.engagement,
          mentions: doc.mentions,
          embeds: doc.embeds.map((embed) => ({
            url: embed.url,
            cast_id: embed.cast_id,
            cast: embed.cast,
            type: embed.type || "url",
          })),
          lastUpdated: doc.lastUpdated || new Date(),
        };
      });

      // If we got more results than the limit, set the next cursor
      if (buildRequests.length > limit) {
        const lastItem = buildRequests[buildRequests.length - 2];
        nextCursor = lastItem.publishedAt.toISOString();
        buildRequests = buildRequests.slice(0, -1);
      }

      return NextResponse.json({
        buildRequests,
        next: nextCursor ? { cursor: nextCursor } : undefined,
      });
    } catch (dbError) {
      console.error("MongoDB Error:", dbError);
      // Continue to Neynar fallback
    }

    // Fallback to Neynar if MongoDB is empty or fails
    console.log("Falling back to Neynar API");

    const response = await neynarClient.fetchBuildRequests(
      cursor || undefined,
      limit,
    );
    buildRequests = [];

    for (const cast of response.casts || []) {
      try {
        const parsed = BuildRequestSchema.parse(cast);

        // Store the author information in FarcasterUser collection
        if (parsed.author.username && parsed.author.display_name) {
          await (FarcasterUser as FarcasterUserModel).upsertUser({
            fid: parsed.author.fid,
            username: parsed.author.username,
            displayName: parsed.author.display_name,
            pfp: {
              url: parsed.author.pfp_url || "",
              verified: true, // We can update this later if needed
            },
            lastUpdated: new Date(),
          });
        }

        // Skip casts where required fields are missing
        if (!parsed.author.username || !parsed.author.display_name) {
          console.warn(
            "Skipping cast with missing author information:",
            parsed.hash,
          );
          continue;
        }

        const buildRequest: Omit<IBuildRequest, keyof Document> = {
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
        buildRequests.push(buildRequest);

        // Store in MongoDB for future use
        await BuildRequest.findOneAndUpdate(
          { hash: buildRequest.hash },
          buildRequest,
          { upsert: true },
        );
      } catch (e) {
        console.error("Failed to parse cast:", e);
      }
    }

    // Apply search filter if specified
    if (search) {
      const searchRegex = new RegExp(search, "i");
      buildRequests = buildRequests.filter(
        (req) =>
          searchRegex.test(req.text) ||
          searchRegex.test(req.author.username) ||
          searchRegex.test(req.author.displayName),
      );
    }

    // Apply sorting
    if (sort === "newest") {
      buildRequests.sort(
        (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
      );
    } else {
      buildRequests.sort((a, b) => {
        const aScore = a.engagement.likes + a.engagement.recasts;
        const bScore = b.engagement.likes + b.engagement.recasts;
        return (
          bScore - aScore || b.publishedAt.getTime() - a.publishedAt.getTime()
        );
      });
    }

    // Apply limit and set next cursor
    if (buildRequests.length > limit) {
      const lastItem = buildRequests[limit - 1];
      nextCursor = lastItem.publishedAt.toISOString();
      buildRequests = buildRequests.slice(0, limit);
    }

    return NextResponse.json({
      buildRequests,
      next: nextCursor ? { cursor: nextCursor } : response.next,
    });
  } catch (error) {
    console.error("Error fetching build requests:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch build requests",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
