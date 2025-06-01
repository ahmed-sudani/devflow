// components/mobile-menu.tsx - Updated version with chat
"use client";

import { useState } from "react";
import { useChat } from "@/contexts/chat-context";
import Link from "next/link";
import { Menu, X, Home, Bell, Mail, Settings, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function MobileMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
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
    setIsOpen(false);
  };

  const handleSignOut = () => {
    signOut();
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-text-secondary" />
        ) : (
          <Menu className="w-5 h-5 text-text-secondary" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-16 right-4 w-64 bg-bg-secondary border border-border-primary rounded-lg shadow-lg z-40">
          <div className="p-2">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 w-full p-3 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <Home className="w-5 h-5 text-text-secondary" />
              <span className="text-text-primary">Home</span>
            </Link>

            <button className="flex items-center space-x-3 w-full p-3 hover:bg-bg-tertiary rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-text-secondary" />
              <span className="text-text-primary">Notifications</span>
            </button>

            <button
              onClick={handleMailClick}
              className="flex items-center justify-between w-full p-3 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-text-secondary" />
                <span className="text-text-primary">Messages</span>
              </div>
              {unreadCount > 0 && (
                <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 w-full p-3 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-text-secondary" />
              <span className="text-text-primary">Profile</span>
            </Link>

            <div className="border-t border-border-primary my-2"></div>

            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 w-full p-3 hover:bg-bg-tertiary rounded-lg transition-colors text-left"
            >
              <LogOut className="w-5 h-5 text-text-secondary" />
              <span className="text-text-primary">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
