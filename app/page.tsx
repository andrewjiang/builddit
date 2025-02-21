import { Suspense } from "react";
import { BuildRequestsContent } from "@/components/BuildRequestsContent";
import { connectToDatabase } from "@/lib/db/connect";
import { BuildRequest as MongoDBBuildRequest } from "@/lib/db/models/BuildRequest";
import type { BuildRequest } from "@/lib/api/types";
import type { IBuildRequest } from "@/lib/db/models/BuildRequest";

// Helper function to strip MongoDB-specific fields
function stripMongoFields<T extends Record<string, any>>(
  obj: T,
): Omit<T, "_id" | "__v"> {
  const { _id, __v, ...rest } = obj;
  return rest;
}

// This is a Server Component
export default async function Page() {
  await connectToDatabase();

  // Fetch initial data
  const mongoResults = await MongoDBBuildRequest.find()
    .sort({ "engagement.likes": -1, publishedAt: -1 })
    .limit(25)
    .lean();

  // Transform MongoDB data to match Neynar API format
  const initialBuildRequests: BuildRequest[] = mongoResults.map((doc) => ({
    object: "cast",
    hash: doc.hash,
    thread_hash: doc.hash,
    parent_hash: doc.parentHash || null,
    parent_url: null,
    root_parent_url: null,
    parent_author: { fid: null },
    author: {
      object: "user",
      fid: doc.author.fid,
      username: doc.author.username,
      display_name: doc.author.displayName,
      pfp_url: doc.author.pfpUrl || undefined,
    },
    text: doc.text,
    timestamp: doc.publishedAt.toISOString(),
    embeds: doc.embeds.map((embed: IBuildRequest["embeds"][0]) => {
      const cleanEmbed = stripMongoFields(embed);
      return {
        url: cleanEmbed.url,
        cast_id: cleanEmbed.cast_id,
        cast: cleanEmbed.cast
          ? {
              object: "cast",
              hash: cleanEmbed.cast.hash,
              author: cleanEmbed.cast.author
                ? {
                    object: "user",
                    fid: cleanEmbed.cast.author.fid,
                    username: cleanEmbed.cast.author.username || "",
                    display_name: cleanEmbed.cast.author.displayName || "",
                    pfp_url: cleanEmbed.cast.author.pfpUrl,
                  }
                : null,
              text: cleanEmbed.cast.text || "",
              timestamp: cleanEmbed.cast.timestamp || "",
              embeds: (cleanEmbed.cast.embeds || []).map(stripMongoFields),
            }
          : null,
        metadata: cleanEmbed.metadata
          ? {
              html: cleanEmbed.metadata.html
                ? {
                    ogTitle: cleanEmbed.metadata.html.ogTitle,
                    ogDescription: cleanEmbed.metadata.html.ogDescription,
                    ogImage:
                      cleanEmbed.metadata.html.ogImage?.map(stripMongoFields) ||
                      [],
                  }
                : undefined,
            }
          : undefined,
      };
    }),
    channel: null,
    reactions: {
      likes_count: doc.engagement.likes,
      recasts_count: doc.engagement.recasts,
      likes: [],
      recasts: [],
    },
    replies: {
      count: doc.engagement.replies,
    },
    mentioned_profiles: doc.mentions.map((username: string) => ({
      object: "user",
      fid: 0, // We don't store this information
      username: username,
      display_name: username,
    })),
  }));

  return (
    <Suspense
      fallback={
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-300 border-t-transparent"></div>
          <p className="mt-2 text-purple-300">Loading build requests...</p>
        </div>
      }
    >
      <BuildRequestsContent initialBuildRequests={initialBuildRequests} />
    </Suspense>
  );
}

// Enable ISR with a revalidation period of 5 minutes
export const revalidate = 300;
