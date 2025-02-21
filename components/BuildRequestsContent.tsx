"use client";

import { useState, useEffect } from "react";
import { AuthButton } from "@/components/AuthButton";
import { BuildRequestCard } from "@/components/BuildRequestCard";
import { FilterBar, SortOption } from "@/components/FilterBar";
import { PostBuildModal } from "@/components/PostBuildModal";
import { fetchBuildRequests } from "@/lib/api/client";
import type { BuildRequest } from "@/lib/api/types";

interface BuildRequestsContentProps {
  initialBuildRequests: BuildRequest[];
}

export function BuildRequestsContent({
  initialBuildRequests,
}: BuildRequestsContentProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [buildRequests, setBuildRequests] =
    useState<BuildRequest[]>(initialBuildRequests);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSort, setCurrentSort] = useState<SortOption>("top_week");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const fetchData = async (isPolling = false) => {
    try {
      setIsLoading(!isPolling); // Only show loading state for manual fetches
      const response = await fetchBuildRequests({
        sort: currentSort,
        search: searchQuery,
      });

      if (!response.buildRequests) return;

      if (isPolling) {
        // Silently merge new posts with existing ones
        setBuildRequests((prevRequests) => {
          const merged = [...response.buildRequests, ...prevRequests];
          // Remove duplicates while preserving order
          const uniquePosts = merged.filter(
            (post, index, self) =>
              index === self.findIndex((p) => p.hash === post.hash),
          );
          // Sort by timestamp
          return uniquePosts.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          );
        });
      } else {
        setBuildRequests(response.buildRequests);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching build requests:", err);
      if (!isPolling) {
        setError("Failed to load build requests");
      }
    } finally {
      if (!isPolling) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    // Always fetch when sort or search changes
    fetchData();

    // Set up polling
    let pollInterval: NodeJS.Timeout;

    const startPolling = () => {
      pollInterval = setInterval(() => {
        fetchData(true);
      }, 30000); // Poll every 30 seconds
    };

    // Start polling
    startPolling();

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [currentSort, searchQuery]);

  const handleSortChange = (sort: SortOption) => {
    if (sort === currentSort) return; // Prevent unnecessary updates
    setCurrentSort(sort);
    setIsLoading(true); // Show loading state immediately
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700 relative">
      <div
        className="pointer-events-none fixed inset-0 opacity-50 transition-transform duration-200 ease-out"
        style={{
          background: `radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, rgba(250, 204, 21, 0.15), transparent 80%)`,
        }}
      />

      {/* Header */}
      <header className="relative bg-purple-900 border-b border-purple-700/50">
        <div className="container relative mx-auto px-4 py-4">
          <div className="flex flex-col">
            {/* Logo, Title, and Mobile Menu Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className="bg-gradient-to-tr from-yellow-400 to-yellow-300 rounded-lg p-2 shadow-lg shadow-yellow-400/20
                                             flex items-center justify-center"
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    minWidth: "2.5rem",
                    minHeight: "2.5rem",
                  }}
                >
                  <span
                    className="flex items-center justify-center"
                    role="img"
                    aria-label="tools"
                    style={{ fontSize: "1.25rem", lineHeight: 1 }}
                  >
                    🛠️
                  </span>
                </div>
                <div className="ml-3">
                  <h1 className="text-2xl font-semibold text-white tracking-tight">
                    Someone Build
                  </h1>
                  <p className="text-sm text-purple-300 mt-0.5">
                    <span className="hidden md:inline">Explore and fulfill requests in{" "}</span>
                    <span className="md:hidden">An explorer for{" "}</span>
                    <a
                      href="https://warpcast.com/~/channel/someone-build"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-yellow-400 hover:text-yellow-300 transition-colors"
                    >
                      /someone-build
                    </a>
                  </p>
                </div>
              </div>

              {/* Desktop Buttons */}
              <div className="hidden md:flex items-center space-x-3">
                <button
                  onClick={() => setIsPostModalOpen(true)}
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg 
                                             bg-gradient-to-r from-yellow-400 to-yellow-300 p-[2px] font-medium text-purple-900 
                                             shadow-xl shadow-yellow-400/20 transition-all duration-300 hover:shadow-yellow-400/40"
                >
                  <span
                    className="relative flex items-center space-x-2 rounded-lg bg-gradient-to-r from-yellow-400 
                                                   to-yellow-300 px-4 py-3 transition-all duration-200 ease-out group-hover:bg-opacity-0 
                                                   group-hover:from-yellow-300 group-hover:to-yellow-200"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <span>New Request</span>
                  </span>
                </button>
                <div className="flex-shrink-0">
                  <AuthButton />
                </div>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-purple-200 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>

            {/* Mobile Menu */}
            <div
              className={`md:hidden ${isMobileMenuOpen ? "block" : "hidden"} pt-4`}
            >
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    setIsPostModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg 
                                             bg-gradient-to-r from-yellow-400 to-yellow-300 p-[2px] font-medium text-purple-900 
                                             shadow-xl shadow-yellow-400/20 transition-all duration-300 hover:shadow-yellow-400/40
                                             w-full"
                >
                  <span
                    className="relative flex items-center space-x-2 rounded-lg bg-gradient-to-r from-yellow-400 
                                                   to-yellow-300 px-4 py-2.5 transition-all duration-200 ease-out group-hover:bg-opacity-0 
                                                   group-hover:from-yellow-300 group-hover:to-yellow-200 w-full justify-center"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <span>New Request</span>
                  </span>
                </button>
                <div className="flex-shrink-0">
                  <AuthButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filter Bar */}
        <FilterBar
          currentSort={currentSort}
          onSortChange={handleSortChange}
          onSearch={handleSearch}
        />

        {/* Posts List */}
        <div className="space-y-6">
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

      {/* Post Build Modal */}
      <PostBuildModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
      />

      {/* Footer */}
      <footer className="relative bg-purple-900 border-t border-purple-700/50 py-8 mt-12">
        <div className="container relative mx-auto px-4 text-center">
          <p className="text-purple-200/80 font-medium">
            Built by{" "}
            <a
              href="https://warpcast.com/ok"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              @ok
            </a>{" "}
            for the{" "}
            <a
              href="https://warpcast.com/~/channel/someone-build"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              /someone-build
            </a>{" "}
            community
          </p>
        </div>
      </footer>
    </div>
  );
}
