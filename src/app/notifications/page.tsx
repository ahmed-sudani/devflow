"use client";

import {
  Notification,
  deleteNotifications,
  getNotificationCounts,
  getNotificationsWithPagination,
  markNotificationsAsRead,
  markNotificationsAsUnread,
} from "@/lib/firebase/notifications-client";
import { formatDistanceToNow } from "date-fns";
import { Timestamp } from "firebase/firestore";
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  Heart,
  MessageCircle,
  RotateCcw,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type FilterType = "all" | "unread" | "read";

interface NotificationCounts {
  all: number;
  unread: number;
  read: number;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastTimestamp, setLastTimestamp] = useState<Timestamp | undefined>();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [counts, setCounts] = useState<NotificationCounts>({
    all: 0,
    unread: 0,
    read: 0,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Load notifications
  const loadNotifications = useCallback(
    async (filter: FilterType = "all", reset: boolean = false) => {
      if (!session?.user?.id) return;

      if (reset) {
        setIsLoading(true);
        setNotifications([]);
        setLastTimestamp(undefined);
        setHasMore(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const result = await getNotificationsWithPagination(
          session.user.id,
          reset ? undefined : lastTimestamp,
          20,
          filter
        );

        if (reset) {
          setNotifications(result.notifications);
        } else {
          setNotifications((prev) => [...prev, ...result.notifications]);
        }

        setHasMore(result.hasMore);
        setLastTimestamp(result.lastTimestamp);
      } catch (error) {
        console.error("Error loading notifications:", error);
      } finally {
        if (reset) {
          setIsLoading(false);
        } else {
          setIsLoadingMore(false);
        }
      }
    },
    [session?.user?.id, lastTimestamp]
  );

  // Load counts
  const loadCounts = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const counts = await getNotificationCounts(session.user.id);
      setCounts(counts);
    } catch (error) {
      console.error("Error loading counts:", error);
    }
  }, [session?.user?.id]);

  // Initial load
  useEffect(() => {
    if (session?.user?.id) {
      loadNotifications(activeFilter, true);
      loadCounts();
    }
  }, [session?.user?.id, activeFilter]);

  // Filter change handler
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setSelectedIds(new Set());
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)));
    }
  };

  const handleSelectNotification = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Bulk actions
  const handleBulkMarkAsRead = async () => {
    if (selectedIds.size === 0) return;

    setIsUpdating(true);
    try {
      await markNotificationsAsRead(Array.from(selectedIds));
      setNotifications((prev) =>
        prev.map((n) => (selectedIds.has(n.id) ? { ...n, read: true } : n))
      );
      setSelectedIds(new Set());
      await loadCounts();
    } catch (error) {
      console.error("Error marking as read:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkMarkAsUnread = async () => {
    if (selectedIds.size === 0) return;

    setIsUpdating(true);
    try {
      await markNotificationsAsUnread(Array.from(selectedIds));
      setNotifications((prev) =>
        prev.map((n) => (selectedIds.has(n.id) ? { ...n, read: false } : n))
      );
      setSelectedIds(new Set());
      await loadCounts();
    } catch (error) {
      console.error("Error marking as unread:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setIsUpdating(true);
    try {
      await deleteNotifications(Array.from(selectedIds));
      setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
      setSelectedIds(new Set());
      await loadCounts();
    } catch (error) {
      console.error("Error deleting notifications:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Load more notifications
  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      loadNotifications(activeFilter, false);
    }
  };

  // Notification icon helper
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow":
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case "like":
        return <Heart className="w-4 h-4 text-red-500" />;
      case "comment":
        return <MessageCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-text-secondary" />;
    }
  };

  // Notification link helper
  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
      case "follow":
        return `/profile/${notification.senderId}`;
      case "like":
      case "comment":
        return `/posts/${notification.entityId}`;
      default:
        return "#";
    }
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen pt-16 bg-bg-primary">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-text-secondary">
              Please sign in to view notifications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-bg-primary">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <Bell className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-text-primary">
              Notifications
            </h1>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-1 bg-bg-secondary rounded-lg p-1">
              {(["all", "unread", "read"] as FilterType[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                    activeFilter === filter
                      ? "bg-primary text-white"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                  }`}
                >
                  {filter} ({counts[filter]})
                </button>
              ))}
            </div>

            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-text-secondary">
                  {selectedIds.size} selected
                </span>
                <button
                  onClick={handleBulkMarkAsRead}
                  disabled={isUpdating}
                  className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4 text-green-500" />
                </button>
                <button
                  onClick={handleBulkMarkAsUnread}
                  disabled={isUpdating}
                  className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50"
                  title="Mark as unread"
                >
                  <RotateCcw className="w-4 h-4 text-blue-500" />
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isUpdating}
                  className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            )}
          </div>

          {/* Select All */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-primary">
              <button
                onClick={handleSelectAll}
                className="flex items-center space-x-2 text-sm text-primary hover:text-primary-dark transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                <span>
                  {selectedIds.size === notifications.length
                    ? "Deselect All"
                    : "Select All"}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-bg-secondary rounded-lg border border-border-primary overflow-hidden">
          {isLoading && notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-text-secondary text-sm mt-3">
                Loading notifications...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                {activeFilter === "all"
                  ? "No notifications yet"
                  : `No ${activeFilter} notifications`}
              </h3>
              <p className="text-text-secondary text-sm">
                {activeFilter === "all"
                  ? "You'll see notifications here when you get likes, comments, and follows."
                  : `No ${activeFilter} notifications to show.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-primary">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-center space-x-4 p-4 hover:bg-bg-tertiary transition-colors ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedIds.has(notification.id)}
                    onChange={() => handleSelectNotification(notification.id)}
                    className="w-4 h-4 text-primary bg-bg-tertiary border-border-secondary rounded focus:ring-primary focus:ring-2"
                  />

                  {/* Notification Content */}
                  <Link
                    href={getNotificationLink(notification)}
                    className="flex-1 flex items-start space-x-3 min-w-0"
                  >
                    {/* Sender Avatar */}
                    <div className="relative flex-shrink-0">
                      <Image
                        src={notification.senderImage || "/default-avatar.png"}
                        alt={notification.senderName || "User"}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {/* Notification Type Icon */}
                      <div className="absolute -bottom-1 -right-1 bg-bg-secondary border border-border-primary rounded-full p-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    {/* Notification Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary">
                        <span className="font-medium">
                          {notification.senderName || "Someone"}
                        </span>{" "}
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-text-secondary">
                          {notification.timestamp &&
                            formatDistanceToNow(
                              notification.timestamp.toDate(),
                              {
                                addSuffix: true,
                              }
                            )}
                        </p>

                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="p-4 text-center border-t border-border-primary">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingMore ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      "Load More"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
