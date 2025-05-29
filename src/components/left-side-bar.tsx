"use client";

import { getTrendingTagsWithTimeframe } from "@/lib/fetchers/post";
import { ApiResult, Timeframe, TrendingTag, User as UserType } from "@/types";
import { Clock, Code, Settings, User, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const timeframeOptions = [
  { value: "day" as Timeframe, label: "24h", icon: "🔥" },
  { value: "week" as Timeframe, label: "7d", icon: "📈" },
  { value: "month" as Timeframe, label: "30d", icon: "📊" },
];

export function LeftSidebar({
  initialTrendingTags,
  currentUser,
}: {
  initialTrendingTags: ApiResult<TrendingTag>;
  currentUser: UserType | null;
}) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("day");
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>(
    initialTrendingTags.success ? initialTrendingTags.data : []
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleTimeframeChange = async (timeframe: Timeframe) => {
    setSelectedTimeframe(timeframe);

    if (timeframe === "day") {
      if (initialTrendingTags.success) {
        setTrendingTags(initialTrendingTags.data);
      }
      return;
    }

    setIsLoading(true);
    try {
      const result = await getTrendingTagsWithTimeframe(timeframe, 3);
      if (result.success) {
        setTrendingTags(result.data);
      }
    } catch (error) {
      console.error("Error fetching trending tags:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className="hidden lg:block">
      <div className="sticky top-24 space-y-6">
        {/* User Profile Card */}
        {currentUser && (
          <div className="bg-bg-secondary rounded-lg p-6 border border-border-primary shadow-md">
            <div className="flex items-center space-x-md mb-4">
              <Image
                src={currentUser.image || "/default-avatar.png"}
                alt="Profile"
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-text-primary">
                  {currentUser.name || "Anonymous"}
                </h3>
                <p className="text-sm text-text-secondary">
                  {currentUser.username || "@anonymous"}
                </p>
                {currentUser.badge && (
                  <div className="flex items-center mt-1">
                    <Code className="w-3 h-3 text-status-success mr-1" />
                    <span className="text-xs text-status-success">
                      {currentUser.badge}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center mb-4">
              <div>
                <p className="font-semibold text-text-primary">
                  {currentUser.followersCount || 0}
                </p>
                <p className="text-xs text-text-secondary">Followers</p>
              </div>
              <div>
                <p className="font-semibold text-text-primary">
                  {currentUser.followingCount || 0}
                </p>
                <p className="text-xs text-text-secondary">Following</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-status-success">
                <div className="w-2 h-2 bg-status-success rounded-full mr-2"></div>
                <span>Available for work</span>
              </div>
            </div>
          </div>
        )}

        {/* Trending Tags */}
        <div className="bg-bg-secondary rounded-lg p-6 border border-border-primary shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary flex items-center">
              <Zap className="w-4 h-4 mr-2 text-yellow-400" />
              Trending Tags
            </h3>
            <Clock className="w-4 h-4 text-text-secondary" />
          </div>

          {/* Timeframe Filter */}
          <div className="flex space-x-1 mb-4 bg-bg-tertiary rounded-md p-1">
            {timeframeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleTimeframeChange(option.value)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  selectedTimeframe === option.value
                    ? "bg-bg-primary text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-quaternary"
                }`}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>

          {/* Tags List */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-text-secondary"></div>
              </div>
            ) : trendingTags.length > 0 ? (
              trendingTags.map((trendingTag, index) => (
                <div
                  key={`${trendingTag.tag}-${index}`}
                  className="flex items-center justify-between p-2 hover:bg-bg-tertiary rounded-md cursor-pointer transition-colors group"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-text-secondary font-mono">
                      #{index + 1}
                    </span>
                    <span className="text-sm text-text-primary group-hover:text-status-info transition-colors">
                      {trendingTag.tag}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-text-secondary bg-bg-quaternary px-2 py-0.5 rounded-full">
                      {formatCount(trendingTag.count)}
                    </span>
                    {trendingTag.avgEngagement &&
                      Number(trendingTag.avgEngagement) > 0 && (
                        <span className="text-xs text-status-success">
                          {Number(trendingTag.avgEngagement).toFixed(1)} avg
                        </span>
                      )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-text-secondary text-sm text-center py-4">
                No trending tags found
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {currentUser && (
          <div className="bg-bg-secondary rounded-lg p-6 border border-border-primary shadow-md">
            <h3 className="font-semibold text-text-primary mb-4">
              Quick Actions
            </h3>
            <div className="space-y-md">
              <Link href={`/profile/${currentUser.id}`}>
                <button className="w-full flex items-center space-x-md p-md rounded-md hover:bg-bg-tertiary transition-colors text-left">
                  <User className="w-5 h-5 text-text-secondary" />
                  <span className="text-text-tertiary">View Profile</span>
                </button>
              </Link>

              <Link href="/settings">
                <button className="w-full flex items-center space-x-md p-md rounded-md hover:bg-bg-tertiary transition-colors text-left">
                  <Settings className="w-5 h-5 text-text-secondary" />
                  <span className="text-text-tertiary">Settings</span>
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
