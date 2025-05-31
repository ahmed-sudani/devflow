"use server";

import { auth } from "@/auth";
import { followers, users, userSettings } from "@/db/schema";
import {
  ProfileFormData,
  PrivacySettings,
  NotificationSettings,
  SearchFilters,
  SearchResult,
  UserSearchResult,
  SuggestedUser,
} from "@/types";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  ilike,
  isNull,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "../db";

export async function updateUserProfile(formData: ProfileFormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    // Check if username is already taken by another user
    if (formData.username) {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.username, formData.username))
        .limit(1);

      if (existingUser.length > 0 && existingUser[0].id !== userId) {
        return {
          error: "Username is already taken",
          success: false,
        };
      }
    }

    // Update user profile
    await db
      .update(users)
      .set({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        badge: formData.badge,
        image: formData.image,
      })
      .where(eq(users.id, userId));

    revalidatePath("/settings");

    return {
      success: true,
      message: "Profile updated successfully!",
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      error: "Failed to update profile",
      success: false,
    };
  }
}

// Update privacy settings
export async function updatePrivacySettings(settings: PrivacySettings) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    // Check if user settings exist
    const existingSettings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (existingSettings.length > 0) {
      // Update existing settings
      await db
        .update(userSettings)
        .set({
          profileVisibility: settings.profileVisibility,
          showEmail: settings.showEmail,
          showFollowers: settings.showFollowers,
          allowMessages: settings.allowMessages,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, userId));
    } else {
      // Create new settings record
      await db.insert(userSettings).values({
        userId,
        profileVisibility: settings.profileVisibility,
        showEmail: settings.showEmail,
        showFollowers: settings.showFollowers,
        allowMessages: settings.allowMessages,
      });
    }

    revalidatePath("/settings");

    return {
      success: true,
      message: "Privacy settings updated successfully!",
    };
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    return {
      error: "Failed to update privacy settings",
      success: false,
    };
  }
}

// Update notification settings
export async function updateNotificationSettings(
  settings: NotificationSettings
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    // Check if user settings exist
    const existingSettings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (existingSettings.length > 0) {
      // Update existing settings
      await db
        .update(userSettings)
        .set({
          emailNotifications: settings.emailNotifications,
          pushNotifications: settings.pushNotifications,
          likeNotifications: settings.likeNotifications,
          commentNotifications: settings.commentNotifications,
          followNotifications: settings.followNotifications,
          mentionNotifications: settings.mentionNotifications,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, userId));
    } else {
      // Create new settings record
      await db.insert(userSettings).values({
        userId,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        likeNotifications: settings.likeNotifications,
        commentNotifications: settings.commentNotifications,
        followNotifications: settings.followNotifications,
        mentionNotifications: settings.mentionNotifications,
      });
    }

    revalidatePath("/settings");

    return {
      success: true,
      message: "Notification settings updated successfully!",
    };
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return {
      error: "Failed to update notification settings",
      success: false,
    };
  }
}

// Get user settings
export async function getUserSettings(userId: string) {
  try {
    const settings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (settings.length > 0) {
      return settings[0];
    }

    // Return default settings if none exist
    return {
      profileVisibility: "public" as const,
      showEmail: false,
      showFollowers: true,
      allowMessages: true,
      emailNotifications: true,
      pushNotifications: true,
      likeNotifications: true,
      commentNotifications: true,
      followNotifications: true,
      mentionNotifications: true,
    };
  } catch (error) {
    console.error("Error fetching user settings:", error);
    // Return default settings on error
    return {
      profileVisibility: "public" as const,
      showEmail: false,
      showFollowers: true,
      allowMessages: true,
      emailNotifications: true,
      pushNotifications: true,
      likeNotifications: true,
      commentNotifications: true,
      followNotifications: true,
      mentionNotifications: true,
    };
  }
}

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
