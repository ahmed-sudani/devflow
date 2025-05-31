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
  followersCount: number | null;
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

export interface ProfileFormData {
  name: string;
  username: string;
  email: string;
  badge: string;
  image: string;
}

export interface PrivacySettings {
  profileVisibility: "public" | "private";
  showEmail: boolean;
  showFollowers: boolean;
  allowMessages: boolean;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  likeNotifications: boolean;
  commentNotifications: boolean;
  followNotifications: boolean;
  mentionNotifications: boolean;
}

export interface SearchFilters {
  type: "all" | "users" | "posts" | "tags";
  sortBy: "relevance" | "recent" | "popular";
  dateRange: "all" | "day" | "week" | "month" | "year";
  userId?: string;
  tags?: string[];
}

export interface SearchResult<T> {
  success: boolean;
  data: T[];
  error?: string;
  total?: number;
  hasMore?: boolean;
}

// Define the User type for search results
export interface UserSearchResult {
  id: string;
  name: string;
  username: string;
  image: string | null;
  badge: string | null;
  followersCount: number | null;
  followingCount: number;
  createdAt: Date;
}

export type PostFilterOptions = {
  userId?: string; // only posts by this user
  limit?: number; // how many posts to return
  offset?: number; // pagination
  isBookmarked?: boolean; // only bookmarked by current user?
  isFollowing?: boolean; // only from people you follow?
  tags?: string[]; // must match at least one tag
  sortBy?: "relevance" | "recent" | "popular";
  dateRange?: "all" | "day" | "week" | "month" | "year";
  searchTerm?: string; // (optional) text to search in content/snippet
};

export type Comment = typeof postComments.$inferSelect;

export type UserSettings = {
  profileVisibility: "public" | "private";
  showEmail: boolean;
  showFollowers: boolean;
  allowMessages: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  likeNotifications: boolean;
  commentNotifications: boolean;
  followNotifications: boolean;
  mentionNotifications: boolean;
};
