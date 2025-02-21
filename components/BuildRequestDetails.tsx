"use client";

import { BuildRequest, EmbeddedCast, Embed } from "@/lib/api/types";
import { IBuildClaim } from "@/lib/db/models/BuildClaim";
import { ClaimBuildModal } from "./ClaimBuildModal";
import { useState } from "react";
import Link from "next/link";
import { SafeImage } from "./SafeImage";
import { useAuth } from "@/lib/hooks/useAuth";
import { AuthModal } from "./AuthModal";
import { useSession } from "next-auth/react";
import { BountyModal } from "./BountyModal";

interface BuildRequestDetailsProps {
  buildRequest: BuildRequest;
  claims: IBuildClaim[];
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
        className="text-purple-300 hover:text-purple-200 text-sm break-all"
      >
        View nested cast on Warpcast
      </Link>
    );
  }

  return (
    <div className="border border-purple-600/30 rounded-lg p-4 bg-purple-900/30">
      <div className="flex items-center mb-2">
        {cast.author?.pfp_url && (
          <SafeImage
            src={cast.author.pfp_url}
            alt={cast.author.username || "Unknown"}
            className="w-6 h-6 rounded-full mr-2"
          />
        )}
        <div>
          <span className="text-purple-100 font-medium">
            {cast.author?.display_name || cast.author?.username || "Unknown"}
          </span>
          {cast.author?.username && (
            <span className="text-purple-300 text-sm ml-1">
              @{cast.author.username}
            </span>
          )}
        </div>
      </div>
      <p className="text-purple-100 whitespace-pre-wrap break-words overflow-hidden overflow-wrap-anywhere mb-3">
        {cast.text}
      </p>
      {cast.embeds && cast.embeds.length > 0 && (
        <div className="space-y-2">
          {cast.embeds.map((embed: Embed, index: number) => (
            <div key={index}>
              {embed.cast ? (
                <EmbeddedCastCard cast={embed.cast} depth={depth + 1} />
              ) : embed.url ? (
                <a
                  href={embed.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-purple-900/50 rounded p-3 hover:bg-purple-900/70 transition-colors"
                >
                  {embed.metadata?.html?.ogTitle && (
                    <h4 className="font-medium text-purple-100 break-words">
                      {embed.metadata.html.ogTitle}
                    </h4>
                  )}
                  {embed.metadata?.html?.ogDescription && (
                    <p className="text-purple-300 text-sm mt-1 break-words">
                      {embed.metadata.html.ogDescription}
                    </p>
                  )}
                  <span className="text-purple-400 hover:text-purple-300 text-sm mt-1.5 block break-all">
                    {embed.url}
                  </span>
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )}
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
  if (url.includes("i.seadn.io")) return true;

  // Google Docs image URLs
  if (url.includes("googleusercontent.com/docs")) return true;

  // Firefly media URLs
  if (url.includes("media.firefly.land/farcaster")) return true;

  // Empire Builder OG image URLs
  if (url.includes("empirebuilder.world/api/og")) return true;

  return false;
}

export function BuildRequestDetails({
  buildRequest,
  claims: initialClaims,
}: BuildRequestDetailsProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isBountyModalOpen, setIsBountyModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { data: session } = useSession();
  const [claims, setClaims] = useState(initialClaims);

  const handleClaimSubmitted = (newClaim: any) => {
    console.log("New claim submitted:", newClaim);
    setClaims((prevClaims) => [newClaim, ...prevClaims]);
  };

  const handleBuildClick = () => {
    if (!session?.user) {
      setIsAuthModalOpen(true);
    } else {
      setIsClaimModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700 relative">
      <div
        className="pointer-events-none fixed inset-0 opacity-50 transition-transform duration-200 ease-out"
        style={{
          background: `radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, rgba(250, 204, 21, 0.15), transparent 80%)`,
        }}
      />
      <div className="max-w-[1024px] mx-auto px-4 py-8">
        <Link
          href="/"
          className="text-purple-200 hover:text-white mb-4 inline-flex items-center transition-colors"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Build Requests
        </Link>

        <div className="bg-purple-800/30 rounded-xl p-6 mb-8 shadow-xl backdrop-blur-sm border border-purple-700/50">
          <div className="flex items-center mb-4">
            {buildRequest.author.pfp_url && (
              <SafeImage
                src={buildRequest.author.pfp_url}
                alt={buildRequest.author.username}
                className="w-10 h-10 rounded-full mr-4"
              />
            )}
            <div>
              <h2 className="font-semibold text-purple-100">
                {buildRequest.author.display_name ||
                  buildRequest.author.username}
              </h2>
              <p className="text-purple-300">@{buildRequest.author.username}</p>
            </div>
          </div>

          <p className="text-lg mb-4 text-purple-100 whitespace-pre-wrap break-words overflow-hidden overflow-wrap-anywhere">
            {buildRequest.text}
          </p>

          {buildRequest.embeds && buildRequest.embeds.length > 0 && (
            <div className="mb-4 space-y-3">
              {buildRequest.embeds.map((embed, index) => (
                <div key={index}>
                  {embed.cast ? (
                    <EmbeddedCastCard cast={embed.cast} />
                  ) : embed.url ? (
                    <div className="mt-2 overflow-hidden">
                      {isImageUrl(embed.url) ||
                      embed.metadata?.html?.ogImage?.[0]?.url ? (
                        <div className="relative w-full rounded-lg overflow-hidden bg-purple-800/50">
                          <div className="relative aspect-[16/9]">
                            <SafeImage
                              src={
                                isImageUrl(embed.url)
                                  ? embed.url
                                  : embed.metadata?.html?.ogImage?.[0]?.url ||
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

          <div className="flex items-center space-x-4">
            <button
              onClick={handleBuildClick}
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg 
                                 bg-gradient-to-r from-emerald-400 to-emerald-300 p-[2px] font-medium text-emerald-900 
                                 shadow-xl shadow-emerald-400/20 transition-all duration-300 hover:shadow-emerald-400/40
                                 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span
                className="relative flex items-center space-x-2 rounded-lg bg-gradient-to-r from-emerald-400 
                                       to-emerald-300 px-6 py-2.5 transition-all duration-200 ease-out group-hover:bg-opacity-0 
                                       group-hover:from-emerald-300 group-hover:to-emerald-200"
              >
                <span className="font-medium">I Built This!</span>
              </span>
            </button>

            <button
              onClick={() => setIsBountyModalOpen(true)}
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg 
                                 bg-gradient-to-r from-yellow-400 to-yellow-300 p-[2px] font-medium text-purple-900 
                                 shadow-xl shadow-yellow-400/20 transition-all duration-300 hover:shadow-yellow-400/40
                                 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span
                className="relative flex items-center space-x-2 rounded-lg bg-gradient-to-r from-yellow-400 
                                       to-yellow-300 px-6 py-2.5 transition-all duration-200 ease-out group-hover:bg-opacity-0 
                                       group-hover:from-yellow-300 group-hover:to-yellow-200"
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
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">Post Bounty</span>
              </span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4 text-purple-100">
            Claims ({claims.length})
          </h2>
          {claims.length === 0 ? (
            <div className="bg-purple-800/30 rounded-xl p-8 shadow-xl backdrop-blur-sm border border-purple-700/50 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-600/30 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-purple-100 mb-2">
                No Claims Yet
              </h3>
              <p className="text-purple-300">
                Looks like no one has built this yet. This could be your chance
                to shine! Why not be the first to build it?
              </p>
              <button
                onClick={handleBuildClick}
                className="mt-6 group relative inline-flex items-center justify-center overflow-hidden rounded-lg 
                                         bg-gradient-to-r from-emerald-400 to-emerald-300 p-[2px] font-medium text-emerald-900 
                                         shadow-xl shadow-emerald-400/20 transition-all duration-300 hover:shadow-emerald-400/40
                                         hover:scale-[1.02] active:scale-[0.98]"
              >
                <span
                  className="relative flex items-center space-x-2 rounded-lg bg-gradient-to-r from-emerald-400 
                                               to-emerald-300 px-6 py-2.5 transition-all duration-200 ease-out group-hover:bg-opacity-0 
                                               group-hover:from-emerald-300 group-hover:to-emerald-200"
                >
                  <span className="font-medium">Be the First to Build It!</span>
                </span>
              </button>
            </div>
          ) : (
            claims.map((claim) => (
              <div
                key={claim.castHash}
                className="bg-purple-800/30 rounded-xl p-6 shadow-xl backdrop-blur-sm border border-purple-700/50"
              >
                <div className="flex flex-col mb-4">
                  <h3 className="font-semibold text-purple-100">
                    {claim.author.displayName}
                  </h3>
                  <p className="text-purple-300">@{claim.author.username}</p>
                </div>
                <p className="text-purple-100 whitespace-pre-wrap break-words overflow-hidden overflow-wrap-anywhere">
                  {claim.text}
                </p>
              </div>
            ))
          )}
        </div>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          message="Sign in with Farcaster to submit your build"
        />
        <ClaimBuildModal
          buildRequest={{
            object: "cast",
            hash: buildRequest.hash,
            thread_hash: buildRequest.hash,
            parent_hash: null,
            parent_url: null,
            root_parent_url: null,
            parent_author: { fid: null },
            text: buildRequest.text,
            timestamp: buildRequest.timestamp,
            embeds: buildRequest.embeds,
            reactions: {
              likes_count:
                "reactions" in buildRequest
                  ? buildRequest.reactions.likes_count
                  : (buildRequest as any).engagement?.likes || 0,
              recasts_count:
                "reactions" in buildRequest
                  ? buildRequest.reactions.recasts_count
                  : (buildRequest as any).engagement?.recasts || 0,
              likes: [],
              recasts: [],
            },
            replies: {
              count:
                "replies" in buildRequest
                  ? buildRequest.replies.count
                  : (buildRequest as any).engagement?.replies || 0,
            },
            mentioned_profiles: buildRequest.mentioned_profiles || [],
            author: buildRequest.author,
            channel: buildRequest.channel,
          }}
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
          onClaimSubmitted={handleClaimSubmitted}
        />
        <BountyModal
          buildRequest={buildRequest}
          isOpen={isBountyModalOpen}
          onClose={() => setIsBountyModalOpen(false)}
        />
      </div>
    </div>
  );
}
