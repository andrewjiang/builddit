"use client";

import { BuildRequest, EmbeddedCast, Embed } from "@/lib/api/types";
import { IBuildClaim } from "@/lib/db/models/BuildClaim";
import { ClaimBuildModal } from "./ClaimBuildModal";
import { useState } from "react";
import Link from "next/link";
import { SafeImage } from "./SafeImage";
import { useAuth } from "@/lib/hooks/useAuth";
import { AuthModal } from "./AuthModal";

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
        className="text-purple-300 hover:text-purple-200 text-sm"
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
      <p className="text-purple-100 whitespace-pre-wrap mb-3">{cast.text}</p>
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
                    <h4 className="font-medium text-purple-100">
                      {embed.metadata.html.ogTitle}
                    </h4>
                  )}
                  {embed.metadata?.html?.ogDescription && (
                    <p className="text-purple-300 text-sm mt-1">
                      {embed.metadata.html.ogDescription}
                    </p>
                  )}
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BuildRequestDetails({
  buildRequest,
  claims,
}: BuildRequestDetailsProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700 relative">
      <div
        className="pointer-events-none fixed inset-0 opacity-50 transition-transform duration-200 ease-out"
        style={{
          background: `radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, rgba(250, 204, 21, 0.15), transparent 80%)`,
        }}
      />
      <div className="container mx-auto px-4 py-8">
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

          <p className="text-lg mb-4 text-purple-100 whitespace-pre-wrap">
            {buildRequest.text}
          </p>

          {buildRequest.embeds && buildRequest.embeds.length > 0 && (
            <div className="mb-4 space-y-3">
              {buildRequest.embeds.map((embed, index) => (
                <div key={index}>
                  {embed.cast ? (
                    <EmbeddedCastCard cast={embed.cast} />
                  ) : embed.url ? (
                    <a
                      href={embed.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-purple-900/50 rounded-lg p-4 hover:bg-purple-900/70 border border-purple-600/30 transition-colors"
                    >
                      {embed.metadata?.html?.ogTitle && (
                        <h3 className="font-semibold text-purple-100">
                          {embed.metadata.html.ogTitle}
                        </h3>
                      )}
                      {embed.metadata?.html?.ogDescription && (
                        <p className="text-purple-300 mt-1">
                          {embed.metadata.html.ogDescription}
                        </p>
                      )}
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() =>
              isAuthenticated
                ? setIsClaimModalOpen(true)
                : setIsAuthModalOpen(true)
            }
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
                onClick={() =>
                  isAuthenticated
                    ? setIsClaimModalOpen(true)
                    : setIsAuthModalOpen(true)
                }
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
                <div className="flex items-center mb-4">
                  {claim.author.pfpUrl && (
                    <SafeImage
                      src={claim.author.pfpUrl}
                      alt={claim.author.username}
                      className="w-8 h-8 rounded-full mr-3"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-purple-100">
                      {claim.author.displayName}
                    </h3>
                    <p className="text-purple-300">@{claim.author.username}</p>
                  </div>
                </div>
                <p className="text-purple-100 whitespace-pre-wrap">
                  {claim.text}
                </p>
              </div>
            ))
          )}
        </div>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          message="Please sign in with Farcaster to claim this build"
        />
        <ClaimBuildModal
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
          buildRequest={buildRequest}
        />
      </div>
    </div>
  );
}
