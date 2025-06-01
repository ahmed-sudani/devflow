"use client";

import { useLoginModal } from "@/hooks/use-login-modal";
import { toggleUserFollowing } from "@/lib/actions/post"; // Existing action
import { PostWithUser, User as UserType } from "@/types";
import { format } from "date-fns";
import {
  Calendar,
  Code,
  MessageCircle,
  MoreHorizontal,
  Settings,
  User,
  UserMinus,
  UserPlus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LoginModal } from "./login-modal";
import { PostsList } from "./posts-list";

interface ProfileClientProps {
  profileUser: UserType & {
    isFollowing: boolean;
  };
  userPosts: PostWithUser[];
  isOwnProfile: boolean;
}

// Updated section of your ProfileClient component
// Add this import at the top
import { useChat } from "@/contexts/chat-context";

// Replace the Message button section with this updated version:
export default function ProfileClient({
  profileUser,
  userPosts,
  isOwnProfile,
}: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "about">("posts");
  const [isFollowing, setIsFollowing] = useState(profileUser.isFollowing);
  const [followersCount, setFollowersCount] = useState(
    profileUser.followersCount
  );
  const { isOpen, action, requireAuth, closeModal } = useLoginModal();
  const { startConversation } = useChat(); // Add this line

  const handleFollow = async (userId: string, userName: string) => {
    requireAuth(`follow @${userName}`, async () => {
      try {
        const result = await toggleUserFollowing(userId);
        if (result.success) {
          setIsFollowing(!!result.following);
          if (profileUser.followersCount) {
            setFollowersCount((prev) =>
              result.following ? prev! + 1 : prev! - 1
            );
          }
        }
      } catch (err) {
        console.error("Follow action failed", err);
      }
    });
  };

  // Add this function
  const handleMessageClick = () => {
    requireAuth(`message ${profileUser.name}`, async () => {
      await startConversation(profileUser.id);
    });
  };

  return (
    <>
      <div className="pt-16 max-w-4xl mx-auto px-4 py-6 mt-6">
        {/* Profile Header */}
        <div className="bg-bg-secondary rounded-lg border border-border-primary p-6 mb-6 shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Image
              src={profileUser.image || ""}
              alt={profileUser.name || "User"}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover"
            />

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-bold text-text-primary">
                      {profileUser.name || "Anonymous User"}
                    </h1>
                    {profileUser.badge && (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-primary/20 text-primary rounded-md">
                        <Code className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {profileUser.badge}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-text-secondary mb-1">
                    {profileUser.username
                      ? `@${profileUser.username}`
                      : "@anonymous"}
                  </p>
                  <div className="flex items-center text-text-secondary text-sm space-x-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Joined {format(profileUser.createdAt, "MMMM yyyy")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                  {isOwnProfile ? (
                    <Link
                      href="/settings"
                      className="flex items-center space-x-2 px-4 py-2 bg-bg-tertiary border border-border-secondary rounded-md hover:bg-bg-quaternary transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                  ) : (
                    <>
                      <button
                        onClick={handleMessageClick}
                        className="flex items-center space-x-2 px-4 py-2 bg-bg-tertiary border border-border-secondary rounded-md hover:bg-bg-quaternary transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Message</span>
                      </button>
                      <button
                        onClick={() =>
                          handleFollow(
                            profileUser.id,
                            profileUser.username || profileUser.name || "User"
                          )
                        }
                        className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 ${
                          isFollowing
                            ? "bg-bg-tertiary border border-border-secondary hover:bg-bg-quaternary text-text-primary"
                            : "bg-primary text-white hover:bg-primary-dark"
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <UserMinus className="w-4 h-4" />
                            <span>Unfollow</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                      <button className="p-2 bg-bg-tertiary border border-border-secondary rounded-md hover:bg-bg-quaternary transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Stats section remains the same... */}
              <div className="flex items-center space-x-6 mt-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-text-primary">
                    {userPosts.length}
                  </p>
                  <p className="text-sm text-text-secondary">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-text-primary">
                    {followersCount}
                  </p>
                  <p className="text-sm text-text-secondary">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-text-primary">
                    {profileUser.followingCount}
                  </p>
                  <p className="text-sm text-text-secondary">Following</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-text-primary">
                    {userPosts.reduce((acc, post) => acc + post.likesCount, 0)}
                  </p>
                  <p className="text-sm text-text-secondary">Likes</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rest of the component remains the same... */}
        {/* Tabs */}
        <div className="bg-bg-secondary rounded-lg border border-border-primary mb-6 shadow-md">
          <div className="flex border-b border-border-primary">
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === "posts"
                  ? "text-primary border-b-2 border-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Posts ({userPosts.length})
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === "about"
                  ? "text-primary border-b-2 border-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              About
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "posts" && (
          <div className="space-y-6">
            {userPosts.length > 0 ? (
              <PostsList posts={userPosts} />
            ) : (
              <div className="bg-bg-secondary rounded-lg border border-border-primary p-12 text-center">
                <User className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  No posts yet
                </h3>
                <p className="text-text-secondary">
                  {isOwnProfile
                    ? "Share your first post to get started!"
                    : `${profileUser.name} hasn't shared any posts yet.`}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "about" && (
          <div className="bg-bg-secondary rounded-lg border border-border-primary p-6 shadow-md">
            <h3 className="text-xl font-semibold text-text-primary mb-4">
              About
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-text-primary mb-2">
                  Contact Information
                </h4>
                <div className="space-y-2 text-text-secondary">
                  <p>Email: {profileUser.email || "Not provided"}</p>
                  <p>
                    Username:{" "}
                    {profileUser.username
                      ? `@${profileUser.username}`
                      : "Not set"}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-text-primary mb-2">
                  Member Since
                </h4>
                <p className="text-text-secondary">
                  {format(profileUser.createdAt, "MMMM dd, yyyy")}
                </p>
              </div>
              {profileUser.badge && (
                <div>
                  <h4 className="font-medium text-text-primary mb-2">Badge</h4>
                  <div className="flex items-center space-x-2">
                    <Code className="w-4 h-4 text-primary" />
                    <span className="text-primary font-medium">
                      {profileUser.badge}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <LoginModal isOpen={isOpen} onClose={closeModal} action={action} />
    </>
  );
}
