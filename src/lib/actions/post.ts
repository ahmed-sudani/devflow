"use server";

import { auth } from "@/auth";
import {
  followers,
  postBookmarks,
  postLikes,
  posts,
  users,
  userSettings,
} from "@/db/schema";

import { db } from "@/lib/db";
import { PostFilterOptions, PostWithUser } from "@/types";
import { and, desc, eq, gte, ilike, isNotNull, or, sql } from "drizzle-orm";
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

type UpdatePostInput = {
  postId: number;
  content: string;
  codeSnippet?: string;
  codeLanguage?: string | null;
  image?: string | null;
  tags?: string[];
};

export async function updatePost(input: UpdatePostInput) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("You must be logged in to update a post");
    }

    // Validate input
    if (!input.content.trim()) {
      throw new Error("Post content is required");
    }

    if (input.content.length > 2000) {
      throw new Error("Post content must be less than 2000 characters");
    }

    // Fetch post to verify ownership
    const [existingPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, input.postId));

    if (!existingPost) {
      throw new Error("Post not found");
    }

    if (existingPost.userId !== session.user.id) {
      throw new Error("You are not authorized to update this post");
    }

    // Perform update
    const updatedPost = await db
      .update(posts)
      .set({
        content: input.content.trim(),
        codeSnippet: input.codeSnippet?.trim() || null,
        codeLanguage: input.codeSnippet?.trim() ? input.codeLanguage : null,
        image: input.image || null,
        tags: input.tags?.filter((tag) => tag.trim() !== "") || [],
      })
      .where(eq(posts.id, input.postId))
      .returning();

    revalidateTag("posts");

    return {
      success: true,
      post: updatedPost[0],
      message: "Post updated successfully!",
    };
  } catch (error) {
    console.error("Error updating post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update post",
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
    const [existingPost] = await db
      .select({})
      .from(posts)
      .where(and(eq(posts.id, postId), eq(posts.userId, session.user!.id!)));

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

    return { success: true };
  } catch (error) {
    console.error("Error toggling like:", error);
    return { success: false, error: "Failed to toggle like" };
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

export async function getPosts(
  opts: PostFilterOptions = {}
): Promise<PostWithUser[]> {
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

  // 1) Build the base query
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
    .innerJoin(userSettings, eq(userSettings.userId, users.id)) // <-- JOIN settings
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

  // 2) Filter by following if needed
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

  // 3) WHERE conditions
  const whereConditions = [];

  // Only posts from public users
  whereConditions.push(eq(userSettings.profileVisibility, "public"));

  if (isBookmarked) {
    if (!currentUserId) return [];
    whereConditions.push(isNotNull(postBookmarks.userId));
  }

  if (isFollowing) {
    whereConditions.push(isNotNull(followers.followingId));
  }

  if (userId) {
    whereConditions.push(eq(posts.userId, userId));
  }

  if (tags && tags.length > 0) {
    const tagsArray = `{${tags.join(",")}}`;
    whereConditions.push(sql`${posts.tags} && ${tagsArray}`);
  }

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

  if (whereConditions.length > 0) {
    q = q.where(and(...whereConditions));
  }

  // 4) Sorting
  switch (sortBy) {
    case "recent":
      q = q.orderBy(desc(posts.createdAt));
      break;
    case "popular":
      q = q.orderBy(desc(posts.likesCount), desc(posts.createdAt));
      break;
    case "relevance":
      if (searchTerm && searchTerm.trim().length >= 2) {
        q = q.orderBy(desc(posts.likesCount), desc(posts.createdAt));
      } else {
        q = q.orderBy(desc(posts.createdAt));
      }
      break;
  }

  // 5) Pagination
  q = q.limit(limit).offset(offset);

  // 6) Execute query
  const rows = await q;

  // 7) Format result
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

export async function getPostById(postId: number) {
  const session = await auth();
  const currentUserId = session?.user?.id;

  const result = await db
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
      isFollowing: sql<boolean>`followers.follower_id IS NOT NULL`.as(
        "isFollowing"
      ),
      profileVisibility: userSettings.profileVisibility,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .innerJoin(userSettings, eq(userSettings.userId, users.id))
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
    )
    .leftJoin(
      followers,
      and(
        eq(followers.followerId, currentUserId ?? ""),
        eq(followers.followingId, posts.userId)
      )
    )
    .where(
      and(
        eq(posts.id, postId),
        or(
          eq(userSettings.profileVisibility, "public"),
          eq(posts.userId, currentUserId ?? ""),
          sql<boolean>`followers.follower_id IS NOT NULL`
        )
      )
    );

  const post = result[0];
  if (!post) return null;

  return {
    id: post.id,
    content: post.content,
    codeSnippet: post.codeSnippet,
    codeLanguage: post.codeLanguage,
    image: post.image,
    tags: post.tags,
    likesCount: post.likesCount ?? 0,
    commentsCount: post.commentsCount ?? 0,
    sharesCount: post.sharesCount ?? 0,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    user: {
      id: post.userId,
      name: post.userName,
      username: post.userUsername,
      badge: post.userBadge,
      image: post.userImage,
    },
    isLiked: post.isLiked,
    isBookmarked: post.isBookmarked,
    isFollowing: post.isFollowing,
  };
}

export async function getTrendingTagsWithTimeframe(
  timeframe: "day" | "week" | "month" = "week",
  limit: number = 10
) {
  try {
    const intervalMap = {
      day: "1 day",
      week: "7 days",
      month: "30 days",
    };

    const interval = intervalMap[timeframe];

    const trendingTags = await db
      .select({
        tag: sql<string>`unnest(${posts.tags})`.as("tag"),
        count: sql<number>`count(*)`.as("count"),
        avgEngagement:
          sql<number>`avg(${posts.likesCount} + ${posts.commentsCount} + coalesce(${posts.sharesCount}, 0))`.as(
            "avg_engagement"
          ),
      })
      .from(posts)
      .where(
        sql`
        ${posts.tags} is not null 
        and array_length(${posts.tags}, 1) > 0 
        and ${posts.createdAt} >= now() - interval '${sql.raw(interval)}'
      `
      )
      .groupBy(sql`unnest(${posts.tags})`)
      .orderBy(
        sql`count(*) desc, avg(${posts.likesCount} + ${posts.commentsCount} + coalesce(${posts.sharesCount}, 0)) desc`
      )
      .limit(limit);

    return {
      success: true,
      data: trendingTags,
      timeframe,
    };
  } catch (error) {
    console.error("Error fetching trending tags with timeframe:", error);
    return {
      success: false,
      error: "Failed to fetch trending tags",
      data: [],
      timeframe,
    };
  }
}
