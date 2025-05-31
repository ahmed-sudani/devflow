import {
  users,
  followers,
  posts,
  postLikes,
  postComments,
  postBookmarks,
} from "../db/schema";

// 1. Infer base table models
export type User = Omit<typeof users.$inferSelect, "emailVerified" | "email"> &
  Partial<Pick<typeof users.$inferSelect, "email">>;

export type Post = Omit<typeof posts.$inferSelect, "userId">;
export type PostInsert = typeof posts.$inferInsert;

export type PostLike = typeof postLikes.$inferSelect;
export type PostLikeInsert = typeof postLikes.$inferInsert;

export type PostComment = typeof postComments.$inferSelect;
export type PostCommentInsert = typeof postComments.$inferSelect;

export type PostBookmark = typeof postBookmarks.$inferSelect;
export type PostBookmarkInsert = typeof postBookmarks.$inferInsert;

// 2. Infer relation-aware types
// User with nested relations
export type UserWithRelations = User & {
  posts: (typeof posts)[];
  comments: (typeof postComments)[];
  likes: (typeof postLikes)[];
  bookmarks: (typeof postBookmarks)[];
  followers: (typeof followers)[];
  following: (typeof followers)[];
};

// Post with its user and nested relations
export type PostWithUser = Post & {
  user: Pick<User, "id" | "name" | "username" | "badge" | "image">;
  isLiked: boolean;
  isBookmarked: boolean;
};

// Comment with user and replies
export type CommentWithUser = Omit<
  PostComment,
  "userId" | "postId" | "updatedAt"
> & {
  user: Pick<User, "id" | "name" | "username" | "image">;
  replies: CommentWithUser[];
};

export type SuggestedUser = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  followersCount: number;
};

export type Timeframe = "day" | "week" | "month";

export interface ApiResult<T> {
  success: boolean;
  data: T[];
  error?: string;
}

export interface TrendingTag {
  tag: string;
  count: number;
  avgEngagement?: number;
}
