"use client";

import {
  updateNotificationSettings,
  updatePrivacySettings,
  updateUserProfile,
} from "@/lib/actions/user";
import {
  ProfileFormData,
  PrivacySettings,
  NotificationSettings,
} from "@/types";
import { Bell, Save, Shield, Upload, User, X } from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";

interface CurrentUser {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  image: string | null;
  badge: string | null;
  followersCount: number;
  followingCount: number;
}

interface UserSettings {
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
}

interface SettingsClientProps {
  currentUser: CurrentUser;
  userSettings: UserSettings;
}

type Tab = "profile" | "privacy" | "notifications";

export default function SettingsClient({
  currentUser,
  userSettings,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [isPending, startTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Profile form state
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: currentUser.name || "",
    username: currentUser.username || "",
    email: currentUser.email || "",
    badge: currentUser.badge || "",
    image: currentUser.image || "",
  });

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: userSettings.profileVisibility,
    showEmail: userSettings.showEmail,
    showFollowers: userSettings.showFollowers,
    allowMessages: userSettings.allowMessages,
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      emailNotifications: userSettings.emailNotifications,
      pushNotifications: userSettings.pushNotifications,
      likeNotifications: userSettings.likeNotifications,
      commentNotifications: userSettings.commentNotifications,
      followNotifications: userSettings.followNotifications,
      mentionNotifications: userSettings.mentionNotifications,
    });

  const clearMessages = () => {
    setSavedMessage("");
    setErrorMessage("");
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    startTransition(async () => {
      try {
        const result = await updateUserProfile(profileForm);

        if (result.success) {
          setSavedMessage(result.message || "Profile updated successfully!");
          setTimeout(() => setSavedMessage(""), 3000);
        } else {
          setErrorMessage(result.error || "Failed to update profile");
          setTimeout(() => setErrorMessage(""), 5000);
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        setErrorMessage("An unexpected error occurred");
        setTimeout(() => setErrorMessage(""), 5000);
      }
    });
  };

  const handlePrivacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    startTransition(async () => {
      try {
        const result = await updatePrivacySettings(privacySettings);

        if (result.success) {
          setSavedMessage(result.message || "Privacy settings updated!");
          setTimeout(() => setSavedMessage(""), 3000);
        } else {
          setErrorMessage(result.error || "Failed to update privacy settings");
          setTimeout(() => setErrorMessage(""), 5000);
        }
      } catch (error) {
        console.error("Error updating privacy settings:", error);
        setErrorMessage("An unexpected error occurred");
        setTimeout(() => setErrorMessage(""), 5000);
      }
    });
  };

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    startTransition(async () => {
      try {
        const result = await updateNotificationSettings(notificationSettings);

        if (result.success) {
          setSavedMessage(result.message || "Notification settings updated!");
          setTimeout(() => setSavedMessage(""), 3000);
        } else {
          setErrorMessage(
            result.error || "Failed to update notification settings"
          );
          setTimeout(() => setErrorMessage(""), 5000);
        }
      } catch (error) {
        console.error("Error updating notification settings:", error);
        setErrorMessage("An unexpected error occurred");
        setTimeout(() => setErrorMessage(""), 5000);
      }
    });
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="pt-16 max-w-6xl mx-auto px-4 py-6">
      <div className="flex pt-6 flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <div className="bg-bg-secondary rounded-lg border border-border-primary p-4 shadow-md">
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              Settings
            </h2>
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-left ${
                      activeTab === tab.id
                        ? "bg-primary text-white"
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Success Message */}
          {savedMessage && (
            <div className="bg-status-success/20 border border-status-success text-status-success px-4 py-3 rounded-md mb-6 flex items-center justify-between">
              <span>{savedMessage}</span>
              <button onClick={() => setSavedMessage("")}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-status-error/20 border border-status-error text-status-error px-4 py-3 rounded-md mb-6 flex items-center justify-between">
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage("")}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="bg-bg-secondary rounded-lg border border-border-primary p-6 shadow-md">
              <h3 className="text-xl font-semibold text-text-primary mb-6">
                Profile Settings
              </h3>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Profile Image */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Profile Image
                  </label>
                  <div className="flex items-center space-x-4">
                    <Image
                      src={profileForm.image || "/default-avatar.png"}
                      alt="Profile"
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <button
                      type="button"
                      className="flex items-center space-x-2 px-4 py-2 bg-bg-tertiary border border-border-secondary rounded-md hover:bg-bg-quaternary transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Change Image</span>
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary"
                    placeholder="Your display name"
                    required
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        username: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary"
                    placeholder="Your username"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, email: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary"
                    placeholder="your@email.com"
                  />
                </div>

                {/* Badge */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Professional Badge
                  </label>
                  <input
                    value={profileForm.badge}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, badge: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary"
                    placeholder="Your badge"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isPending ? "Saving..." : "Save Profile"}</span>
                </button>
              </form>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <div className="bg-bg-secondary rounded-lg border border-border-primary p-6 shadow-md">
              <h3 className="text-xl font-semibold text-text-primary mb-6">
                Privacy Settings
              </h3>

              <form onSubmit={handlePrivacySubmit} className="space-y-6">
                {/* Profile Visibility */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Profile Visibility
                  </label>
                  <select
                    value={privacySettings.profileVisibility}
                    onChange={(e) =>
                      setPrivacySettings({
                        ...privacySettings,
                        profileVisibility: e.target.value as
                          | "public"
                          | "private",
                      })
                    }
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary"
                  >
                    <option value="public">
                      Public - Anyone can see your profile
                    </option>
                    <option value="private">
                      Private - Only followers can see your profile
                    </option>
                  </select>
                </div>

                {/* Show Email */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-text-primary">
                      Show Email Address
                    </h4>
                    <p className="text-sm text-text-secondary">
                      Display your email address on your public profile
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPrivacySettings({
                        ...privacySettings,
                        showEmail: !privacySettings.showEmail,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacySettings.showEmail
                        ? "bg-primary"
                        : "bg-bg-tertiary"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.showEmail
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Show Followers */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-text-primary">
                      Show Followers Count
                    </h4>
                    <p className="text-sm text-text-secondary">
                      Display your follower count on your profile
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPrivacySettings({
                        ...privacySettings,
                        showFollowers: !privacySettings.showFollowers,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacySettings.showFollowers
                        ? "bg-primary"
                        : "bg-bg-tertiary"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.showFollowers
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Allow Messages */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-text-primary">
                      Allow Direct Messages
                    </h4>
                    <p className="text-sm text-text-secondary">
                      Let other users send you direct messages
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPrivacySettings({
                        ...privacySettings,
                        allowMessages: !privacySettings.allowMessages,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacySettings.allowMessages
                        ? "bg-primary"
                        : "bg-bg-tertiary"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.allowMessages
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isPending ? "Saving..." : "Save Privacy Settings"}
                  </span>
                </button>
              </form>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="bg-bg-secondary rounded-lg border border-border-primary p-6 shadow-md">
              <h3 className="text-xl font-semibold text-text-primary mb-6">
                Notification Settings
              </h3>

              <form onSubmit={handleNotificationSubmit} className="space-y-6">
                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-text-primary">
                      Email Notifications
                    </h4>
                    <p className="text-sm text-text-secondary">
                      Receive notifications via email
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setNotificationSettings({
                        ...notificationSettings,
                        emailNotifications:
                          !notificationSettings.emailNotifications,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationSettings.emailNotifications
                        ? "bg-primary"
                        : "bg-bg-tertiary"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSettings.emailNotifications
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Push Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-text-primary">
                      Push Notifications
                    </h4>
                    <p className="text-sm text-text-secondary">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setNotificationSettings({
                        ...notificationSettings,
                        pushNotifications:
                          !notificationSettings.pushNotifications,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationSettings.pushNotifications
                        ? "bg-primary"
                        : "bg-bg-tertiary"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSettings.pushNotifications
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="border-t border-border-primary pt-4">
                  <h4 className="font-medium text-text-primary mb-4">
                    Activity Notifications
                  </h4>

                  {/* Like Notifications */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h5 className="text-text-primary">Likes</h5>
                      <p className="text-sm text-text-secondary">
                        When someone likes your posts
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setNotificationSettings({
                          ...notificationSettings,
                          likeNotifications:
                            !notificationSettings.likeNotifications,
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.likeNotifications
                          ? "bg-primary"
                          : "bg-bg-tertiary"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.likeNotifications
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Comment Notifications */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h5 className="text-text-primary">Comments</h5>
                      <p className="text-sm text-text-secondary">
                        When someone comments on your posts
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setNotificationSettings({
                          ...notificationSettings,
                          commentNotifications:
                            !notificationSettings.commentNotifications,
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.commentNotifications
                          ? "bg-primary"
                          : "bg-bg-tertiary"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.commentNotifications
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Follow Notifications */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h5 className="text-text-primary">New Followers</h5>
                      <p className="text-sm text-text-secondary">
                        When someone follows you
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setNotificationSettings({
                          ...notificationSettings,
                          followNotifications:
                            !notificationSettings.followNotifications,
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.followNotifications
                          ? "bg-primary"
                          : "bg-bg-tertiary"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.followNotifications
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Mention Notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-text-primary">Mentions</h5>
                      <p className="text-sm text-text-secondary">
                        When someone mentions you in a post or comment
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setNotificationSettings({
                          ...notificationSettings,
                          mentionNotifications:
                            !notificationSettings.mentionNotifications,
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.mentionNotifications
                          ? "bg-primary"
                          : "bg-bg-tertiary"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.mentionNotifications
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isPending ? "Saving..." : "Save Notification Settings"}
                  </span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
