"use client";

import { useNotifications } from "@/contexts/notification-context";
import { Notification } from "@/lib/firebase/notifications-client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, Heart, MessageCircle, UserPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function NotificationBell() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications();

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

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead([notification.id]);
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="relative p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
        >
          <Bell className="w-5 h-5 text-text-secondary hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </div>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="w-80 bg-bg-secondary border border-border-primary rounded-lg shadow-xl z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-primary">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-text-primary" />
              <h3 className="font-semibold text-text-primary">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:text-primary-dark transition-colors"
                  title="Mark all as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              {/* We don't need a close (X) button, since clicking outside closes dropdown */}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-text-secondary text-sm mt-2">
                  Loading notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
                <p className="text-text-secondary text-sm">
                  No notifications yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border-primary">
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={getNotificationLink(notification)}
                    onClick={() => handleNotificationClick(notification)}
                    className={`block p-4 hover:bg-bg-tertiary transition-colors ${
                      !notification.read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Avatar */}
                      <div className="relative">
                        <Image
                          src={
                            notification.senderImage || "/default-avatar.png"
                          }
                          alt={notification.senderName || "User"}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-bg-secondary border border-border-primary rounded-full p-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>

                      {/* Content */}
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
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-border-primary bg-bg-tertiary">
              <Link
                href="/notifications"
                className="text-xs text-primary hover:text-primary-dark transition-colors block text-center"
              >
                View all notifications
              </Link>
            </div>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
