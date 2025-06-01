"use client";

import { db } from "@/lib/firebase/config";
import { User } from "@/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  type: "follow" | "like" | "comment";
  entityId?: string; // postId for like/comment
  message: string;
  read: boolean;
  timestamp: Timestamp;
  senderName?: string;
  senderImage?: string;
}

// Subscribe to user's notifications
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
) {
  const notificationsRef = collection(db, "notifications");
  const q = query(
    notificationsRef,
    where("recipientId", "==", userId),
    orderBy("timestamp", "desc"),
    limit(50) // Limit to recent 50 notifications
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
    callback(notifications);
  });
}

// Mark notifications as read
export async function markNotificationsAsRead(notificationIds: string[]) {
  const promises = notificationIds.map(async (id) => {
    const notificationRef = doc(db, "notifications", id);
    await updateDoc(notificationRef, { read: true });
  });

  await Promise.all(promises);
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string) {
  const notificationsRef = collection(db, "notifications");
  const q = query(
    notificationsRef,
    where("recipientId", "==", userId),
    where("read", "==", false)
  );

  const querySnapshot = await getDocs(q);
  const promises = querySnapshot.docs.map(async (docSnapshot) => {
    await updateDoc(docSnapshot.ref, { read: true });
  });

  await Promise.all(promises);
}

export async function sendFollowNotification(
  follower: Pick<User, "id" | "name" | "image">,
  followingId: string
) {
  try {
    await createNotification({
      recipientId: followingId,
      senderId: follower.id,
      type: "follow",
      message: `started following you`,
      senderName: follower.name || undefined,
      senderImage: follower.image || undefined,
    });
  } catch (error) {
    console.error("Error sending follow notification:", error);
  }
}

// Send like notification
export async function sendLikeNotification(
  liker: Pick<User, "id" | "name" | "image">,
  postOwnerId: string,
  postId: string
) {
  try {
    // Don't send notification if user likes their own post
    if (liker.id === postOwnerId) return;

    await createNotification({
      recipientId: postOwnerId,
      senderId: liker.id,
      type: "like",
      entityId: postId,
      message: `liked your post`,
      senderName: liker.name || undefined,
      senderImage: liker.image || undefined,
    });
  } catch (error) {
    console.error("Error sending like notification:", error);
  }
}

// Send comment notification
export async function sendCommentNotification(
  commenter: Pick<User, "id" | "name" | "image">,
  postOwnerId: string,
  postId: string
) {
  try {
    // Don't send notification if user comments on their own post
    if (commenter.id === postOwnerId) return;

    await createNotification({
      recipientId: postOwnerId,
      senderId: commenter.id,
      type: "comment",
      entityId: postId,
      message: `commented on your post`,
      senderName: commenter.name || undefined,
      senderImage: commenter.image || undefined,
    });
  } catch (error) {
    console.error("Error sending comment notification:", error);
  }
}

// Create a new notification
export async function createNotification({
  recipientId,
  senderId,
  type,
  entityId,
  message,
  senderName,
  senderImage,
}: {
  recipientId: string;
  senderId: string;
  type: "follow" | "like" | "comment";
  entityId?: string;
  message: string;
  senderName?: string;
  senderImage?: string;
}) {
  // Don't send notification to yourself
  if (recipientId === senderId) return;

  const notificationsRef = collection(db, "notifications");

  await addDoc(notificationsRef, {
    recipientId,
    senderId,
    type,
    entityId: entityId || null,
    message,
    read: false,
    timestamp: serverTimestamp(),
    senderName: senderName || null,
    senderImage: senderImage || null,
  });
}

// Get notifications with pagination
export async function getNotificationsWithPagination(
  userId: string,
  lastTimestamp?: Timestamp,
  limitCount: number = 20,
  filter: "all" | "unread" | "read" = "all"
) {
  const notificationsRef = collection(db, "notifications");
  let q = query(
    notificationsRef,
    where("recipientId", "==", userId),
    orderBy("timestamp", "desc")
  );

  // Apply filter
  if (filter === "unread") {
    q = query(q, where("read", "==", false));
  } else if (filter === "read") {
    q = query(q, where("read", "==", true));
  }

  // Add pagination
  if (lastTimestamp) {
    q = query(q, startAfter(lastTimestamp));
  }

  q = query(q, limit(limitCount));

  const querySnapshot = await getDocs(q);
  const notifications = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Notification[];

  return {
    notifications,
    hasMore: querySnapshot.docs.length === limitCount,
    lastTimestamp:
      querySnapshot.docs[querySnapshot.docs.length - 1]?.data().timestamp,
  };
}

// Mark notifications as unread
export async function markNotificationsAsUnread(notificationIds: string[]) {
  const promises = notificationIds.map(async (id) => {
    const notificationRef = doc(db, "notifications", id);
    await updateDoc(notificationRef, { read: false });
  });

  await Promise.all(promises);
}

// Delete notifications
export async function deleteNotifications(notificationIds: string[]) {
  const promises = notificationIds.map(async (id) => {
    const notificationRef = doc(db, "notifications", id);
    await deleteDoc(notificationRef);
  });

  await Promise.all(promises);
}

// Get notification counts by type
export async function getNotificationCounts(userId: string) {
  const notificationsRef = collection(db, "notifications");

  const [allQuery, unreadQuery, readQuery] = await Promise.all([
    getDocs(query(notificationsRef, where("recipientId", "==", userId))),
    getDocs(
      query(
        notificationsRef,
        where("recipientId", "==", userId),
        where("read", "==", false)
      )
    ),
    getDocs(
      query(
        notificationsRef,
        where("recipientId", "==", userId),
        where("read", "==", true)
      )
    ),
  ]);

  return {
    all: allQuery.size,
    unread: unreadQuery.size,
    read: readQuery.size,
  };
}
