"use client";

import { getPosts } from "@/lib/actions/post";
import {
  ApiResult,
  PostWithUser,
  SuggestedUser,
  TrendingTag,
  User,
} from "@/types";
import { useEffect, useState } from "react";
import { LeftSidebar } from "./left-side-bar";
import Loader from "./loader";
import { PostFilter } from "./posts-filter";
import { PostsList } from "./posts-list";
import { RightSidebar } from "./right-side-bar";

interface HomePageProps {
  initialPosts: PostWithUser[];
  initialTrendingTags: ApiResult<TrendingTag>;
  currentUser: User | null;
  initialSuggestedUsers: SuggestedUser[];
}

export const dynamic = "force-dynamic";

export default function SocialMediaHome({
  initialPosts,
  initialTrendingTags,
  currentUser,
  initialSuggestedUsers,
}: HomePageProps) {
  const [posts, setPosts] = useState<PostWithUser[]>(initialPosts);
  const [currentFilter, setCurrentFilter] = useState<
    "recent" | "following" | "bookmarks"
  >("recent");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => setPosts(initialPosts), [initialPosts]);

  const handleFilterChange = async (
    filter: "recent" | "following" | "bookmarks"
  ) => {
    if (filter === currentFilter) return;

    setCurrentFilter(filter);
    setIsLoading(true);

    try {
      const newPosts = await getPosts({
        sortBy: "recent",
        isFollowing: filter == "following",
        isBookmarked: filter == "bookmarks",
      });
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
        <LeftSidebar
          initialTrendingTags={initialTrendingTags}
          currentUser={currentUser}
        />

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <PostFilter
            currentFilter={currentFilter}
            onFilterChange={handleFilterChange}
          />
          {isLoading ? <Loader /> : <PostsList posts={posts} />}
        </div>

        {/* Right Sidebar */}
        <RightSidebar initialSuggestedUsers={initialSuggestedUsers} />
      </div>
    </div>
  );
}
