import { BuildRequest, EmbeddedCast, Embed } from "@/lib/api/types";
import { useState } from "react";
import Link from "next/link";
import { ClaimBuildModal } from "./ClaimBuildModal";
import { AuthModal } from "./AuthModal";
import { useAuth } from "@/lib/hooks/useAuth";
import { SafeImage } from "./SafeImage";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BountyModal } from "./BountyModal";

interface BuildRequestCardProps {
  buildRequest: BuildRequest;
}

function EmbeddedCastCard({
  cast,
  depth = 0,
}: {
  cast: EmbeddedCast;
  depth?: number;
}) {
  const maxDepth = 3; // Prevent infinite nesting

  if (depth >= maxDepth) {
    return (
      <Link
        href={`https://warpcast.com/${cast.author?.username || "unknown"}/${cast.hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-purple-400 hover:text-purple-300"
        onClick={(e) => e.stopPropagation()}
      >
        View nested cast by @{cast.author?.username || "unknown"}
      </Link>
    );
  }

  return (
    <div
      className={`mt-2 p-4 rounded-lg bg-purple-700/30 border border-purple-600/30 
                       transition-all duration-300 hover:bg-purple-700/40 hover:border-purple-500/40
                       ${depth > 0 ? "ml-4" : ""} overflow-hidden`}
    >
      <div className="flex items-center space-x-2 mb-2">
        {cast.author && (
          <Link
            href={`https://warpcast.com/${cast.author.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-300 hover:text-purple-200 transition-colors duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            @{cast.author.username}
          </Link>
        )}
      </div>
      <p className="text-purple-200 text-sm whitespace-pre-wrap break-words overflow-hidden overflow-wrap-anywhere">
        {cast.text}
      </p>

      {/* Nested Embeds */}
      <div className="space-y-2 mt-2 overflow-hidden">
        {cast.embeds?.map((embed: Embed, index: number) => (
          <div key={index} className="overflow-hidden">
            {embed.cast_id?.hash && embed.cast && (
              <EmbeddedCastCard cast={embed.cast} depth={depth + 1} />
            )}
            {embed.url && (
              <div className="mt-2 overflow-hidden">
                {isImageUrl(embed.url) ||
                embed.metadata?.html?.ogImage?.[0]?.url ? (
                  <div className="relative w-full max-w-[480px] rounded-lg overflow-hidden bg-purple-800/50">
                    <div className="relative aspect-[16/9] max-h-[320px]">
                      <SafeImage
                        src={
                          isImageUrl(embed.url)
                            ? embed.url
                            : embed.metadata?.html?.ogImage?.[0]?.url
                        }
                        alt={embed.metadata?.html?.ogTitle || "Embedded image"}
                        className="absolute inset-0 w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    {embed.metadata?.html?.ogTitle && (
                      <div className="p-2.5">
                        <h3 className="text-purple-200 font-medium break-words text-sm">
                          {embed.metadata.html.ogTitle}
                        </h3>
                        {embed.metadata.html.ogDescription && (
                          <p className="text-xs text-purple-300 mt-1 break-words line-clamp-2">
                            {embed.metadata.html.ogDescription}
                          </p>
                        )}
                        <Link
                          href={embed.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-400 hover:text-purple-300 block mt-1.5 break-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {embed.url}
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-purple-800/30 rounded-lg p-3 border border-purple-700/50">
                    <Link
                      href={embed.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-300 hover:text-purple-200 transition-colors break-all block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {embed.url}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function isImageUrl(url: string): boolean {
  // Check for common image extensions
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) return true;

  // Check for common image hosting domains
  if (url.includes("imagedelivery.net")) return true;
  if (url.includes("openseauserdata.com")) return true;
  if (url.includes("i.imgur.com")) return true;
  if (url.includes("cdn.discordapp.com")) return true;

  // Google Docs image URLs
  if (url.includes("googleusercontent.com/docs")) return true;

  // Firefly media URLs
  if (url.includes("media.firefly.land/farcaster")) return true;

  // Empire Builder OG image URLs
  if (url.includes("empirebuilder.world/api/og")) return true;

  return false;
}

export function BuildRequestCard({ buildRequest }: BuildRequestCardProps) {
  const { data: session } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isBountyModalOpen, setIsBountyModalOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Get engagement metrics from either reactions (Neynar) or engagement (MongoDB)
  const likes =
    "reactions" in buildRequest
      ? buildRequest.reactions.likes_count
      : "engagement" in buildRequest
        ? (buildRequest as any).engagement.likes
        : 0;
  const recasts =
    "reactions" in buildRequest
      ? buildRequest.reactions.recasts_count
      : "engagement" in buildRequest
        ? (buildRequest as any).engagement.recasts
        : 0;

  // Calculate engagement score
  const engagementScore = likes + recasts * 2; // Weigh recasts more heavily

  // Handle date from either Neynar API (timestamp) or MongoDB (publishedAt)
  const date = new Date(
    buildRequest.timestamp ||
      ("publishedAt" in buildRequest
        ? (buildRequest as any).publishedAt
        : Date.now()),
  );
  const dateTimeString = date.toISOString();
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);

  const handleReaction = (type: "like" | "recast") => {
    // Create Warpcast intent URL
    const intentUrl = new URL("https://warpcast.com/~/compose");
    intentUrl.searchParams.set(
      "embeds[]",
      `https://warpcast.com/${buildRequest.author.username}/${buildRequest.hash}`,
    );

    if (type === "recast") {
      intentUrl.searchParams.set("text", ""); // Empty text for recast
    }

    window.open(intentUrl.toString(), "_blank");
  };

  const handleBuildClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user) {
      setIsAuthModalOpen(true);
    } else {
      setIsClaimModalOpen(true);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on a link or button
    if ((e.target as HTMLElement).closest("a, button")) {
      return;
    }
    router.push(`/build/${buildRequest.hash}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative z-0 bg-gradient-to-b from-purple-800 to-purple-800/50 rounded-xl p-6 
                      shadow-xl backdrop-blur-sm border border-purple-700/50 hover:border-yellow-400/50 
                      transition-all duration-300 hover:shadow-yellow-400/5 cursor-pointer overflow-hidden"
    >
      {/* Export Link */}
      <Link
        href={`https://warpcast.com/${buildRequest.author.username}/${buildRequest.hash}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute top-4 right-4 p-2 text-purple-400 hover:text-purple-200 transition-colors duration-200 
                         rounded-lg hover:bg-purple-500/20 z-10"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </Link>

      {/* Content Area */}
      <div className="pr-0">
        <div className="flex items-center space-x-2 mb-2">
          {/* Engagement Score Badge */}
          <div className="group/score relative flex items-center">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-fuchsia-400 rounded-md blur-[2px] opacity-50" />
            <div
              className="relative bg-gradient-to-r from-purple-400 to-fuchsia-400 px-1.5 py-0.5 rounded-md 
                                      text-sm font-semibold text-purple-900 shadow-sm border border-purple-300/20 
                                      flex items-center space-x-0.5"
            >
              <svg
                className="w-3 h-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
              </svg>
              <span>{engagementScore}</span>
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-0 mb-1 hidden group-hover/score:block">
              <div
                className="bg-purple-900/90 backdrop-blur-sm text-purple-100 text-xs px-2 py-1 rounded-md whitespace-nowrap
                                          border border-purple-400/20 shadow-xl"
              >
                Engagement Score = Likes + (Recasts × 2)
              </div>
            </div>
          </div>

          <Link
            href={`https://warpcast.com/${buildRequest.author.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-300 hover:text-purple-200 transition-colors duration-200"
          >
            @{buildRequest.author.username}
          </Link>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-purple-100 whitespace-pre-wrap break-words overflow-hidden overflow-wrap-anywhere">
            {buildRequest.text}
          </p>
          {buildRequest.embeds && buildRequest.embeds.length > 0 && (
            <div className="mt-3 space-y-2">
              {buildRequest.embeds.map((embed, index) => (
                <div key={index} className="overflow-hidden">
                  {embed.cast ? (
                    <EmbeddedCastCard cast={embed.cast} />
                  ) : embed.url ? (
                    <div className="mt-2 overflow-hidden">
                      {embed.metadata?.html?.ogImage?.[0]?.url ||
                      isImageUrl(embed.url) ? (
                        <div className="relative w-full max-w-[480px] rounded-lg overflow-hidden bg-purple-800/50">
                          <div className="relative aspect-[16/9] max-h-[320px]">
                            <SafeImage
                              src={
                                embed.metadata?.html?.ogImage?.[0]?.url ||
                                embed.url
                              }
                              alt={
                                embed.metadata?.html?.ogTitle ||
                                "Embedded image"
                              }
                              className="absolute inset-0 w-full h-full object-cover rounded-lg"
                            />
                          </div>
                          {embed.metadata?.html?.ogTitle && (
                            <div className="p-2.5">
                              <h3 className="text-purple-200 font-medium break-words text-sm">
                                {embed.metadata.html.ogTitle}
                              </h3>
                              {embed.metadata.html.ogDescription && (
                                <p className="text-xs text-purple-300 mt-1 break-words line-clamp-2">
                                  {embed.metadata.html.ogDescription}
                                </p>
                              )}
                              <Link
                                href={embed.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-purple-400 hover:text-purple-300 block mt-1.5 break-all"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {embed.url}
                              </Link>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-purple-800/30 rounded-lg p-3 border border-purple-700/50">
                          <Link
                            href={embed.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-300 hover:text-purple-200 transition-colors break-all block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {embed.url}
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between mt-4"
        data-oid="s3j_83f"
      >
        {/* Buttons - Full width on mobile, normal on desktop */}
        <div className="flex items-center space-x-2 w-full md:w-auto order-1 md:order-2">
          <button
            onClick={handleBuildClick}
            className="flex-1 md:flex-none group relative inline-flex items-center justify-center overflow-hidden rounded-lg 
                               bg-gradient-to-r from-emerald-400 to-emerald-300 p-[2px] font-medium text-emerald-900 
                               shadow-xl shadow-emerald-400/20 transition-all duration-300 hover:shadow-emerald-400/40
                               hover:scale-[1.02] active:scale-[0.98]"
            data-oid="bxp4bi4"
          >
            <span
              className="relative flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-emerald-400 
                                     to-emerald-300 px-2 py-1.5 text-sm transition-all duration-200 ease-out group-hover:bg-opacity-0 
                                     group-hover:from-emerald-300 group-hover:to-emerald-200 w-full justify-center md:justify-start md:w-auto"
              data-oid="4ox26cb"
            >
              <svg
                className="w-3.5 h-3.5 transform transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                data-oid="_l3tg5k"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                  data-oid="hb-0pvl"
                />
              </svg>
              <span className="font-medium" data-oid="qktudy9">
                I Built This!
              </span>
            </span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsBountyModalOpen(true);
            }}
            className="flex-1 md:flex-none group relative inline-flex items-center justify-center overflow-hidden rounded-lg 
                               bg-gradient-to-r from-yellow-400 to-yellow-300 p-[2px] font-medium text-purple-900 
                               shadow-xl shadow-yellow-400/20 transition-all duration-300 hover:shadow-yellow-400/40
                               hover:scale-[1.02] active:scale-[0.98]"
          >
            <span
              className="relative flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-yellow-400 
                                     to-yellow-300 px-2 py-1.5 text-sm transition-all duration-200 ease-out group-hover:bg-opacity-0 
                                     group-hover:from-yellow-300 group-hover:to-yellow-200 w-full justify-center md:justify-start md:w-auto"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">Post Bounty</span>
            </span>
          </button>
        </div>

        {/* Date and Engagement - Full width on mobile, normal on desktop */}
        <div
          className="flex items-center space-x-3 text-sm text-purple-300 order-2 md:order-1"
          data-oid="h-_0k9j"
        >
          <time
            dateTime={dateTimeString}
            className="text-purple-400"
            data-oid="ezyg68b"
          >
            {formattedDate}
          </time>
          <span className="text-purple-600" data-oid="qmdtok:">
            •
          </span>
          <div className="flex items-center space-x-3" data-oid="0q200ip">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReaction("like");
              }}
              className="flex items-center space-x-1 group/like transition-colors"
              data-oid="0ng7i42"
            >
              <svg
                className="w-3.5 h-3.5 text-purple-400 group-hover/like:text-pink-400 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                data-oid=":jsnpuq"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  data-oid="_-a4::p"
                />
              </svg>
              <span
                className="group-hover/like:text-pink-400 transition-colors"
                data-oid="n6lax8-"
              >
                {likes}
              </span>
            </button>
            <span className="text-purple-600" data-oid="qmdtok:">
              •
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReaction("recast");
              }}
              className="flex items-center space-x-1 group/recast transition-colors"
            >
              <svg
                className="w-3.5 h-3.5 text-purple-400 group-hover/recast:text-green-400 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 1l4 4-4 4" />
                <path d="M3 11V9a4 4 0 014-4h14" />
                <path d="M7 23l-4-4 4-4" />
                <path d="M21 13v2a4 4 0 01-4 4H3" />
              </svg>
              <span className="group-hover/recast:text-green-400 transition-colors">
                {recasts}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <div className="relative z-50">
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          message={authMessage}
          data-oid="-f4-04j"
        />
      </div>

      {/* Claim Build Modal */}
      <div className="relative z-50">
        <ClaimBuildModal
          buildRequest={buildRequest}
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
          data-oid="-je2bnc"
        />
      </div>

      {/* Bounty Modal */}
      <div className="relative z-50">
        <BountyModal
          buildRequest={buildRequest}
          isOpen={isBountyModalOpen}
          onClose={() => setIsBountyModalOpen(false)}
        />
      </div>
    </div>
  );
}
