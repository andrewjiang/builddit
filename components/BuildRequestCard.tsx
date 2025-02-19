import { BuildRequest, EmbeddedCast, Embed } from '@/lib/api/types';
import Link from 'next/link';

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
        >
            <div className="flex items-center space-x-2 mb-2">
                <Link
                    href={`https://warpcast.com/${cast.author.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-300 hover:text-purple-200 transition-colors duration-200"
                >
                    @{cast.author.username}
                </Link>
            </div>
            <p className="text-purple-200 text-sm whitespace-pre-wrap">{cast.text}</p>
            
            {/* Nested Embeds */}
            <div className="space-y-2 mt-2">
                {cast.embeds?.map((embed: Embed, index: number) => (
                    <div key={index}>
                        {embed.cast_id?.hash && embed.cast && (
                            <EmbeddedCastCard 
                                cast={embed.cast} 
                                depth={depth + 1}
                            />
                        )}
                        {embed.url && (
                            <Link
                                href={embed.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-purple-400 hover:text-purple-300 block mt-2"
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
    return (
        <div className="group relative bg-gradient-to-b from-purple-800 to-purple-800/50 rounded-xl p-6 
                      shadow-xl backdrop-blur-sm border border-purple-700/50 hover:border-yellow-400/50 
                      transition-all duration-300 hover:shadow-yellow-400/5">
            <div className="relative">
                <div className="flex items-start space-x-4">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                            <Link
                                href={`https://warpcast.com/${buildRequest.author.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-300 hover:text-purple-200 transition-colors duration-200"
                            >
                                @{buildRequest.author.username}
                            </Link>
                        </div>
                        <p className="text-purple-200 mb-4 whitespace-pre-wrap">
                            {buildRequest.text}
                        </p>

                        {/* Embedded Content */}
                        <div className="space-y-3">
                            {buildRequest.embeds?.map((embed: Embed, index: number) => (
                                <div key={index}>
                                    {embed.cast && <EmbeddedCastCard cast={embed.cast} />}
                                    {embed.url && (
                                        <Link
                                            href={embed.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-purple-400 hover:text-purple-300 block mt-2"
                                        >
                                            {embed.url}
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-4 text-purple-300">
                                <time 
                                    dateTime={buildRequest.timestamp}
                                    className="text-purple-400"
                                >
                                    {new Date(buildRequest.timestamp).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </time>
                                <span className="text-purple-600">•</span>
                                <div className="flex items-center space-x-3">
                                    <span className="flex items-center space-x-1">
                                        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                        <span>{buildRequest.reactions.likes_count}</span>
                                    </span>
                                    <span className="text-purple-600">•</span>
                                    <span className="flex items-center space-x-1">
                                        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                                        </svg>
                                        <span>{buildRequest.reactions.recasts_count}</span>
                                    </span>
                                </div>
                            </div>
                            <button className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg 
                                           bg-gradient-to-r from-emerald-400 to-emerald-300 p-[2px] font-medium text-emerald-900 
                                           shadow-xl shadow-emerald-400/20 transition-all duration-300 hover:shadow-emerald-400/40
                                           hover:scale-[1.02] active:scale-[0.98]">
                                <span className="relative flex items-center space-x-2 rounded-lg bg-gradient-to-r from-emerald-400 
                                               to-emerald-300 px-6 py-2.5 transition-all duration-200 ease-out group-hover:bg-opacity-0 
                                               group-hover:from-emerald-300 group-hover:to-emerald-200">
                                    <svg
                                        className="w-4 h-4 transform transition-transform duration-200 group-hover:translate-x-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                                        />
                                    </svg>
                                    <span className="font-medium">
                                        I Built This!
                                    </span>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 