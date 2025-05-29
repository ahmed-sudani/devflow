import { auth } from "@/auth";
import { followers, users } from "@/db/schema";
import { db } from "../db";
import { and, eq } from "drizzle-orm";

export async function getCurrentUser() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return null;
    }

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        email: users.email,
        badge: users.badge,
        image: users.image,
        followersCount: users.followersCount,
        followingCount: users.followingCount,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    return user || null;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

export async function getUserProfile(userId: string) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Fetch target user profile
    const user = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        badge: users.badge,
        image: users.image,
        followersCount: users.followersCount,
        followingCount: users.followingCount,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const profile = user[0];

    if (!profile) return null;

    // Check if current user follows this user
    let isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
      const followCheck = await db
        .select()
        .from(followers)
        .where(
          and(
            eq(followers.followerId, currentUserId),
            eq(followers.followingId, userId)
          )
        )
        .limit(1);

      isFollowing = followCheck.length > 0;
    }

    return {
      ...profile,
      isFollowing,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}
