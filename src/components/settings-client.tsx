"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  Shield,
  Bell,
  Trash2,
  Save,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";

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

interface SettingsClientProps {
  currentUser: CurrentUser;
}

type Tab = "profile" | "account" | "privacy" | "notifications";

export default function SettingsClient({ currentUser }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [isPending, startTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState("");
  const router = useRouter();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name || "",
    username: currentUser.username || "",
    email: currentUser.email || "",
    badge: currentUser.badge || "",
    image: currentUser.image || "",
  });

  // Account form state
  const [accountForm, setAccountForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public" as "public" | "private",
    showEmail: false,
    showFollowers: true,
    allowMessages: true,
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    likeNotifications: true,
    commentNotifications: true,
    followNotifications: true,
    mentionNotifications: true,
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        // TODO: Create updateUserProfile action
        // const result = await updateUserProfile(profileForm);

        // Mock success for now
        setSavedMessage("Profile updated successfully!");
        setTimeout(() => setSavedMessage(""), 3000);

        console.log("Profile form:", profileForm);
      } catch (error) {
        console.error("Error updating profile:", error);
      }
    });
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (accountForm.newPassword !== accountForm.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    startTransition(async () => {
      try {
        // TODO: Create updatePassword action
        // const result = await updatePassword(accountForm.currentPassword, accountForm.newPassword);

        setSavedMessage("Password updated successfully!");
        setTimeout(() => setSavedMessage(""), 3000);

        setAccountForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } catch (error) {
        console.error("Error updating password:", error);
      }
    });
  };

  const handlePrivacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        // TODO: Create updatePrivacySettings action
        // const result = await updatePrivacySettings(privacySettings);

        setSavedMessage("Privacy settings updated!");
        setTimeout(() => setSavedMessage(""), 3000);

        console.log("Privacy settings:", privacySettings);
      } catch (error) {
        console.error("Error updating privacy settings:", error);
      }
    });
  };

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        // TODO: Create updateNotificationSettings action
        // const result = await updateNotificationSettings(notificationSettings);

        setSavedMessage("Notification settings updated!");
        setTimeout(() => setSavedMessage(""), 3000);

        console.log("Notification settings:", notificationSettings);
      } catch (error) {
        console.error("Error updating notification settings:", error);
      }
    });
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (confirmed) {
      const doubleConfirm = window.confirm(
        "This will permanently delete all your posts, comments, and account data. Are you absolutely sure?"
      );

      if (doubleConfirm) {
        try {
          // TODO: Create deleteAccount action
          // await deleteAccount();
          console.log("Account deletion requested");
          router.push("/");
        } catch (error) {
          console.error("Error deleting account:", error);
        }
      }
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "account", label: "Account", icon: Settings },
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
          {savedMessage && (
            <div className="bg-status-success/20 border border-status-success text-status-success px-4 py-3 rounded-md mb-6 flex items-center justify-between">
              <span>{savedMessage}</span>
              <button onClick={() => setSavedMessage("")}>
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
                      src={profileForm.image}
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
                  <select
                    value={profileForm.badge}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, badge: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary"
                  >
                    <option value="">No Badge</option>
                    <option value="Junior Developer">Junior Developer</option>
                    <option value="Senior Developer">Senior Developer</option>
                    <option value="Lead Developer">Lead Developer</option>
                    <option value="Architect">Architect</option>
                    <option value="DevOps Engineer">DevOps Engineer</option>
                    <option value="Full Stack Developer">
                      Full Stack Developer
                    </option>
                    <option value="Product Manager">Product Manager</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="Data Scientist">Data Scientist</option>
                    <option value="QA Engineer">QA Engineer</option>
                  </select>
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

          {/* Account Tab */}
          {activeTab === "account" && (
            <div className="bg-bg-secondary rounded-lg border border-border-primary p-6 shadow-md">
              <h3 className="text-xl font-semibold text-text-primary mb-6">
                Account Settings
              </h3>

              <form onSubmit={handleAccountSubmit} className="space-y-6">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={accountForm.currentPassword}
                    onChange={(e) =>
                      setAccountForm({
                        ...accountForm,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary"
                    placeholder="Enter current password"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={accountForm.newPassword}
                    onChange={(e) =>
                      setAccountForm({
                        ...accountForm,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary"
                    placeholder="Enter new password"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={accountForm.confirmPassword}
                    onChange={(e) =>
                      setAccountForm({
                        ...accountForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary"
                    placeholder="Confirm new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isPending ? "Updating..." : "Update Password"}</span>
                </button>
              </form>

              {/* Danger Zone */}
              <div className="mt-8 pt-6 border-t border-border-primary">
                <h4 className="text-lg font-semibold text-status-error mb-4">
                  Danger Zone
                </h4>
                <div className="bg-status-error/10 border border-status-error/20 rounded-md p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-medium text-text-primary mb-1">
                        Delete Account
                      </h5>
                      <p className="text-sm text-text-secondary">
                        Once you delete your account, there is no going back.
                        Please be certain.
                      </p>
                    </div>
                    <button
                      onClick={handleDeleteAccount}
                      className="flex items-center space-x-2 px-4 py-2 bg-status-error text-white rounded-md hover:bg-status-error/80 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>
              </div>
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
