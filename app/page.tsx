'use client';

import { useState, useEffect } from 'react';
import { AuthButton } from '@/components/AuthButton';
import { BuildRequestCard } from '@/components/BuildRequestCard';
import { fetchBuildRequests } from '@/lib/api/client';
import type { BuildRequest } from '@/lib/api/types';

export default function Page() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [buildRequests, setBuildRequests] = useState<BuildRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: e.clientX,
                y: e.clientY,
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const response = await fetchBuildRequests();
                setBuildRequests(response.buildRequests);
                setError(null);
            } catch (err) {
                console.error('Error fetching build requests:', err);
                setError('Failed to load build requests');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        const pollInterval = setInterval(fetchData, 5 * 60 * 1000);

        return () => clearInterval(pollInterval);
    }, []);

    return (
        <div
            className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700 relative"
            data-oid="l:8k62k"
        >
            <div
                className="pointer-events-none fixed inset-0 opacity-50 transition-transform duration-200 ease-out"
                style={{
                    background: `radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, rgba(250, 204, 21, 0.15), transparent 80%)`,
                }}
                data-oid="ghjyjiv"
            />

            {/* Header */}
            <header
                className="relative bg-purple-900 border-b border-purple-700/50"
                data-oid="p..-h92"
            >
                <div className="container relative mx-auto px-6 py-5" data-oid="hsfvgc2">
                    <div className="flex items-center justify-between" data-oid="4yqvi3:">
                        <div className="flex items-center space-x-3" data-oid="4t06.7_">
                            <div
                                className="bg-gradient-to-tr from-yellow-400 to-yellow-300 rounded-lg p-2 shadow-lg shadow-yellow-400/20"
                                data-oid="pcts5fh"
                            >
                                <svg
                                    className="w-6 h-6 text-purple-900"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    data-oid="tqy354f"
                                >
                                    <path
                                        d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.17 3.721 1.596a1 1 0 00.788 0l7-3a1 1 0 000-1.84l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"
                                        data-oid="y441lj:"
                                    />
                                </svg>
                            </div>
                            <h1
                                className="text-2xl font-semibold text-white tracking-tight"
                                data-oid="ia7i2z0"
                            >
                                Someone Build It!
                            </h1>
                        </div>
                        <AuthButton />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8" data-oid="i62x.4b">
                {/* Post Creation */}
                <div
                    className="relative bg-purple-800/90 rounded-xl p-6 mb-8 shadow-xl backdrop-blur-sm border border-purple-700/50"
                    data-oid=".auk5g-"
                >
                    <div className="relative" data-oid="meciz5w">
                        <div className="flex items-center space-x-4 mb-4" data-oid="_eyf0g-">
                            <div
                                className="bg-gradient-to-tr from-yellow-400 to-yellow-300 rounded-lg p-2 shadow-lg shadow-yellow-400/20"
                                data-oid="0z8--it"
                            >
                                <svg
                                    className="w-5 h-5 text-purple-900"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    data-oid="jsv3c1j"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                        data-oid="uczuirj"
                                    />
                                </svg>
                            </div>
                            <h2
                                className="text-xl font-semibold text-white tracking-tight"
                                data-oid="j5-k_6y"
                            >
                                Post Your Build Idea
                            </h2>
                        </div>
                        <textarea
                            className="w-full bg-purple-900/50 text-white rounded-lg p-4 border border-purple-600/50 focus:border-yellow-400/50 focus:outline-none shadow-inner backdrop-blur-sm placeholder-purple-300/50"
                            placeholder="Describe what you'd like someone to build..."
                            rows={3}
                            data-oid="246e8a3"
                        />

                        <button
                            className="mt-4 group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-300 p-[2px] font-medium text-purple-900 shadow-xl shadow-yellow-400/20 transition-all duration-300 hover:shadow-yellow-400/40"
                            data-oid=":isatza"
                        >
                            <span
                                className="relative flex items-center space-x-2 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-300 px-6 py-2.5 transition-all duration-200 ease-out group-hover:bg-opacity-0 group-hover:from-yellow-300 group-hover:to-yellow-200"
                                data-oid="adw.zpx"
                            >
                                <span className="font-medium" data-oid="n.tp9ki">
                                    Post Idea
                                </span>
                            </span>
                        </button>
                    </div>
                </div>

                {/* Posts List */}
                <div className="space-y-6" data-oid="j:wj6o.">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-300 border-t-transparent"></div>
                            <p className="mt-2 text-purple-300">Loading build requests...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <p className="text-red-400">{error}</p>
                            <button 
                                onClick={() => window.location.reload()}
                                className="mt-4 text-purple-300 hover:text-white"
                            >
                                Try again
                            </button>
                        </div>
                    ) : buildRequests.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-purple-300">No build requests found</p>
                        </div>
                    ) : (
                        buildRequests.map((request) => (
                            <BuildRequestCard key={request.hash} buildRequest={request} />
                        ))
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer
                className="relative bg-purple-900 border-t border-purple-700/50 py-8 mt-12"
                data-oid="bjjb47a"
            >
                <div className="container relative mx-auto px-4 text-center" data-oid="ru059:6">
                    <p className="text-purple-200/80 font-medium" data-oid="k0x1:z0">
                        Built with 🔨 by the community, for the community
                    </p>
                </div>
            </footer>
        </div>
    );
}
