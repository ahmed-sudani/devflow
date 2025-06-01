"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Menu as MenuIcon,
  X as XIcon,
  Home,
  Bell,
  Mail,
  Settings,
  LogOut,
} from "lucide-react";
import { useChat } from "@/contexts/chat-context";

export default function MobileMenu() {
  const { data: session } = useSession();
  const { setShowConversationsList, conversations } = useChat();
  const [open, setOpen] = useState(false);

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

  const handleSignOut = () => {
    signOut();
  };

  return (
    <div className="md:hidden">
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger asChild>
          <button className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors">
            {open ? (
              <XIcon className="w-5 h-5 text-text-secondary" />
            ) : (
              <MenuIcon className="w-5 h-5 text-text-secondary" />
            )}
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          {/* Optional dark overlay */}
          {/* <DropdownMenu.Overlay className="fixed inset-0 bg-black/30 z-30" /> */}

          <DropdownMenu.Content
            side="bottom"
            align="end"
            sideOffset={8}
            className="w-64 bg-bg-secondary border border-border-primary rounded-lg shadow-lg z-40"
          >
            <div className="p-2 space-y-1">
              {/* Home */}
              <DropdownMenu.Item asChild>
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center space-x-3 w-full p-3 hover:bg-bg-tertiary rounded-lg transition-colors"
                >
                  <Home className="w-5 h-5 text-text-secondary" />
                  <span className="text-text-primary">Home</span>
                </Link>
              </DropdownMenu.Item>

              {/* Notifications */}
              <DropdownMenu.Item asChild>
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="flex items-center space-x-3 w-full p-3 hover:bg-bg-tertiary rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5 text-text-secondary" />
                  <span className="text-text-primary">Notifications</span>
                </Link>
              </DropdownMenu.Item>

              {/* Messages */}
              <DropdownMenu.Item asChild>
                <button
                  onClick={() => {
                    handleMailClick();
                    setOpen(false);
                  }}
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
              </DropdownMenu.Item>

              {/* Profile */}
              <DropdownMenu.Item asChild>
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center space-x-3 w-full p-3 hover:bg-bg-tertiary rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5 text-text-secondary" />
                  <span className="text-text-primary">Profile</span>
                </Link>
              </DropdownMenu.Item>

              {/* Divider */}
              <div className="border-t border-border-primary my-2"></div>

              {/* Sign Out */}
              <DropdownMenu.Item asChild>
                <button
                  onClick={() => {
                    handleSignOut();
                    setOpen(false);
                  }}
                  className="flex items-center space-x-3 w-full p-3 hover:bg-bg-tertiary rounded-lg transition-colors text-left"
                >
                  <LogOut className="w-5 h-5 text-text-secondary" />
                  <span className="text-text-primary">Sign Out</span>
                </button>
              </DropdownMenu.Item>
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
