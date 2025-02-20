import { BuildRequest, EmbeddedCast, Embed } from '@/lib/api/types';
import { useState } from 'react';
import Link from 'next/link';
import { ClaimBuildModal } from './ClaimBuildModal';
import { AuthModal } from './AuthModal';
import { useAuth } from '@/lib/hooks/useAuth';

interface BuildRequestCardProps {
    buildRequest: BuildRequest;
}

function EmbeddedCastCard({ cast, depth = 0 }: { cast: EmbeddedCast; depth?: number }) {
    const maxDepth = 3; // Prevent infinite nesting

    if (depth >= maxDepth) {
        return (
            <Link
                href={`https://warpcast.com/${cast.author.username}/${cast.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-purple-400 hover:text-purple-300"
                data-oid="f6n3.6g"
            >
                View nested cast by @{cast.author.username}
            </Link>
        );
    }

    return (
        <div
            className={`mt-2 p-4 rounded-lg bg-purple-700/30 border border-purple-600/30 
                       transition-all duration-300 hover:bg-purple-700/40 hover:border-purple-500/40
                       ${depth > 0 ? 'ml-4' : ''}`}
            data-oid="8:vv4ft"
        >
            <div className="flex items-center space-x-2 mb-2" data-oid="aif40xh">
                <Link
                    href={`https://warpcast.com/${cast.author.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-300 hover:text-purple-200 transition-colors duration-200"
                    data-oid="rj0oug8"
                >
                    @{cast.author.username}
                </Link>
            </div>
            <p className="text-purple-200 text-sm whitespace-pre-wrap" data-oid="-6e3055">
                {cast.text}
            </p>

            {/* Nested Embeds */}
            <div className="space-y-2 mt-2" data-oid="s3-zwti">
                {cast.embeds?.map((embed: Embed, index: number) => (
                    <div key={index} data-oid="og3_53i">
                        {embed.cast_id?.hash && embed.cast && (
                            <EmbeddedCastCard
                                cast={embed.cast}
                                depth={depth + 1}
                                data-oid="z4u9qbz"
                            />
                        )}
                        {embed.url && (
                            <Link
                                href={embed.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-purple-400 hover:text-purple-300 block mt-2"
                                data-oid="yxd86ia"
                            >
                                {embed.url}
                            </Link>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function BuildRequestCard({ buildRequest }: BuildRequestCardProps) {
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMessage, setAuthMessage] = useState('');
    const { isAuthenticated } = useAuth();

    // Get engagement metrics from either reactions (Neynar) or engagement (MongoDB)
    const likes =
        'reactions' in buildRequest
            ? buildRequest.reactions.likes_count
            : 'engagement' in buildRequest
              ? (buildRequest as any).engagement.likes
              : 0;
    const recasts =
        'reactions' in buildRequest
            ? buildRequest.reactions.recasts_count
            : 'engagement' in buildRequest
              ? (buildRequest as any).engagement.recasts
              : 0;

    // Calculate engagement score
    const engagementScore = likes + (recasts * 2); // Weigh recasts more heavily

    // Handle date from either Neynar API (timestamp) or MongoDB (publishedAt)
    const date = new Date(
        buildRequest.timestamp ||
            ('publishedAt' in buildRequest ? (buildRequest as any).publishedAt : Date.now()),
    );
    const dateTimeString = date.toISOString();
    const formattedDate = date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    const handleReaction = (type: 'like' | 'recast') => {
        if (!isAuthenticated) {
            setAuthMessage(`Please sign in with Farcaster to ${type} this post`);
            setIsAuthModalOpen(true);
            return;
        }

        // Create Warpcast intent URL
        const intentUrl = new URL('https://warpcast.com/~/compose');
        if (type === 'recast') {
            intentUrl.searchParams.set('text', ''); // Empty text for recast
            intentUrl.searchParams.set('embeds[]', `https://warpcast.com/${buildRequest.author.username}/${buildRequest.hash}`);
        } else {
            // For likes, redirect to the cast directly
            window.open(`https://warpcast.com/${buildRequest.author.username}/${buildRequest.hash}`, '_blank');
            return;
        }

        window.open(intentUrl.toString(), '_blank');
    };

    const handleBuildClick = () => {
        if (!isAuthenticated) {
            setAuthMessage('Please sign in with Farcaster to claim this build');
            setIsAuthModalOpen(true);
            return;
        }
        setIsClaimModalOpen(true);
    };

    return (
        <div
            className="group relative z-0 bg-gradient-to-b from-purple-800 to-purple-800/50 rounded-xl p-6 
                      shadow-xl backdrop-blur-sm border border-purple-700/50 hover:border-yellow-400/50 
                      transition-all duration-300 hover:shadow-yellow-400/5"
            data-oid="w_69agg"
        >
            <div className="relative">
                <div className="flex items-start space-x-4">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                            {/* Engagement Score Badge */}
                            <div className="group/score relative flex items-center">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-fuchsia-400 rounded-md blur-[2px] opacity-50" />
                                <div className="relative bg-gradient-to-r from-purple-400 to-fuchsia-400 px-1.5 py-0.5 rounded-md 
                                              text-sm font-semibold text-purple-900 shadow-sm border border-purple-300/20 
                                              flex items-center space-x-0.5">
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
                                    <div className="bg-purple-900/90 backdrop-blur-sm text-purple-100 text-xs px-2 py-1 rounded-md whitespace-nowrap
                                                  border border-purple-400/20 shadow-xl">
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

                        <p className="text-purple-200 mb-4 whitespace-pre-wrap" data-oid="86e1jcy">
                            {buildRequest.text}
                        </p>

                        {/* Embedded Content */}
                        <div className="space-y-3" data-oid="83qh7ej">
                            {buildRequest.embeds?.map((embed: Embed, index: number) => (
                                <div key={index} data-oid="k0_rfw8">
                                    {embed.cast && (
                                        <EmbeddedCastCard cast={embed.cast} data-oid="ea_v09y" />
                                    )}
                                    {embed.url && (
                                        <Link
                                            href={embed.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-purple-400 hover:text-purple-300 block mt-2"
                                            data-oid="o0:7szq"
                                        >
                                            {embed.url}
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between mt-4" data-oid="s3j_83f">
                            <div
                                className="flex items-center space-x-4 text-purple-300"
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
                                        onClick={() => handleReaction('like')}
                                        className="flex items-center space-x-1 group/like transition-colors"
                                        data-oid="0ng7i42"
                                    >
                                        <svg
                                            className="w-4 h-4 text-purple-400 group-hover/like:text-pink-400 transition-colors"
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
                                    <span className="text-purple-600" data-oid="5w27e_-">
                                        •
                                    </span>
                                    <button
                                        onClick={() => handleReaction('recast')}
                                        className="flex items-center space-x-1 group/recast transition-colors"
                                    >
                                        <svg
                                            className="w-4 h-4 text-purple-400 group-hover/recast:text-green-400 transition-colors"
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
                            <button
                                onClick={handleBuildClick}
                                className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg 
                                         bg-gradient-to-r from-emerald-400 to-emerald-300 p-[2px] font-medium text-emerald-900 
                                         shadow-xl shadow-emerald-400/20 transition-all duration-300 hover:shadow-emerald-400/40
                                         hover:scale-[1.02] active:scale-[0.98]"
                                data-oid="bxp4bi4"
                            >
                                <span
                                    className="relative flex items-center space-x-2 rounded-lg bg-gradient-to-r from-emerald-400 
                                               to-emerald-300 px-6 py-2.5 transition-all duration-200 ease-out group-hover:bg-opacity-0 
                                               group-hover:from-emerald-300 group-hover:to-emerald-200"
                                    data-oid="4ox26cb"
                                >
                                    <svg
                                        className="w-4 h-4 transform transition-transform duration-200 group-hover:translate-x-1"
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
                        </div>
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
        </div>
    );
}
