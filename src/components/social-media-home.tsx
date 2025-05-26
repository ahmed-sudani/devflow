"use client";

import { PostWithUser, SuggestedUser, getPosts } from "@/lib/fetchers/post";
import { useState } from "react";
import { LeftSidebar } from "./left-side-bar";
import { PostFilter } from "./posts-filter";
import { PostsList } from "./posts-list";
import { RightSidebar } from "./right-side-bar";

interface HomePageProps {
  initialPosts: PostWithUser[];
  initialSuggestedUsers: SuggestedUser[];
  currentUser: {
    id: string;
    name: string | null;
    username: string | null;
    badge: string | null;
    image: string | null;
    followersCount: number;
    followingCount: number;
  } | null;
}

export default function SocialMediaHome({
  initialPosts,
  initialSuggestedUsers,
  currentUser,
}: HomePageProps) {
  const [posts, setPosts] = useState<PostWithUser[]>(initialPosts);
  const [currentFilter, setCurrentFilter] = useState<
    "recent" | "following" | "bookmarks"
  >("recent");
  const [isLoading, setIsLoading] = useState(false);

  const handleFilterChange = async (
    filter: "recent" | "following" | "bookmarks"
  ) => {
    if (filter === currentFilter) return;

    setCurrentFilter(filter);
    setIsLoading(true);

    try {
      const newPosts = await getPosts(filter);
      setPosts(newPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-16 max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-6">
        {/* Left Sidebar */}
        <LeftSidebar currentUser={currentUser} />

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <PostFilter
            currentFilter={currentFilter}
            onFilterChange={handleFilterChange}
          />

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <PostsList posts={posts} />
          )}
        </div>

        {/* Right Sidebar */}
        <RightSidebar suggestedUsers={initialSuggestedUsers} />
      </div>
    </div>
  );
}
