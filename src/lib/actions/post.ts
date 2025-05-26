"use server";

import { auth } from "@/auth";
import {
  postBookmarks,
  postComments,
  postLikes,
  posts,
  users,
} from "@/db/schema";
import { db } from "@/lib/db";
import { and, asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface CreatePostInput {
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
        image: input.image || null,
        tags: input.tags,
      })
      .returning();

    revalidatePath("/");

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

import { followers } from "@/db/schema";

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
