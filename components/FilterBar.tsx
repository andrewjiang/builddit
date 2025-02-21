import { Fragment, useState } from "react";
import { Popover, Transition } from "@headlessui/react";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { createPortal } from "react-dom";

export type SortOption =
  | "top_day"
  | "top_week"
  | "top_month"
  | "top_all"
  | "newest";
export type TimeWindow = "day" | "week" | "month" | "all";

interface FilterBarProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onSearch: (query: string) => void;
}

const timeWindows = [
  { id: "day", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "all", label: "All Time" },
] as const;

export function FilterBar({
  currentSort,
  onSortChange,
  onSearch,
}: FilterBarProps) {
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);

  const keywords = [
    { id: "frame", label: "Frame" },
    { id: "game", label: "Game" },
    { id: "base", label: "Base" },
  ];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("search") as string;
    onSearch(query);
  };

  const handleKeywordClick = (keyword: string) => {
    setActiveKeyword(activeKeyword === keyword ? null : keyword);
    onSearch(activeKeyword === keyword ? "" : keyword);
  };

  return (
    <div className="relative isolate z-10 bg-purple-500/10 rounded-xl p-4 mb-6 shadow-xl backdrop-blur-sm border border-purple-400/20">
      <div className="flex flex-col space-y-4">
        {/* Sort and Search Row */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center space-y-4 md:space-y-0">
          {/* Sort Options */}
          <div className="flex items-center space-x-4">
            <span className="text-purple-100 font-medium text-sm md:text-base">
              Sort by:
            </span>
            <div className="flex items-center space-x-2">
              {/* Newest Button */}
              <button
                onClick={() => onSortChange("newest")}
                className={`
                                    px-2.5 md:px-3 py-1.5 rounded-lg font-medium transition-all duration-200
                                    text-sm md:text-base
                                    ${
                                      currentSort === "newest"
                                        ? "bg-purple-200 text-purple-900"
                                        : "text-purple-100 hover:bg-purple-500/20"
                                    }
                                `}
              >
                Newest
              </button>

              {/* Top Dropdown */}
              <Popover className="relative">
                {({ open, close }) => (
                  <>
                    <Popover.Button
                      className={`
                                                inline-flex items-center px-2.5 md:px-3 py-1.5 rounded-lg font-medium 
                                                transition-all duration-200 space-x-1 text-sm md:text-base
                                                ${
                                                  currentSort.startsWith("top_")
                                                    ? "bg-purple-200 text-purple-900"
                                                    : "text-purple-100 hover:bg-purple-500/20"
                                                }
                                            `}
                    >
                      <span>Top</span>
                      {currentSort.startsWith("top_") && (
                        <span className="opacity-90 hidden md:inline">
                          :{" "}
                          {
                            timeWindows.find(
                              (tw) => currentSort === `top_${tw.id}`,
                            )?.label
                          }
                        </span>
                      )}
                      <ChevronDownIcon
                        className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </Popover.Button>

                    <Transition
                      as="div"
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                      className="absolute left-0 md:top-full top-[120%] z-50"
                    >
                      <Popover.Panel className="relative mt-1 w-48 rounded-lg bg-purple-900 shadow-xl border border-purple-400/20 focus:outline-none">
                        <div className="py-1">
                          {timeWindows.map((window) => (
                            <button
                              key={window.id}
                              onClick={() => {
                                onSortChange(`top_${window.id}` as SortOption);
                                close();
                              }}
                              className={`
                                                                w-full px-4 py-2 text-left text-white hover:bg-purple-800
                                                                text-sm md:text-base
                                                                ${currentSort === `top_${window.id}` ? "bg-purple-800 font-medium" : ""}
                                                                first:rounded-t-lg last:rounded-b-lg
                                                            `}
                            >
                              {window.label}
                            </button>
                          ))}
                        </div>
                      </Popover.Panel>
                    </Transition>
                  </>
                )}
              </Popover>
            </div>
          </div>

          {/* Search and Quick Filters */}
          <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:space-x-4 md:justify-end">
            {/* Search Bar */}
            <form
              onSubmit={handleSubmit}
              className="w-full md:w-64 order-1 md:order-2"
            >
              <div className="relative">
                <input
                  type="search"
                  name="search"
                  placeholder="Search build requests..."
                  className="w-full bg-purple-600/20 text-white rounded-lg pl-4 pr-10 py-2 
                                             border border-purple-400/20 focus:border-purple-300/50 focus:outline-none 
                                             shadow-inner backdrop-blur-sm placeholder-purple-300/50"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-200 
                                             hover:text-purple-100 transition-colors duration-200"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Quick Filters */}
            <div className="flex items-center space-x-2 md:flex-shrink-0 order-2 pr-2 md:order-1">
              {keywords.map((keyword) => (
                <button
                  key={keyword.id}
                  onClick={() => handleKeywordClick(keyword.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm
                                        ${
                                          activeKeyword === keyword.id
                                            ? "bg-yellow-400 text-purple-900"
                                            : "bg-purple-600/20 text-purple-100 hover:bg-purple-500/20"
                                        }`}
                >
                  {keyword.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
