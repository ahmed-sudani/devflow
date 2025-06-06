"use client";

import { Bookmark, Clock, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { LoginModal } from "../login-modal";
import { useLoginModal } from "@/hooks/use-login-modal";

type FilterType = "recent" | "following" | "bookmarks";

interface PostFilterProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export function PostFilter({ currentFilter, onFilterChange }: PostFilterProps) {
  const { data: session } = useSession();
  const { isOpen, action, requireAuth, closeModal } = useLoginModal();

  const handleFilterChange = (filter: FilterType) => {
    if (filter === "following") {
      requireAuth("filter posts by following", () => {
        onFilterChange(filter);
      });
    } else if (filter === "bookmarks") {
      requireAuth("view your bookmarked posts", () => {
        onFilterChange(filter);
      });
    } else {
      onFilterChange(filter);
    }
  };

  return (
    <>
      <div className="bg-bg-secondary rounded-lg border border-border-primary p-3 sm:p-4 mb-6 shadow-md">
        {/* Mobile Layout */}
        <div className="sm:hidden space-y-3">
          <span className="text-sm font-medium text-text-secondary block">
            Filter posts:
          </span>
          <div className="grid grid-cols-3 gap-2 bg-bg-tertiary p-1 rounded-lg">
            <button
              onClick={() => handleFilterChange("recent")}
              className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-md text-xs font-medium transition-colors ${
                currentFilter === "recent"
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-quaternary"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Recent</span>
            </button>

            <button
              onClick={() => handleFilterChange("following")}
              className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-md text-xs font-medium transition-colors relative ${
                currentFilter === "following"
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-quaternary"
              } ${!session ? "opacity-75" : ""}`}
            >
              <Users className="w-4 h-4" />
              <span>Following</span>
              {!session && (
                <span className="absolute -top-1 -right-1 text-[10px] bg-primary/20 text-primary px-1 py-0.5 rounded-full leading-none">
                  Login
                </span>
              )}
            </button>

            <button
              onClick={() => handleFilterChange("bookmarks")}
              className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-md text-xs font-medium transition-colors relative ${
                currentFilter === "bookmarks"
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-quaternary"
              } ${!session ? "opacity-75" : ""}`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Bookmarks</span>
              {!session && (
                <span className="absolute -top-1 -right-1 text-[10px] bg-primary/20 text-primary px-1 py-0.5 rounded-full leading-none">
                  Login
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center space-x-4">
          <span className="text-sm font-medium text-text-secondary">
            Filter posts:
          </span>
          <div className="flex rounded-lg bg-bg-tertiary p-1">
            <button
              onClick={() => handleFilterChange("recent")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentFilter === "recent"
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-quaternary"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Recent</span>
            </button>

            <button
              onClick={() => handleFilterChange("following")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentFilter === "following"
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-quaternary"
              } ${!session ? "opacity-75" : ""}`}
            >
              <Users className="w-4 h-4" />
              <span>Following</span>
              {!session && (
                <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  Login
                </span>
              )}
            </button>

            <button
              onClick={() => handleFilterChange("bookmarks")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentFilter === "bookmarks"
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-quaternary"
              } ${!session ? "opacity-75" : ""}`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Bookmarks</span>
              {!session && (
                <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  Login
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <LoginModal isOpen={isOpen} onClose={closeModal} action={action} />
    </>
  );
}
