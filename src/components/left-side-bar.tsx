import { Code, Settings, User, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface LeftSidebarProps {
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

export const trendingTags = [
  "#javascript",
  "#python",
  "#react",
  "#nodejs",
  "#docker",
  "#kubernetes",
  "#aws",
  "#typescript",
];

export function LeftSidebar({ currentUser }: LeftSidebarProps) {
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
          <h3 className="font-semibold text-text-primary mb-4 flex items-center">
            <Zap className="w-4 h-4 mr-2 text-yellow-400" />
            Trending Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {trendingTags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-bg-tertiary text-secondary rounded-sm text-sm hover:bg-bg-quaternary cursor-pointer transition-colors"
              >
                {tag}
              </span>
            ))}
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
