import { BuildRequest } from "@/lib/db/models/BuildRequest";
import { BuildClaim, IBuildClaim } from "@/lib/db/models/BuildClaim";
import { connectToDatabase } from "@/lib/db/connect";
import { BuildRequestDetails } from "@/components/BuildRequestDetails";
import { notFound } from "next/navigation";
import type { BuildRequest as BuildRequestType } from "@/lib/api/types";
import type { IBuildRequest } from "@/lib/db/models/BuildRequest";

interface PageProps {
  params: {
    hash: string;
  };
}

export default async function BuildRequestPage({ params }: PageProps) {
  await connectToDatabase();

  // Fetch build request and its claims
  const [buildRequestDoc, claimDocs] = await Promise.all([
    BuildRequest.findOne({ hash: params.hash }).lean(),
    BuildClaim.find({ buildRequestHash: params.hash })
      .sort({ publishedAt: -1 })
      .lean(),
  ]);

  if (!buildRequestDoc) {
    notFound();
  }

  // Cast the Mongoose documents to their interfaces
  const buildRequest = buildRequestDoc as unknown as IBuildRequest;
  const claims = claimDocs as unknown as IBuildClaim[];

  // Transform MongoDB data to match Neynar API format
  const transformedBuildRequest: BuildRequestType = {
    object: "cast",
    hash: buildRequest.hash,
    thread_hash: buildRequest.hash,
    parent_hash: null,
    parent_url: null,
    root_parent_url: null,
    parent_author: { fid: null },
    author: {
      object: "user",
      fid: buildRequest.author.fid,
      username: buildRequest.author.username,
      display_name: buildRequest.author.displayName,
      pfp_url: buildRequest.author.pfpUrl,
    },
    text: buildRequest.text,
    timestamp: buildRequest.publishedAt.toISOString(),
    embeds: buildRequest.embeds.map((embed) => ({
      url: embed.url,
      cast_id: embed.cast_id,
      cast: embed.cast,
      metadata: embed.metadata,
    })),
    reactions: {
      likes_count: buildRequest.engagement.likes,
      recasts_count: buildRequest.engagement.recasts,
      likes: [],
      recasts: [],
    },
    replies: {
      count: buildRequest.engagement.replies,
    },
    mentioned_profiles: buildRequest.mentions.map((username) => ({
      object: "user",
      fid: 0,
      username,
      display_name: username,
    })),
    channel: {
      object: "channel",
      id: "someone-build",
      name: "someone-build",
      image_url: undefined,
    },
  };

  return (
    <BuildRequestDetails
      buildRequest={transformedBuildRequest}
      claims={claims}
    />
  );
}
