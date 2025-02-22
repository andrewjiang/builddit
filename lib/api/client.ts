import { BuildRequest } from "./types";
import { SortOption } from "@/components/FilterBar";

export async function fetchBuildRequests(
  options: {
    cursor?: string;
    limit?: number;
    sort?: SortOption;
    search?: string;
  } = {},
): Promise<{ buildRequests: BuildRequest[]; next?: string }> {
  try {
    const { cursor, limit = 25, sort = "top_day", search } = options;
    console.log("\n=== Client Request ===");
    console.log("Options:", { cursor, limit, sort, search });

    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (limit) params.set("limit", limit.toString());
    if (sort) params.set("sort", sort);
    if (search) params.set("search", search);

    console.log("Request URL:", `/api/build-requests?${params.toString()}`);

    const response = await fetch(`/api/build-requests?${params.toString()}`);
    if (!response.ok) {
      throw new Error("Failed to fetch build requests");
    }

    const data = await response.json();
    console.log("\n=== API Response ===");
    console.log("Total build requests:", data.buildRequests.length);
    console.log("Next cursor:", data.next);
    console.log("Sample data (first item):", data.buildRequests[0] ? {
      hash: data.buildRequests[0].hash,
      publishedAt: data.buildRequests[0].publishedAt,
      engagement: data.buildRequests[0].engagement,
    } : "No data");

    // Transform the response to ensure embedded casts are properly included
    const buildRequests = data.buildRequests.map((request: BuildRequest) => ({
      ...request,
      embeds: request.embeds.map((embed) => ({
        ...embed,
        // If this is a cast embed, ensure we include all the cast data
        ...(embed.cast_id && embed.cast
          ? {
              type: "cast",
              cast_id: embed.cast_id,
              cast: {
                ...embed.cast,
                author: {
                  ...embed.cast.author,
                  // Ensure we have all required user fields
                  object: embed.cast.author.object || "user_dehydrated",
                },
              },
            }
          : embed.url
            ? {
                type: "url",
                url: embed.url,
                metadata: embed.metadata,
              }
            : {}),
      })),
    }));

    console.log("\n=== Transformed Data ===");
    console.log("Total transformed requests:", buildRequests.length);
    console.log("Sample transformed (first item):", buildRequests[0] ? {
      hash: buildRequests[0].hash,
      publishedAt: buildRequests[0].publishedAt,
      engagement: buildRequests[0].engagement,
    } : "No data");

    return {
      buildRequests,
      next: data.next?.cursor || data.next,
    };
  } catch (error) {
    console.error("Error fetching build requests:", error);
    throw error;
  }
}

export async function fetchBuildRequestClaims(hash: string): Promise<any[]> {
  try {
    const response = await fetch(`/api/build-requests/${hash}/claims`);
    if (!response.ok) {
      throw new Error("Failed to fetch build request claims");
    }

    const data = await response.json();
    return data.claims;
  } catch (error) {
    console.error("Error fetching build request claims:", error);
    throw error;
  }
}

export async function fetchTopBuildRequests(
  timeWindow: "day" | "week" | "month" = "week",
  limit: number = 25,
): Promise<BuildRequest[]> {
  try {
    console.log("\n=== Fetching Top Build Requests ===");
    console.log("Time window:", timeWindow);
    console.log("Limit:", limit);

    const params = new URLSearchParams({
      timeWindow,
      limit: limit.toString(),
    });

    const response = await fetch(`/api/build-requests?${params.toString()}`);
    if (!response.ok) {
      throw new Error("Failed to fetch top build requests");
    }

    const { buildRequests } = await response.json();
    console.log("Initial results count:", buildRequests.length);

    // Sort by engagement (likes_count + recasts_count)
    const sortedRequests = buildRequests
      .sort((a: BuildRequest, b: BuildRequest) => {
        const aScore = a.reactions.likes_count + a.reactions.recasts_count;
        const bScore = b.reactions.likes_count + b.reactions.recasts_count;
        return bScore - aScore;
      })
      .slice(0, limit);

    console.log("\n=== Sorted Results ===");
    console.log("Final results count:", sortedRequests.length);
    console.log("Sample scores (first 3):", sortedRequests.slice(0, 3).map(req => ({
      hash: req.hash,
      score: req.reactions.likes_count + req.reactions.recasts_count,
      publishedAt: req.timestamp
    })));

    return sortedRequests;
  } catch (error) {
    console.error("Error fetching top build requests:", error);
    throw error;
  }
}
