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
  Conversation,
  ChatMessage,
  subscribeToConversations,
  subscribeToMessages,
  createOrGetConversation,
  sendMessage as sendFirebaseMessage,
  markMessagesAsRead,
} from "@/lib/firebase/chat-client";

import { User } from "@/types";
import { getUserProfile, getUserProfiles } from "@/lib/actions/user";
import { getFirebaseToken } from "@/lib/actions/auth";
import {
  signOutFromFirebase,
  signInToFirebase,
  onFirebaseAuthStateChanged,
} from "@/lib/firebase/client-auth";
import { User as FirebaseUser } from "firebase/auth";

interface ChatContextType {
  // State
  conversations: Conversation[];
  currentConversation: string | null;
  messages: ChatMessage[];
  userProfiles: { [userId: string]: User };
  isLoading: boolean;
  firebaseUser: FirebaseUser | null;
  isFirebaseAuthenticated: boolean;

  // Actions
  openConversation: (conversationId: string) => void;
  closeConversation: () => void;
  sendMessage: (content: string, otherUserId: string) => Promise<void>;
  startConversation: (otherUserId: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;

  // UI State
  showConversationsList: boolean;
  setShowConversationsList: (show: boolean) => void;
  showChat: boolean;
  setShowChat: (show: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userProfiles, setUserProfiles] = useState<{
    [userId: string]: User;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showConversationsList, setShowConversationsList] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseAuthenticated, setIsFirebaseAuthenticated] = useState(false);

  const markAsRead = useCallback(
    async (conversationId: string) => {
      if (!session?.user?.id) return;
      await markMessagesAsRead(conversationId, session.user.id);
    },
    [session?.user.id]
  );

  // Handle NextAuth session changes
  useEffect(() => {
    async function handleSessionChange() {
      if (isLoading) return;

      if (!session?.user?.id) {
        // User logged out of NextAuth, also sign out of Firebase
        if (firebaseUser) {
          await signOutFromFirebase();
        }
        setIsFirebaseAuthenticated(false);
        setFirebaseUser(null);
        setConversations([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const customToken = await getFirebaseToken();
        await signInToFirebase(customToken);
        // Firebase auth state change will be handled by onAuthStateChanged
      } catch (error) {
        console.error("Firebase authentication failed:", error);
        setIsFirebaseAuthenticated(false);
        setIsLoading(false);
      }
    }

    handleSessionChange();
  }, [firebaseUser, isLoading, session?.user?.id]);

  // Enhanced version: Mark messages as read in real-time
  useEffect(() => {
    if (!currentConversation || !session?.user?.id) return;

    const unsubscribe = subscribeToMessages(
      currentConversation,
      async (newMessages) => {
        setMessages(newMessages);

        // Auto-mark unread messages from others as read when conversation is active
        const unreadFromOthers = newMessages.filter(
          (msg) => msg.senderId !== session?.user?.id && !msg.read
        );

        if (unreadFromOthers.length > 0) {
          // Mark as read immediately for better UX
          await markAsRead(currentConversation);
        }
      }
    );

    return unsubscribe;
  }, [currentConversation, markAsRead, session?.user?.id]);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onFirebaseAuthStateChanged((user) => {
      setFirebaseUser(user);
      setIsFirebaseAuthenticated(!!user);
      setIsLoading(false);

      if (!user && session?.user?.id) {
        // Firebase auth lost but NextAuth session exists - try to re-authenticate
        getFirebaseToken().then(signInToFirebase).catch(console.error);
      }
    });

    return unsubscribe;
  }, [session?.user?.id]);

  // Subscribe to conversations when user is authenticated
  useEffect(() => {
    if (!isFirebaseAuthenticated || !session?.user?.id) {
      setConversations([]);
      return;
    }

    const unsubscribe = subscribeToConversations(
      session.user.id,
      async (conversations) => {
        setConversations(conversations);

        // Get all unique user IDs from conversations
        const userIds = new Set<string>();
        conversations.forEach((conv) => {
          conv.participants.forEach((id) => {
            if (id !== session?.user?.id) userIds.add(id);
          });
        });

        // Fetch user profiles for all participants
        if (userIds.size > 0) {
          const profiles = await getUserProfiles(Array.from(userIds));
          const profilesMap = profiles.reduce(
            (acc, profile) => {
              acc[profile.id] = profile;
              return acc;
            },
            {} as { [userId: string]: User }
          );

          setUserProfiles((prev) => ({ ...prev, ...profilesMap }));
        }
      }
    );

    return unsubscribe;
  }, [isFirebaseAuthenticated, session?.user?.id]);

  // Subscribe to messages when a conversation is selected
  useEffect(() => {
    if (!currentConversation) return;

    const unsubscribe = subscribeToMessages(currentConversation, setMessages);
    return unsubscribe;
  }, [currentConversation]);

  const openConversation = async (conversationId: string) => {
    setCurrentConversation(conversationId);
    setShowChat(true);
    setShowConversationsList(false);
  };

  const closeConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
    setShowChat(false);
  };

  const sendMessage = async (content: string, otherUserId: string) => {
    if (!session?.user?.id || !currentConversation) return;

    await sendFirebaseMessage(
      currentConversation,
      session.user.id,
      content,
      otherUserId
    );
  };

  const startConversation = async (otherUserId: string) => {
    if (!session?.user?.id) return;

    console.log("👀 Before creating convo:", {
      firebaseUser,
      isFirebaseAuthenticated,
      expectedUid: session.user.id,
    });

    setIsLoading(true);
    try {
      const conversationId = await createOrGetConversation(
        session.user.id,
        otherUserId
      );

      // Fetch other user's profile if we don't have it
      if (!userProfiles[otherUserId]) {
        const profile = await getUserProfile(otherUserId);
        if (profile) {
          setUserProfiles((prev) => ({ ...prev, [otherUserId]: profile }));
        }
      }

      await openConversation(conversationId);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        firebaseUser,
        isFirebaseAuthenticated,
        currentConversation,
        messages,
        userProfiles,
        isLoading,
        openConversation,
        closeConversation,
        sendMessage,
        startConversation,
        markAsRead,
        showConversationsList,
        setShowConversationsList,
        showChat,
        setShowChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
