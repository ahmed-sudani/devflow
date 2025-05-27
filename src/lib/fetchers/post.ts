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
import { and, asc, desc, eq, gt, inArray, notInArray } from "drizzle-orm";

export type PostWithUser = {
  id: number;
  content: string;
  codeSnippet: string | null;
  image: string | null;
  tags: string[] | null;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: Date | null;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    badge: string | null;
    image: string | null;
  };
  isLiked?: boolean;
  isBookmarked?: boolean;
};

export type SuggestedUser = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  followersCount: number;
};

export type PostComment = {
  id: number;
  content: string;
  createdAt: Date;
  parentId: number | null;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  replies?: PostComment[];
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
        image: posts.image,
        tags: posts.tags,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        sharesCount: posts.sharesCount,
        createdAt: posts.createdAt,
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
        image: row.image,
        tags: row.tags,
        likesCount: row.likesCount ?? 0,
        commentsCount: row.commentsCount ?? 0,
        sharesCount: row.sharesCount ?? 0,
        createdAt: row.createdAt,
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
      image: row.image,
      tags: row.tags,
      likesCount: row.likesCount ?? 0,
      commentsCount: row.commentsCount ?? 0,
      sharesCount: row.sharesCount ?? 0,
      createdAt: row.createdAt,
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

    let result;

    if (currentUserId) {
      // Exclude users that current user already follows and current user
      const followingIds = await db
        .select({ followingId: followers.followingId })
        .from(followers)
        .where(eq(followers.followerId, currentUserId));

      const excludeIds = [
        currentUserId,
        ...followingIds.map((f) => f.followingId),
      ];

      // Build the complete query in one chain
      result = await db
        .select(baseSelect)
        .from(users)
        .where(
          and(notInArray(users.id, excludeIds), gt(users.followersCount, 0))
        )
        .orderBy(desc(users.followersCount))
        .limit(3);
    } else {
      // For anonymous users, just show users with followers
      result = await db
        .select(baseSelect)
        .from(users)
        .where(gt(users.followersCount, 0))
        .orderBy(desc(users.followersCount))
        .limit(3);
    }

    return result.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      followersCount: user.followersCount || 0,
    }));
  } catch (error) {
    console.error("Error fetching suggested users:", error);
    return [];
  }
}

export async function getPostComments(postId: number): Promise<PostComment[]> {
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
    const commentMap = new Map<number, PostComment>();

    result.forEach((comment) => {
      const commentObj: PostComment = {
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
    const rootComments: PostComment[] = [];

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
    // 1) Authenticate the current session
    const session = await auth();
    const currentUserId = session?.user?.id;

    // 2) Fetch posts by userId with joined user info
    const result = await db
      .select({
        id: posts.id,
        content: posts.content,
        codeSnippet: posts.codeSnippet,
        image: posts.image,
        tags: posts.tags,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        sharesCount: posts.sharesCount,
        createdAt: posts.createdAt,
        userId: posts.userId,
        userName: users.name,
        userUsername: users.username,
        userBadge: users.badge,
        userImage: users.image,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt))
      .limit(50);

    // 3) If no logged-in user, skip isLiked calculation
    if (!currentUserId) {
      return result.map((row) => ({
        id: row.id,
        content: row.content,
        codeSnippet: row.codeSnippet,
        image: row.image,
        tags: row.tags,
        likesCount: row.likesCount ?? 0,
        commentsCount: row.commentsCount ?? 0,
        sharesCount: row.sharesCount ?? 0,
        createdAt: row.createdAt,
        user: {
          id: row.userId,
          name: row.userName,
          username: row.userUsername,
          badge: row.userBadge,
          image: row.userImage,
        },
        isLiked: false,
      }));
    }

    // 4) Fetch liked posts by current user
    const userLikes = await db
      .select({ postId: postLikes.postId })
      .from(postLikes)
      .where(eq(postLikes.userId, currentUserId));

    const likedPostIds = userLikes.map((like) => like.postId);

    // 5) Map to full structure
    return result.map((row) => ({
      id: row.id,
      content: row.content,
      codeSnippet: row.codeSnippet,
      image: row.image,
      tags: row.tags,
      likesCount: row.likesCount ?? 0,
      commentsCount: row.commentsCount ?? 0,
      sharesCount: row.sharesCount ?? 0,
      createdAt: row.createdAt,
      user: {
        id: row.userId,
        name: row.userName,
        username: row.userUsername,
        badge: row.userBadge,
        image: row.userImage,
      },
      isLiked: likedPostIds.includes(row.id),
    }));
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return [];
  }
}
