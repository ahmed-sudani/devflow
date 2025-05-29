"use client";

import { useState, useTransition } from "react";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share2,
  Star,
  ChevronDown,
  ChevronUp,
  Trash2,
  Reply,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  togglePostLike,
  addComment,
  deleteComment,
  sharePost,
  togglePostBookmark,
} from "@/lib/actions/post";
import { getPostComments } from "@/lib/fetchers/post";
import { PostComment } from "@/lib/fetchers/post";
import { useLoginModal } from "@/hooks/use-login-modal";
import { useSession } from "next-auth/react";
import { LoginModal } from "./login-modal";
import Link from "next/link";
import { Link as LinkIcon, Twitter, Facebook } from "lucide-react";
import Image from "next/image";
import CodePreview from "./code-preview";
import { PostWithUser } from "@/types";

interface PostProps {
  post: PostWithUser;
}

export function Post({ post }: PostProps) {
  const { data: session } = useSession();
  const { isOpen, action, requireAuth, closeModal } = useLoginModal();

  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComment, setShowComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [loadingComments, setLoadingComments] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [sharesCount, setSharesCount] = useState(post.sharesCount);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);

  const handleShare = async (shareType: "copy" | "twitter" | "facebook") => {
    const postUrl = `${window.location.origin}/posts/${post.id}`;

    if (shareType === "copy") {
      try {
        await navigator.clipboard.writeText(postUrl);
        console.log("Link copied to clipboard");
      } catch (error) {
        console.error("Failed to copy link:", error);
      }
    } else if (shareType === "twitter") {
      const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        postUrl
      )}&text=${encodeURIComponent(
        `Check out this post by ${post.user.name}: ${post.content.substring(
          0,
          100
        )}...`
      )}`;
      window.open(twitterUrl, "_blank");
    } else if (shareType === "facebook") {
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        postUrl
      )}`;
      window.open(facebookUrl, "_blank");
    }

    const newSharesCount = sharesCount + 1;
    setSharesCount(newSharesCount);
    setShowShareMenu(false);

    startTransition(async () => {
      const result = await sharePost(post.id);
      if (!result.success) {
        setSharesCount(sharesCount);
      }
    });
  };

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

  const handleReply = (commentId: number) => {
    const replyText = replyTexts[commentId];
    if (!replyText?.trim()) return;

    startTransition(async () => {
      const result = await addComment(post.id, replyText, commentId);
      if (result.success) {
        setReplyTexts((prev) => ({ ...prev, [commentId]: "" }));
        setReplyingTo(null);
        setCommentsCount((prev) => prev + 1);
        await fetchComments();
      }
    });
  };

  const handleDeleteComment = async (commentId: number) => {
    const result = await deleteComment(commentId);
    if (result.success) {
      setCommentsCount((prev) => prev - 1);
      await fetchComments();
    }
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

  const setReplyText = (commentId: number, text: string) => {
    setReplyTexts((prev) => ({ ...prev, [commentId]: text }));
  };

  const timeAgo = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : "";

  const renderComment = (comment: PostComment, depth = 0) => {
    const commentTimeAgo = comment.createdAt
      ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
      : "";

    const isReplying = replyingTo === comment.id;
    const replyText = replyTexts[comment.id] || "";

    return (
      <div key={comment.id} className={`${depth > 0 ? "ml-8 mt-3" : "mt-4"}`}>
        <div className="flex space-x-3">
          <Image
            src={comment.user.image || "/default-avatar.png"}
            alt={comment.user.name || "User"}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="bg-bg-tertiary rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm text-text-primary">
                    {comment.user.name}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {commentTimeAgo}
                  </span>
                </div>
                {session?.user?.id === comment.user.id && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-text-secondary hover:text-status-error transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-sm text-text-primary">{comment.content}</p>
            </div>

            {/* Reply button - only show for root comments and first level replies */}
            {depth < 2 && (
              <div className="flex items-center mt-2 space-x-4">
                <button
                  onClick={() => {
                    requireAuth("reply to this comment", () => {
                      setReplyingTo(isReplying ? null : comment.id);
                      if (!isReplying) {
                        setReplyText(comment.id, "");
                      }
                    });
                  }}
                  className="text-xs text-text-secondary hover:text-primary transition-colors flex items-center space-x-1"
                >
                  <Reply className="w-3 h-3" />
                  <span>Reply</span>
                </button>
              </div>
            )}

            {/* Reply Input */}
            {isReplying && (
              <div className="mt-3">
                <div className="flex space-x-2">
                  <Image
                    src={session?.user?.image || "/default-avatar.png"}
                    alt="Your avatar"
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(comment.id, e.target.value)}
                      placeholder={`Reply to ${comment.user.name}...`}
                      className="w-full p-2 text-sm bg-bg-secondary border border-border-secondary rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary placeholder-text-secondary"
                      rows={2}
                    />
                    <div className="flex justify-end mt-2 space-x-2">
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText(comment.id, "");
                        }}
                        className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReply(comment.id)}
                        disabled={isPending || !replyText.trim()}
                        className="px-2 py-1 text-xs bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isPending ? "Replying..." : "Reply"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Render replies recursively */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3">
                {comment.replies.map((reply) =>
                  renderComment(reply, depth + 1)
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-bg-secondary rounded-lg border border-border-primary overflow-hidden shadow-md">
        {/* Post Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-md">
            <Link href={`/profile/${post.user.id}`}>
              <Image
                src={post.user.image || "/default-avatar.png"}
                alt={post.user.name || "User"}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            </Link>

            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-text-primary">
                  {post.user.name}
                </h4>
                {post.user.badge && (
                  <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs">
                    {post.user.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary">
                {post.user.username} • {timeAgo}
              </p>
            </div>
          </div>
          <MoreHorizontal className="w-5 h-5 text-text-secondary cursor-pointer hover:text-text-tertiary" />
        </div>

        {/* Post Content */}
        <div className="px-4 pb-3">
          <p className="text-text-primary leading-relaxed mb-3">
            {post.content}
          </p>

          {/* Code Snippet */}
          {post.codeSnippet && (
            <CodePreview code={post.codeSnippet} language={post.codeLanguage} />
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-secondary/20 text-secondary rounded text-sm hover:bg-secondary/30 cursor-pointer transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Post Image */}
        {post.image && (
          <div className="relative">
            <Image
              src={post.image}
              alt="Post content"
              width={600}
              height={320}
              className="w-full h-80 object-cover"
            />
          </div>
        )}

        {/* Post Actions */}
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

              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center space-x-2 text-text-secondary hover:text-status-success transition-colors group"
                >
                  <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">{sharesCount}</span>
                </button>

                {showShareMenu && (
                  <div className="absolute bottom-full left-0 mb-2 bg-bg-secondary border border-border-primary rounded-lg shadow-lg py-2 min-w-[200px] z-10">
                    <button
                      onClick={() => handleShare("copy")}
                      className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-bg-tertiary transition-colors flex items-center space-x-2"
                    >
                      <LinkIcon className="w-4 h-4" />
                      <span>Copy Link</span>
                    </button>
                    <button
                      onClick={() => handleShare("twitter")}
                      className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-bg-tertiary transition-colors flex items-center space-x-2"
                    >
                      <Twitter className="w-4 h-4" />
                      <span>Share on Twitter</span>
                    </button>
                    <button
                      onClick={() => handleShare("facebook")}
                      className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-bg-tertiary transition-colors flex items-center space-x-2"
                    >
                      <Facebook className="w-4 h-4" />
                      <span>Share on Facebook</span>
                    </button>
                  </div>
                )}
              </div>
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
                  {comments.map((comment) => renderComment(comment))}
                </div>
              ) : (
                <p className="text-center text-text-secondary py-4">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal isOpen={isOpen} onClose={closeModal} action={action} />
    </>
  );
}
