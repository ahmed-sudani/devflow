"use client";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase/config";
import { onSnapshot, orderBy } from "firebase/firestore";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Timestamp;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTimestamp?: Timestamp;
  lastSenderId?: string;
  unreadCount: { [userId: string]: number };
}

// Subscribe to messages in a conversation
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: ChatMessage[]) => void
) {
  const messagesRef = collection(db, "messages");
  const q = query(
    messagesRef,
    where("conversationId", "==", conversationId),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatMessage[];
    callback(messages);
  });
}

// Subscribe to user's conversations
// In chat-client.ts
export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
) {
  const conversationsRef = collection(db, "conversations");
  const q = query(
    conversationsRef,
    where("participants", "array-contains", userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      try {
        const conversations = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Conversation[];

        conversations.sort((a, b) => {
          if (!a.lastMessageTimestamp && !b.lastMessageTimestamp) return 0;
          if (!a.lastMessageTimestamp) return 1;
          if (!b.lastMessageTimestamp) return -1;
          return (
            b.lastMessageTimestamp.toMillis() -
            a.lastMessageTimestamp.toMillis()
          );
        });

        callback(conversations);
      } catch (error) {
        console.error("Error processing conversations:", error);
      }
    },
    (error) => {
      console.error("Error subscribing to conversations:", error);
    }
  );
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Timestamp;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTimestamp?: Timestamp;
  lastSenderId?: string;
  unreadCount: { [userId: string]: number };
}

// Create or get existing conversation between two users
export async function createOrGetConversation(
  userId1: string,
  userId2: string
): Promise<string> {
  const conversationsRef = collection(db, "conversations");

  // Check if conversation already exists
  const q = query(
    conversationsRef,
    where("participants", "array-contains", userId1)
  );

  const querySnapshot = await getDocs(q);

  console.log({ userId1, userId2 });

  for (const doc of querySnapshot.docs) {
    const data = doc.data() as Conversation;
    if (data.participants.includes(userId2) && data.participants.length === 2) {
      return doc.id;
    }
  }

  // Create new conversation
  const newConversation: Omit<Conversation, "id"> = {
    participants: [userId1, userId2],
    unreadCount: { [userId1]: 0, [userId2]: 0 },
  };

  console.log(
    "📤 Writing to Firestore:",
    JSON.stringify(newConversation, null, 2)
  );

  const docRef = await addDoc(conversationsRef, newConversation);
  return docRef.id;
}

// Send a message
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  otherUserId: string
) {
  // Add message to messages collection
  const messagesRef = collection(db, "messages");
  await addDoc(messagesRef, {
    conversationId,
    senderId,
    content,
    timestamp: serverTimestamp(),
    read: false,
  });

  // Get current unread count for the OTHER user (messages they haven't read)
  const unreadQuery = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId),
    where("senderId", "!=", otherUserId), // Messages NOT sent by the other user
    where("read", "==", false)
  );
  const unreadSnapshot = await getDocs(unreadQuery);

  // Update conversation with last message info
  const conversationRef = doc(db, "conversations", conversationId);
  await updateDoc(conversationRef, {
    lastMessage: content,
    lastMessageTimestamp: serverTimestamp(),
    lastSenderId: senderId,
    [`unreadCount.${otherUserId}`]: unreadSnapshot.size, // Don't add +1, the new message is already included
  });
}

// Mark messages as read
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
) {
  const messagesRef = collection(db, "messages");
  const q = query(
    messagesRef,
    where("conversationId", "==", conversationId),
    where("senderId", "!=", userId),
    where("read", "==", false)
  );

  const querySnapshot = await getDocs(q);
  const batch = querySnapshot.docs.map(async (docSnapshot) => {
    await updateDoc(docSnapshot.ref, { read: true });
  });

  await Promise.all(batch);

  // Reset unread count for this user
  const conversationRef = doc(db, "conversations", conversationId);
  await updateDoc(conversationRef, {
    [`unreadCount.${userId}`]: 0,
  });
}
