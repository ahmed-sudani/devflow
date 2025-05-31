"use client";

import { useLoginModal } from "@/hooks/use-login-modal";
import {
  addComment,
  togglePostBookmark,
  togglePostLike,
} from "@/lib/actions/post";
import { getPostComments } from "@/lib/fetchers/post";
import { CommentWithUser, PostWithUser } from "@/types";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  Star,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import React, { useState, useTransition } from "react";
import PostShare from "./post-share";
import PostComment from "./post-comment";
import { LoginModal } from "./login-modal";

type PostActionsProps = { post: PostWithUser };

const PostActions: React.FC<PostActionsProps> = ({ post }) => {
  const { data: session } = useSession();
  const { isOpen, action, requireAuth, closeModal } = useLoginModal();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComment, setShowComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [loadingComments, setLoadingComments] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);

  const handleBookmark = () => {
    requireAuth("bookmark this post", () => {
      const newIsBookmarked = !isBookmarked;
      setIsBookmarked(newIsBookmarked);

      startTransition(async () => {
        const result = await togglePostBookmark(post.id);
        if (!result.success) {
          setIsBookmarked(!newIsBookmarked);
        }
      });
    });
  };

  const handleLike = () => {
    requireAuth("like this post", () => {
      const newIsLiked = !isLiked;
      const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;

      setIsLiked(newIsLiked);
      setLikesCount(newLikesCount);

      startTransition(async () => {
        const result = await togglePostLike(post.id);
        if (!result.success) {
          setIsLiked(!newIsLiked);
          setLikesCount(likesCount);
        }
      });
    });
  };

  const handleShowComment = () => {
    requireAuth("add a comment", () => {
      setShowComment(!showComment);
    });
  };

  const handleComment = () => {
    if (!commentText.trim()) return;

    startTransition(async () => {
      const result = await addComment(post.id, commentText);
      if (result.success) {
        setCommentText("");
        setShowComment(false);
        setCommentsCount((prev) => prev + 1);
        if (showComments) {
          await fetchComments();
        }
      }
    });
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const result = await getPostComments(post.id);
      setComments(result);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleShowComments = async () => {
    if (!showComments && comments.length === 0) {
      await fetchComments();
    }
    setShowComments(!showComments);
  };

  return (
    <>
      <div className="p-4 border-t border-border-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              disabled={isPending}
              className={`flex items-center space-x-2 transition-colors group ${
                isLiked
                  ? "text-status-error"
                  : "text-text-secondary hover:text-status-error"
              }`}
            >
              <Heart
                className={`w-5 h-5 group-hover:scale-110 transition-transform ${
                  isLiked ? "fill-current" : ""
                }`}
              />
              <span className="text-sm font-medium">{likesCount}</span>
            </button>

            <button
              onClick={handleShowComment}
              className="flex items-center space-x-2 text-text-secondary hover:text-status-info transition-colors group"
            >
              <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">{commentsCount}</span>
            </button>

            <PostShare post={post} />
          </div>

          <button
            onClick={handleBookmark}
            disabled={isPending}
            className={`transition-colors group ${
              isBookmarked
                ? "text-accent"
                : "text-text-secondary hover:text-accent"
            }`}
          >
            <Star
              className={`w-5 h-5 group-hover:scale-110 transition-transform ${
                isBookmarked ? "fill-current" : ""
              }`}
            />
          </button>
        </div>

        {/* Show Comments Toggle */}
        {commentsCount > 0 && (
          <button
            onClick={handleShowComments}
            className="flex items-center space-x-2 mt-3 text-text-secondary hover:text-primary transition-colors"
          >
            {showComments ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <span className="text-sm">
              {showComments ? "Hide" : "Show"} {commentsCount} comment
              {commentsCount !== 1 ? "s" : ""}
            </span>
          </button>
        )}

        {/* Comment Input */}
        {showComment && (
          <div className="mt-4 pt-4 border-t border-border-primary">
            <div className="flex space-x-3">
              <Image
                src={session?.user?.image || "/default-avatar.png"}
                alt="Your avatar"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full p-2 text-sm bg-bg-tertiary border border-border-secondary rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary placeholder-text-secondary"
                  rows={2}
                />
                <div className="flex justify-end mt-2 space-x-2">
                  <button
                    onClick={() => {
                      setShowComment(false);
                      setCommentText("");
                    }}
                    className="px-3 py-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleComment}
                    disabled={isPending || !commentText.trim()}
                    className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isPending ? "Posting..." : "Comment"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comments List */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-border-primary">
            {loadingComments ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-1">
                {comments.map((comment) => (
                  <PostComment
                    key={comment.id}
                    comment={comment}
                    post={post}
                    depth={0}
                    setCommentsCount={setCommentsCount}
                    fetchComments={fetchComments}
                    requireAuth={requireAuth}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-text-secondary py-4">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal isOpen={isOpen} onClose={closeModal} action={action} />
    </>
  );
};

export default PostActions;
