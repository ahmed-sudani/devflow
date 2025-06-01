"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

import { useSession } from "next-auth/react";

import {
  Notification,
  subscribeToNotifications,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
} from "@/lib/firebase/notifications-client";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  // return <NotificationContextProvider>{children}</NotificationContextProvider>
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Subscribe to notifications when user is authenticated
  useEffect(() => {
    if (!session?.user?.id) {
      setNotifications([]);
      return;
    }

    setIsLoading(true);

    const unsubscribe = subscribeToNotifications(
      session.user.id,
      (newNotifications) => {
        setNotifications(newNotifications);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [session?.user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    if (notificationIds.length === 0) return;

    try {
      await markNotificationsAsRead(notificationIds);
      // Optimistically update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notificationIds.includes(notification.id)
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!session?.user?.id) return;

    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

    if (unreadIds.length === 0) return;

    try {
      await markAllNotificationsAsRead(session.user.id);
      // Optimistically update local state
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, [session?.user?.id, notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        showNotifications,
        setShowNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
