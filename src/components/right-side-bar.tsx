"use client";

import { useLoginModal } from "@/hooks/use-login-modal";
import { toggleUserFollowing } from "@/lib/actions/post";
import { SuggestedUser } from "@/types";
import { Coffee } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-toastify";
import { LoginModal } from "./login-modal";

interface RightSidebarProps {
  initialSuggestedUsers: SuggestedUser[];
}

export function RightSidebar({ initialSuggestedUsers }: RightSidebarProps) {
  const { isOpen, action, requireAuth, closeModal } = useLoginModal();

  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>(
    initialSuggestedUsers
  );
  const [userFollowState, setUserFollowState] = useState<
    Record<string, boolean>
  >({});

  const handleFollow = async (userId: string, userName: string) => {
    requireAuth(`follow @${userName}`, async () => {
      try {
        const result = await toggleUserFollowing(userId);

        if (result.success) {
          const isFollowing = !!result.following;

          // Show toast message
          toast.success(
            isFollowing
              ? `You followed @${userName}`
              : `You unfollowed @${userName}`,
            {
              hideProgressBar: false,
              progressClassName: "bg-primary",
              onClose() {
                // If followed, remove from list after 3 seconds
                if (isFollowing) {
                  setSuggestedUsers((prev) =>
                    prev.filter((user) => user.id !== userId)
                  );
                }
              },
            }
          );

          // Update follow state
          setUserFollowState((prev) => ({
            ...prev,
            [userId]: isFollowing,
          }));
        } else {
          toast.error(result.error || "Action failed");
        }
      } catch (err) {
        console.error("Follow action failed", err);
        toast.error("Something went wrong");
      }
    });
  };

  return (
    <>
      <div className="hidden lg:block">
        <div className="sticky top-24 space-y-6">
          {/* Suggested Users */}
          <div className="bg-bg-secondary rounded-lg p-6 border border-border-primary shadow-md">
            <h3 className="font-semibold text-text-primary mb-4">
              Suggested Users
            </h3>
            <div className="space-y-4">
              {suggestedUsers.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-md">
                    <Image
                      src={suggestion.image || ""}
                      alt={suggestion.name || ""}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-text-primary text-sm">
                        {suggestion.name || "Anonymous"}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {suggestion.username || "@anonymous"}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-text-secondary">
                          {suggestion.followersCount} followers
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleFollow(suggestion.id, suggestion.username || "user")
                    }
                    className={`${
                      userFollowState[suggestion.id]
                        ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                        : "bg-primary text-white hover:bg-primary-dark"
                    } px-3 py-1.5 rounded-md text-sm font-medium transition-colors`}
                  >
                    {userFollowState[suggestion.id] ? "Unfollow" : "Follow"}
                  </button>
                </div>
              ))}
            </div>

            {suggestedUsers.length === 0 && (
              <p className="text-text-secondary text-sm text-center py-4">
                No suggestions available
              </p>
            )}
          </div>

          {/* Premium Upgrade */}
          <div className="bg-gradient-to-br from-primary to-secondary rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center mb-2">
              <Coffee className="w-5 h-5 mr-2" />
              <h3 className="font-semibold">DevFlow Pro</h3>
            </div>
            <p className="text-sm text-green-100 mb-4">
              Unlock premium developer tools and features
            </p>
            <ul className="text-sm text-green-100 mb-4 space-y-1">
              <li>• Advanced analytics</li>
              <li>• Private repositories</li>
              <li>• Priority support</li>
            </ul>
            <button className="bg-white text-primary px-4 py-2 rounded-md text-sm font-medium hover:bg-green-50 transition-colors w-full">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>

      <LoginModal isOpen={isOpen} onClose={closeModal} action={action} />
    </>
  );
}
