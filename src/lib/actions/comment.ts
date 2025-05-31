"use server";

import { auth } from "@/auth";
import { postComments, posts, users } from "@/db/schema";
import { CommentWithUser } from "@/types";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "../db";

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

    // Recursive function to get all child comment IDs
    async function getAllChildCommentIds(parentId: number): Promise<number[]> {
      const children = await db
        .select({ id: postComments.id })
        .from(postComments)
        .where(eq(postComments.parentId, parentId));

      let allChildIds: number[] = [];

      for (const child of children) {
        allChildIds.push(child.id);
        // Recursively get children of this child
        const grandChildren = await getAllChildCommentIds(child.id);
        allChildIds = allChildIds.concat(grandChildren);
      }

      return allChildIds;
    }

    // Get all child comment IDs
    const childCommentIds = await getAllChildCommentIds(commentId);

    // Calculate total comments to delete (parent + children)
    const totalCommentsToDelete = 1 + childCommentIds.length;

    // Delete all child comments first
    if (childCommentIds.length > 0) {
      await db
        .delete(postComments)
        .where(inArray(postComments.id, childCommentIds));
    }

    // Delete the parent comment
    await db.delete(postComments).where(eq(postComments.id, commentId));

    // Update comments count (subtract total deleted comments)
    await db
      .update(posts)
      .set({
        commentsCount: sql`${posts.commentsCount} - ${totalCommentsToDelete}`,
      })
      .where(eq(posts.id, postId));

    revalidatePath("/");
    return { success: true, deletedCount: totalCommentsToDelete };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return { success: false, error: "Failed to delete comment" };
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
