"use server";

import { auth } from "@/auth";
import { users, userSettings } from "@/db/schema";
import {
  ProfileFormData,
  PrivacySettings,
  NotificationSettings,
} from "@/types";
import { eq } from "drizzle-orm";
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
