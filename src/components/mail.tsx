"use client";

import { useChat } from "@/contexts/chat-context";
import { Mail } from "lucide-react";
import { useSession } from "next-auth/react";

export default function MailButton() {
  const { data: session } = useSession();

  const { setShowConversationsList, conversations } = useChat();

  // Calculate total unread messages
  const unreadCount = conversations.reduce((total, conv) => {
    const userUnread = session?.user?.id
      ? conv.unreadCount?.[session.user.id] || 0
      : 0;
    return total + userUnread;
  }, 0);

  const handleMailClick = () => {
    setShowConversationsList(true);
  };

  return (
    <button
      onClick={handleMailClick}
      className="hover:text-primary transition-colors relative"
    >
      <Mail className="w-5 h-5 lg:w-6 lg:h-6 text-text-secondary hover:text-primary transition-colors cursor-pointer" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
