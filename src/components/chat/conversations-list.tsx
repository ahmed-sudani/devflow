"use client";

import { useChat } from "@/contexts/chat-context";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { X, MessageCircle } from "lucide-react";
import { Conversation } from "@/lib/firebase/chat-client";

export function ConversationsList() {
  const { data: session } = useSession();
  const {
    conversations,
    userProfiles,
    openConversation,
    showConversationsList,
    setShowConversationsList,
  } = useChat();

  if (!showConversationsList) return null;

  const getOtherUser = (participants: string[]) => {
    return participants.find((id) => id !== session?.user?.id);
  };

  const getUnreadCount = (conversation: Conversation) => {
    if (!session?.user?.id) return 0;
    return conversation.unreadCount?.[session.user.id] || 0;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-bg-secondary border-l border-border-primary shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-primary">
          <h2 className="text-lg font-semibold text-text-primary">Messages</h2>
          <button
            onClick={() => setShowConversationsList(false)}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <MessageCircle className="w-12 h-12 text-text-secondary mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                No conversations yet
              </h3>
              <p className="text-text-secondary text-sm">
                Start a conversation by visiting someone&apos;s profile and
                clicking &quot;Message&quot;
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-primary">
              {conversations.map((conversation) => {
                const otherUserId = getOtherUser(conversation.participants);
                const otherUser = otherUserId
                  ? userProfiles[otherUserId]
                  : null;
                const unreadCount = getUnreadCount(conversation);

                if (!otherUser) return null;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => openConversation(conversation.id)}
                    className="w-full p-4 hover:bg-bg-tertiary transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Image
                          src={otherUser.image || "/default-avatar.png"}
                          alt={otherUser.name || "User"}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-text-primary truncate">
                            {otherUser.name || "Anonymous User"}
                          </h4>
                          {conversation.lastMessageTimestamp && (
                            <span className="text-xs text-text-secondary">
                              {formatDistanceToNow(
                                conversation.lastMessageTimestamp.toDate(),
                                { addSuffix: true }
                              )}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-sm text-text-secondary truncate">
                            {conversation.lastMessage || "No messages yet"}
                          </p>
                          {unreadCount > 0 && (
                            <div className="w-2 h-2 bg-primary rounded-full ml-2"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
