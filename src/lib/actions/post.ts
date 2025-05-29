"use server";

import { auth } from "@/auth";
import {
  followers,
  postBookmarks,
  postComments,
  postLikes,
  posts,
  users,
} from "@/db/schema";

import { db } from "@/lib/db";
import { PostWithUser } from "@/types";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  or,
  sql,
} from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

export interface CreatePostInput {
  codeLanguage: string;
  content: string;
  codeSnippet?: string;
  image?: string;
  tags?: string[];
}

export async function createPost(input: CreatePostInput) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("You must be logged in to create a post");
    }

    // Validate input
    if (!input.content.trim()) {
      throw new Error("Post content is required");
    }

    if (input.content.length > 2000) {
      throw new Error("Post content must be less than 2000 characters");
    }

    // Create post
    const newPost = await db
      .insert(posts)
      .values({
        userId: session.user.id,
        content: input.content.trim(),
        codeSnippet: input.codeSnippet?.trim() || null,
        codeLanguage: input.codeSnippet?.trim() ? input.codeLanguage : null,
        image: input.image || null,
        tags: input.tags?.filter((tag) => tag.trim() !== "") || [],
      })
      .returning();

    revalidateTag("posts");

    return {
      success: true,
      post: newPost[0],
      message: "Post created successfully!",
    };
  } catch (error) {
    console.error("Error creating post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create post",
    };
  }
}

export async function deletePost(postId: number) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("You must be logged in");
    }

    // Check if user owns the post
    const existingPost = await db.query.posts.findFirst({
      where: (posts, { eq, and }) =>
        and(eq(posts.id, postId), eq(posts.userId, session.user!.id!)),
    });

    if (!existingPost) {
      throw new Error(
        "Post not found or you don't have permission to delete it"
      );
    }

    await db.delete(posts).where(eq(posts.id, postId));

    revalidatePath("/");

    return { success: true, message: "Post deleted successfully" };
  } catch (error) {
    console.error("Error deleting post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete post",
    };
  }
}

export async function togglePostLike(postId: number) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = session.user.id;

    // Check if user already liked the post
    const existingLike = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)))
      .limit(1);

    if (existingLike.length > 0) {
      // Unlike the post
      await db
        .delete(postLikes)
        .where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)));

      // Decrement likesCount by 1
      await db
        .update(posts)
        .set({
          likesCount: sql`${posts.likesCount} - 1`,
        })
        .where(eq(posts.id, postId));
    } else {
      // Like the post
      await db.insert(postLikes).values({
        userId,
        postId,
      });

      // Increment likesCount by 1
      await db
        .update(posts)
        .set({
          likesCount: sql`${posts.likesCount} + 1`,
        })
        .where(eq(posts.id, postId));
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error toggling like:", error);
    return { success: false, error: "Failed to toggle like" };
  }
}

export async function addComment(
  postId: number,
  content: string,
  parentId?: number
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    if (!content.trim()) {
      throw new Error("Comment content is required");
    }

    const userId = session.user.id;

    // Insert the comment
    await db.insert(postComments).values({
      userId,
      postId,
      content: content.trim(),
      parentId,
    });

    // Increment comments count
    await db
      .update(posts)
      .set({
        commentsCount: sql`${posts.commentsCount} + 1`,
      })
      .where(eq(posts.id, postId));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error adding comment:", error);
    return { success: false, error: "Failed to add comment" };
  }
}

export async function deleteComment(commentId: number) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = session.user.id;

    // Get the comment to check ownership and get postId
    const comment = await db
      .select()
      .from(postComments)
      .where(eq(postComments.id, commentId))
      .limit(1);

    if (comment.length === 0) {
      throw new Error("Comment not found");
    }

    if (comment[0].userId !== userId) {
      throw new Error("Not authorized to delete this comment");
    }

    const postId = comment[0].postId;

    // Delete the comment
    await db.delete(postComments).where(eq(postComments.id, commentId));

    // Update comments count
    await db
      .update(posts)
      .set({
        commentsCount: sql`${posts.commentsCount} - 1`,
      })
      .where(eq(posts.id, postId));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return { success: false, error: "Failed to delete comment" };
  }
}

export async function getPostComments(postId: number) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    // Fetch all comments for this post
    const rows = await db
      .select()
      .from(postComments)
      .where(eq(postComments.postId, postId))
      .orderBy(asc(postComments.createdAt));

    // Build a nested comment tree
    const lookup: Record<number, CommentWithReplies> = {};
    const roots: CommentWithReplies[] = [];

    rows.forEach((c) => {
      lookup[c.id] = { ...c, replies: [] };
    });

    rows.forEach((c) => {
      if (c.parentId) {
        const parent = lookup[c.parentId];
        if (parent) parent.replies.push(lookup[c.id]);
      } else {
        roots.push(lookup[c.id]);
      }
    });

    return { success: true, comments: roots };
  } catch (error) {
    console.error("Error fetching comments:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch comments",
    };
  }
}

export async function toggleUserFollowing(targetUserId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const currentUserId = session.user.id;

    if (currentUserId === targetUserId) {
      throw new Error("You cannot follow yourself");
    }

    // Check if the user is already following
    const existing = await db
      .select()
      .from(followers)
      .where(
        and(
          eq(followers.followerId, currentUserId),
          eq(followers.followingId, targetUserId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Unfollow
      await db
        .delete(followers)
        .where(
          and(
            eq(followers.followerId, currentUserId),
            eq(followers.followingId, targetUserId)
          )
        );

      // Optional: decrement counters
      await db
        .update(users)
        .set({ followingCount: sql`${users.followingCount} - 1` })
        .where(eq(users.id, currentUserId));
      await db
        .update(users)
        .set({ followersCount: sql`${users.followersCount} - 1` })
        .where(eq(users.id, targetUserId));

      return { success: true, following: false, message: "Unfollowed user" };
    } else {
      // Follow
      await db.insert(followers).values({
        followerId: currentUserId,
        followingId: targetUserId,
      });

      // Optional: increment counters
      await db
        .update(users)
        .set({ followingCount: sql`${users.followingCount} + 1` })
        .where(eq(users.id, currentUserId));
      await db
        .update(users)
        .set({ followersCount: sql`${users.followersCount} + 1` })
        .where(eq(users.id, targetUserId));

      return { success: true, following: true, message: "Followed user" };
    }
  } catch (error) {
    console.error("Error toggling user follow:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle follow",
    };
  }
}

export async function sharePost(postId: number) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Increment the shares count
    await db
      .update(posts)
      .set({
        sharesCount: sql`${posts.sharesCount} + 1`,
      })
      .where(eq(posts.id, postId));

    return { success: true };
  } catch (error) {
    console.error("Error sharing post:", error);
    return { success: false, error: "Failed to share post" };
  }
}

export async function togglePostBookmark(postId: number) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if bookmark exists
    const existingBookmark = await db
      .select()
      .from(postBookmarks)
      .where(
        and(
          eq(postBookmarks.postId, postId),
          eq(postBookmarks.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingBookmark.length > 0) {
      // Remove bookmark
      await db
        .delete(postBookmarks)
        .where(
          and(
            eq(postBookmarks.postId, postId),
            eq(postBookmarks.userId, session.user.id)
          )
        );

      return { success: true, isBookmarked: false };
    } else {
      // Add bookmark
      await db.insert(postBookmarks).values({
        postId,
        userId: session.user.id,
      });

      return { success: true, isBookmarked: true };
    }
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    return { success: false, error: "Failed to toggle bookmark" };
  }
}

type Comment = typeof postComments.$inferSelect;
type CommentWithReplies = Comment & { replies: CommentWithReplies[] };

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
  followersCount: number;
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

// Enhanced user search with filters
export async function searchUsers(
  query: string,
  limit: number = 10,
  offset: number = 0,
  filters: Partial<SearchFilters> = {}
): Promise<SearchResult<UserSearchResult>> {
  if (!query || query.trim().length < 2) {
    return {
      success: false,
      error: "Search query must be at least 2 characters long",
      data: [],
    };
  }

  const searchTerm = `%${query.trim()}%`;

  try {
    // Build the base query
    const baseQuery = db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        image: users.image,
        badge: users.badge,
        followersCount: users.followersCount,
        followingCount: users.followingCount,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        or(
          ilike(users.name, searchTerm),
          ilike(users.username, searchTerm),
          ilike(users.badge, searchTerm)
        )
      );

    // Apply sorting and execute query
    let results;
    switch (filters.sortBy) {
      case "recent":
        results = await baseQuery
          .orderBy(desc(users.createdAt))
          .limit(limit)
          .offset(offset);
        break;
      case "popular":
        results = await baseQuery
          .orderBy(desc(users.followersCount), asc(users.name))
          .limit(limit)
          .offset(offset);
        break;
      default:
        results = await baseQuery
          .orderBy(desc(users.followersCount), asc(users.name))
          .limit(limit)
          .offset(offset);
    }

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        or(
          ilike(users.name, searchTerm),
          ilike(users.username, searchTerm),
          ilike(users.badge, searchTerm)
        )
      );

    const total = totalResult[0]?.count || 0;

    return {
      success: true,
      data: results,
      total,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error("Error searching users:", error);
    return {
      success: false,
      error: "Failed to search users",
      data: [],
    };
  }
}

export async function getPosts(
  opts: PostFilterOptions = {}
): Promise<PostWithUser[]> {
  // 1) Auth
  const session = await auth();
  const currentUserId = session?.user?.id;
  const {
    userId,
    limit = 50,
    offset = 0,
    isBookmarked,
    isFollowing,
    tags,
    sortBy = "recent",
    dateRange = "all",
    searchTerm,
  } = opts;

  // 2) Base select + joins for user + interaction flags
  let q;
  q = db
    .select({
      id: posts.id,
      content: posts.content,
      codeSnippet: posts.codeSnippet,
      codeLanguage: posts.codeLanguage,
      image: posts.image,
      tags: posts.tags,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
      sharesCount: posts.sharesCount,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      userId: posts.userId,
      userName: users.name,
      userUsername: users.username,
      userBadge: users.badge,
      userImage: users.image,
      isLiked: sql<boolean>`post_likes.user_id IS NOT NULL`.as("isLiked"),
      isBookmarked: sql<boolean>`post_bookmarks.user_id IS NOT NULL`.as(
        "isBookmarked"
      ),
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .leftJoin(
      postLikes,
      and(
        eq(postLikes.postId, posts.id),
        eq(postLikes.userId, currentUserId ?? "")
      )
    )
    .leftJoin(
      postBookmarks,
      and(
        eq(postBookmarks.postId, posts.id),
        eq(postBookmarks.userId, currentUserId ?? "")
      )
    );

  // 3) Add followers join if needed
  if (isFollowing) {
    if (!currentUserId) return [];
    q = q.leftJoin(
      followers,
      and(
        eq(followers.followerId, currentUserId),
        eq(followers.followingId, posts.userId)
      )
    );
  }

  // 4) Build where conditions array
  const whereConditions = [];

  // Filter by "only my bookmarks"
  if (isBookmarked) {
    if (!currentUserId) return [];
    whereConditions.push(isNotNull(postBookmarks.userId));
  }

  // Filter by "only from people I follow"
  if (isFollowing) {
    whereConditions.push(isNotNull(followers.followingId));
  }

  // Filter by a specific user's posts
  if (userId) {
    whereConditions.push(eq(posts.userId, userId));
  }

  // Filter by tags overlap
  if (tags && tags.length > 0) {
    const tagsArray = `{${tags.join(",")}}`;
    whereConditions.push(sql`${posts.tags} && ${tagsArray}`);
  }

  // Full-text search (if provided)
  if (searchTerm && searchTerm.trim().length >= 2) {
    const term = `%${searchTerm.trim()}%`;
    whereConditions.push(
      or(
        ilike(posts.content, term),
        ilike(posts.codeSnippet, term),
        sql`EXISTS (
          SELECT 1 FROM unnest(${posts.tags}) AS tag WHERE tag ILIKE ${term}
        )`
      )
    );
  }

  // Date range filter
  if (dateRange !== "all") {
    const now = Date.now();
    const msIn = {
      day: 86400_000,
      week: 7 * 86400_000,
      month: 30 * 86400_000,
      year: 365 * 86400_000,
    } as const;
    const threshold = new Date(now - msIn[dateRange]);
    whereConditions.push(gte(posts.createdAt, threshold));
  }

  // 5) Apply all where conditions at once
  if (whereConditions.length > 0) {
    q = q.where(and(...whereConditions));
  }

  // 6) Sorting
  switch (sortBy) {
    case "recent":
      q = q.orderBy(desc(posts.createdAt));
      break;
    case "popular":
      q = q.orderBy(desc(posts.likesCount), desc(posts.createdAt));
      break;
    case "relevance":
      if (searchTerm && searchTerm.trim().length >= 2) {
        // If you have a full-text index, replace this with ts_rank or similarity()
        q = q.orderBy(desc(posts.likesCount), desc(posts.createdAt));
      } else {
        // fallback
        q = q.orderBy(desc(posts.createdAt));
      }
      break;
  }

  // 7) Pagination
  q = q.limit(limit).offset(offset);

  // 8) Execute + map to PostWithUser
  const rows = await q;
  return rows.map((r) => ({
    id: r.id,
    content: r.content,
    codeSnippet: r.codeSnippet,
    codeLanguage: r.codeLanguage,
    image: r.image,
    tags: r.tags,
    likesCount: r.likesCount ?? 0,
    commentsCount: r.commentsCount ?? 0,
    sharesCount: r.sharesCount ?? 0,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    user: {
      id: r.userId,
      name: r.userName,
      username: r.userUsername,
      badge: r.userBadge,
      image: r.userImage,
    },
    isLiked: r.isLiked,
    isBookmarked: r.isBookmarked,
  }));
}
