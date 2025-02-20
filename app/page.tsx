'use client';

import { useState, useEffect } from 'react';
import { AuthButton } from '@/components/AuthButton';
import { BuildRequestCard } from '@/components/BuildRequestCard';
import { FilterBar, SortOption } from '@/components/FilterBar';
import { PostBuildModal } from '@/components/PostBuildModal';
import { fetchBuildRequests } from '@/lib/api/client';
import type { BuildRequest } from '@/lib/api/types';

export default function Page() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [buildRequests, setBuildRequests] = useState<BuildRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentSort, setCurrentSort] = useState<SortOption>('top_day');
    const [searchQuery, setSearchQuery] = useState('');
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);

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

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const response = await fetchBuildRequests({
                sort: currentSort,
                search: searchQuery,
            });
            setBuildRequests(response.buildRequests);
            setError(null);
        } catch (err) {
            console.error('Error fetching build requests:', err);
            setError('Failed to load build requests');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const pollInterval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(pollInterval);
    }, [currentSort, searchQuery]);

    const handleSortChange = (sort: SortOption) => {
        setCurrentSort(sort);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700 relative"
            data-oid="ez2n8rb"
        >
            <div
                className="pointer-events-none fixed inset-0 opacity-50 transition-transform duration-200 ease-out"
                style={{
                    background: `radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, rgba(250, 204, 21, 0.15), transparent 80%)`,
                }}
                data-oid="s4vb2r0"
            />

            {/* Header */}
            <header
                className="relative bg-purple-900 border-b border-purple-700/50"
                data-oid="z47:kmg"
            >
                <div className="container relative mx-auto px-6 py-5" data-oid="gi9ncjk">
                    <div className="flex items-center justify-between" data-oid="n8aae65">
                        <div className="flex items-center space-x-3" data-oid="119hi3m">
                            <div
                                className="bg-gradient-to-tr from-yellow-400 to-yellow-300 rounded-lg p-2 shadow-lg shadow-yellow-400/20"
                                data-oid="ce6al0-"
                            >
                                <svg
                                    className="w-6 h-6 text-purple-900"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    data-oid="s32lkhc"
                                >
                                    <path
                                        d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.17 3.721 1.596a1 1 0 00.788 0l7-3a1 1 0 000-1.84l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"
                                        data-oid="mgla9.7"
                                    />
                                </svg>
                            </div>
                            <h1
                                className="text-2xl font-semibold text-white tracking-tight"
                                data-oid="294nxep"
                            >
                                Someone Build IIt
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4" data-oid="ouvej7p">
                            <button
                                onClick={() => setIsPostModalOpen(true)}
                                className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg 
                                         bg-gradient-to-r from-yellow-400 to-yellow-300 p-[2px] font-medium text-purple-900 
                                         shadow-xl shadow-yellow-400/20 transition-all duration-300 hover:shadow-yellow-400/40"
                                data-oid="yhfinvo"
                            >
                                <span
                                    className="relative flex items-center space-x-2 rounded-lg bg-gradient-to-r from-yellow-400 
                                               to-yellow-300 px-4 py-3 transition-all duration-200 ease-out group-hover:bg-opacity-0 
                                               group-hover:from-yellow-300 group-hover:to-yellow-200"
                                    data-oid="k41asoo"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        data-oid="t19e:07"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                            data-oid=":sj2bt2"
                                        />
                                    </svg>
                                    <span data-oid="3nrs2j3">Post Idea</span>
                                </span>
                            </button>
                            <AuthButton data-oid="f18zd9." />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8" data-oid="fw9:op-">
                {/* Filter Bar */}
                <FilterBar
                    currentSort={currentSort}
                    onSortChange={handleSortChange}
                    onSearch={handleSearch}
                    data-oid="oj96_ek"
                />

                {/* Posts List */}
                <div className="space-y-6" data-oid="ic08_3o">
                    {isLoading ? (
                        <div className="text-center py-8" data-oid="nixsv:x">
                            <div
                                className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-300 border-t-transparent"
                                data-oid="1xlx3go"
                            ></div>
                            <p className="mt-2 text-purple-300" data-oid="us-x0e2">
                                Loading build requests...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8" data-oid="bry72ud">
                            <p className="text-red-400" data-oid="h14cj31">
                                {error}
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 text-purple-300 hover:text-white"
                                data-oid="46ev_fw"
                            >
                                Try again
                            </button>
                        </div>
                    ) : buildRequests.length === 0 ? (
                        <div className="text-center py-8" data-oid="3petdnz">
                            <p className="text-purple-300" data-oid="12.ia5s">
                                No build requests found
                            </p>
                        </div>
                    ) : (
                        buildRequests.map((request) => (
                            <BuildRequestCard
                                key={request.hash}
                                buildRequest={request}
                                data-oid="t72tmoi"
                            />
                        ))
                    )}
                </div>
            </main>

            {/* Post Build Modal */}
            <PostBuildModal
                isOpen={isPostModalOpen}
                onClose={() => setIsPostModalOpen(false)}
                data-oid="8v:8hd9"
            />

            {/* Footer */}
            <footer
                className="relative bg-purple-900 border-t border-purple-700/50 py-8 mt-12"
                data-oid="2:zdyh6"
            >
                <div className="container relative mx-auto px-4 text-center" data-oid="-fwfopw">
                    <p className="text-purple-200/80 font-medium" data-oid="tzs9:yh">
                        Built with 🔨 by the community, for the community
                    </p>
                </div>
            </footer>
        </div>
    );
}
