"use client";

import { addComment, deleteComment } from "@/lib/actions/comment";
import { CommentWithUser, PostWithUser } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Reply, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import React, {
  Dispatch,
  SetStateAction,
  useState,
  useTransition,
} from "react";

type PostCommentProps = {
  comment: CommentWithUser;
  post: PostWithUser;
  depth: number;
  setCommentsCount: Dispatch<SetStateAction<number>>;
  fetchComments: () => Promise<void>;
  requireAuth: (actionDescription: string, callback?: () => void) => boolean;
};

const PostComment: React.FC<PostCommentProps> = ({
  comment,
  post,
  depth,
  setCommentsCount,
  fetchComments,
  requireAuth,
}) => {
  const { data: session } = useSession();
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const commentTimeAgo = comment.createdAt
    ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
    : "";

  const isReplying = replyingTo === comment.id;
  const replyText = replyTexts[comment.id] || "";

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

  const setReplyText = (commentId: number, text: string) => {
    setReplyTexts((prev) => ({ ...prev, [commentId]: text }));
  };

  const handleDeleteComment = async (commentId: number) => {
    const result = await deleteComment(commentId);
    if (result.success) {
      setCommentsCount((prev) => prev - result.deletedCount!);
      await fetchComments();
    }
  };

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
              {comment.replies.map((reply) => (
                <PostComment
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                  post={post}
                  setCommentsCount={setCommentsCount}
                  fetchComments={fetchComments}
                  requireAuth={requireAuth}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostComment;
