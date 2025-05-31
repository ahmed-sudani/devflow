"use server";

import { auth } from "@/auth";
import { isNull, ne, sql } from "drizzle-orm";

import {
  followers,
  postBookmarks,
  postComments,
  postLikes,
  posts,
  users,
} from "@/db/schema";
import { db } from "@/lib/db";
import { and, asc, desc, eq, gt, inArray } from "drizzle-orm";
import { CommentWithUser, PostWithUser } from "@/types";

export type SuggestedUser = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  followersCount: number;
};

export async function getPosts(
  filter: "recent" | "following" | "bookmarks" = "recent"
): Promise<PostWithUser[]> {
  try {
    // 1) Authenticate
    const session = await auth();
    const currentUserId = session?.user?.id;

    // 2) Build the base select + join (common to all branches)
    const baseQuery = db
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
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id));

    // 3) Early return for anonymous users (only allow "recent" filter)
    if (!currentUserId) {
      if (filter !== "recent") {
        return []; // No bookmarks or following for anonymous users
      }

      const rows = await baseQuery.orderBy(desc(posts.createdAt)).limit(50);

      return rows.map((row) => ({
        id: row.id,
        content: row.content,
        codeSnippet: row.codeSnippet,
        codeLanguage: row.codeLanguage,
        image: row.image,
        tags: row.tags,
        likesCount: row.likesCount ?? 0,
        commentsCount: row.commentsCount ?? 0,
        sharesCount: row.sharesCount ?? 0,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        user: {
          id: row.userId,
          name: row.userName,
          username: row.userUsername,
          badge: row.userBadge,
          image: row.userImage,
        },
        isLiked: false, // no user → no likes
        isBookmarked: false, // no user → no bookmarks
      }));
    }

    // 4) Handle different filter types
    let filterExpr;

    if (filter === "following") {
      // Fetch the list of following IDs
      const followingRows = await db
        .select({ id: followers.followingId })
        .from(followers)
        .where(eq(followers.followerId, currentUserId));

      const followingIds = followingRows.map((r) => r.id);
      if (followingIds.length === 0) {
        return [];
      }
      filterExpr = inArray(posts.userId, followingIds);
    } else if (filter === "bookmarks") {
      // Fetch the list of bookmarked post IDs
      const bookmarkedRows = await db
        .select({ postId: postBookmarks.postId })
        .from(postBookmarks)
        .where(eq(postBookmarks.userId, currentUserId));

      const bookmarkedPostIds = bookmarkedRows.map((r) => r.postId);
      if (bookmarkedPostIds.length === 0) {
        return [];
      }
      filterExpr = inArray(posts.id, bookmarkedPostIds);
    }
    // For "recent", filterExpr remains undefined (no additional filtering)

    // 5) Fetch the posts
    const result = await baseQuery
      .where(filterExpr)
      .orderBy(desc(posts.createdAt))
      .limit(50);

    // 6) Fetch user interactions (likes and bookmarks)
    const [userLikesRows, userBookmarksRows] = await Promise.all([
      db
        .select({ postId: postLikes.postId })
        .from(postLikes)
        .where(eq(postLikes.userId, currentUserId)),
      db
        .select({ postId: postBookmarks.postId })
        .from(postBookmarks)
        .where(eq(postBookmarks.userId, currentUserId)),
    ]);

    const likedPosts = userLikesRows.map((l) => l.postId);
    const bookmarkedPosts = userBookmarksRows.map((b) => b.postId);

    // 7) Map and return
    return result.map((row) => ({
      id: row.id,
      content: row.content,
      codeSnippet: row.codeSnippet,
      codeLanguage: row.codeLanguage,
      image: row.image,
      tags: row.tags,
      likesCount: row.likesCount ?? 0,
      commentsCount: row.commentsCount ?? 0,
      sharesCount: row.sharesCount ?? 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        id: row.userId,
        name: row.userName,
        username: row.userUsername,
        badge: row.userBadge,
        image: row.userImage,
      },
      isLiked: likedPosts.includes(row.id),
      isBookmarked: bookmarkedPosts.includes(row.id),
    }));
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

export async function getSuggestedUsers(): Promise<SuggestedUser[]> {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    const baseSelect = {
      id: users.id,
      name: users.name,
      username: users.username,
      image: users.image,
      followersCount: users.followersCount,
    };

    const base = db.select(baseSelect).from(users);

    const filtered = currentUserId
      ? base
          .leftJoin(
            followers,
            and(
              eq(followers.followerId, currentUserId),
              eq(followers.followingId, users.id)
            )
          )
          .where(
            and(
              isNull(followers.followerId),
              ne(users.id, currentUserId),
              gt(users.followersCount, 0)
            )
          )
      : base.where(gt(users.followersCount, 0));

    // common ordering & limit
    const rows = await filtered.orderBy(desc(users.followersCount)).limit(3);

    return rows.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      image: u.image,
      followersCount: u.followersCount || 0,
    }));
  } catch (error) {
    console.error("Error fetching suggested users:", error);
    return [];
  }
}

export async function getPostComments(
  postId: number
): Promise<CommentWithUser[]> {
  try {
    const result = await db
      .select({
        id: postComments.id,
        content: postComments.content,
        createdAt: postComments.createdAt,
        parentId: postComments.parentId,
        userId: postComments.userId,
        userName: users.name,
        userUsername: users.username,
        userImage: users.image,
      })
      .from(postComments)
      .innerJoin(users, eq(postComments.userId, users.id))
      .where(eq(postComments.postId, postId))
      .orderBy(asc(postComments.createdAt)); // Changed to ascending for proper tree building

    // First pass: Create all comment objects
    const commentMap = new Map<number, CommentWithUser>();

    result.forEach((comment) => {
      const commentObj: CommentWithUser = {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        parentId: comment.parentId,
        user: {
          id: comment.userId,
          name: comment.userName,
          username: comment.userUsername,
          image: comment.userImage,
        },
        replies: [],
      };
      commentMap.set(comment.id, commentObj);
    });

    // Second pass: Build the tree structure
    const rootComments: CommentWithUser[] = [];

    result.forEach((comment) => {
      const commentObj = commentMap.get(comment.id)!;

      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(commentObj);
        }
      } else {
        rootComments.push(commentObj);
      }
    });

    // Sort root comments by newest first, but keep replies in chronological order
    return rootComments.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
}

export async function getUserPosts(userId: string): Promise<PostWithUser[]> {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    // build base query
    const query = db
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
      )
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt))
      .limit(50);

    const rows = await query;

    return rows.map((row) => ({
      id: row.id,
      content: row.content,
      codeSnippet: row.codeSnippet,
      codeLanguage: row.codeLanguage,
      image: row.image,
      tags: row.tags,
      likesCount: row.likesCount ?? 0,
      commentsCount: row.commentsCount ?? 0,
      sharesCount: row.sharesCount ?? 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        id: row.userId,
        name: row.userName,
        username: row.userUsername,
        badge: row.userBadge,
        image: row.userImage,
      },
      isLiked: row.isLiked,
      isBookmarked: row.isBookmarked,
    }));
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return [];
  }
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

export async function getPostById(postId: number) {
  // 1) Authenticate and get current user
  const session = await auth();
  const currentUserId = session?.user?.id;

  // 2) Build query
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
    )
    .leftJoin(
      followers,
      and(
        eq(followers.followerId, currentUserId ?? ""),
        eq(followers.followingId, posts.userId)
      )
    )
    .where(eq(posts.id, postId));

  // 3) Handle not found
  const post = result[0];
  if (!post) return null;

  // 4) Return shaped data
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
