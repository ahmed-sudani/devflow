"use client";

import { useChat } from "@/contexts/chat-context";
import { ConversationsList } from "./conversations-list";
import { ChatWindow } from "./chat-window";

export function ChatManager() {
  const { showConversationsList, showChat } = useChat();

  return (
    <>
      {showConversationsList && <ConversationsList />}
      {showChat && <ChatWindow />}
    </>
  );
}
