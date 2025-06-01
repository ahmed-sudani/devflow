"use client";

import { useChat } from "@/contexts/chat-context";
import { useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { X, Send, ArrowLeft } from "lucide-react";

export function ChatWindow() {
  const { data: session } = useSession();
  const {
    currentConversation,
    messages,
    userProfiles,
    conversations,
    sendMessage,
    closeConversation,
    showChat,
    setShowConversationsList,
  } = useChat();

  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [messageText]);

  if (!showChat || !currentConversation) return null;

  const currentConv = conversations.find((c) => c.id === currentConversation);
  if (!currentConv) return null;

  const otherUserId = currentConv.participants.find(
    (id) => id !== session?.user?.id
  );
  const otherUser = otherUserId ? userProfiles[otherUserId] : null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || isSending || !otherUserId) return;

    setIsSending(true);
    try {
      await sendMessage(messageText.trim(), otherUserId);
      setMessageText("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-bg-secondary border-l border-border-primary shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-primary bg-bg-secondary">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                closeConversation();
                setShowConversationsList(true);
              }}
              className="p-1 hover:bg-bg-tertiary rounded-lg transition-colors md:hidden"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>

            {otherUser && (
              <>
                <Image
                  src={otherUser.image || "/default-avatar.png"}
                  alt={otherUser.name || "User"}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-text-primary">
                    {otherUser.name || "Anonymous User"}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {otherUser.username ? `@${otherUser.username}` : ""}
                  </p>
                </div>
              </>
            )}
          </div>

          <button
            onClick={closeConversation}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-text-secondary" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Start the conversation
              </h3>
              <p className="text-text-secondary text-sm">
                Send a message to {otherUser?.name} to get started
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.senderId === session?.user?.id;
              //   const sender = isOwnMessage ? session?.user : otherUser;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] ${
                      isOwnMessage
                        ? "bg-primary text-white"
                        : "bg-bg-tertiary text-text-primary"
                    } rounded-2xl px-4 py-2`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <p className="text-xs mt-1">
                      {message.timestamp &&
                        formatDistanceToNow(message.timestamp.toDate(), {
                          addSuffix: true,
                        })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-border-primary"
        >
          <div className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="w-full px-4 py-3 bg-bg-tertiary border border-border-secondary rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary placeholder-text-secondary min-h-[44px] max-h-32"
                rows={1}
                disabled={isSending}
              />
            </div>
            <button
              type="submit"
              disabled={!messageText.trim() || isSending}
              className="p-3 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
