"use client";

import { Bell, Home, LogOut, Mail, Menu, User, X } from "lucide-react";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface MobileMenuProps {
  session: Session;
}

export function MobileMenu({ session }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  const overlay = (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={closeMenu}
      />
      {/* Drawer */}
      <div
        className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-64 bg-bg-secondary
                    border-l border-border-primary transform transition-transform
                    duration-300 ease-in-out z-50 md:hidden
                    ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div
          className={`fixed right-0 h-[calc(100vh-4rem)] w-64 bg-bg-secondary border-l border-border-primary transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full">
            {/* User Info */}
            <div className="p-4 border-b border-border-secondary">
              <div className="flex items-center space-x-3">
                <Image
                  src={session.user?.image || ""}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {session.user?.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 py-4">
              <div className="px-4 space-y-2">
                <Link
                  href="/"
                  onClick={closeMenu}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-bg-tertiary transition-colors text-text-primary"
                >
                  <Home className="w-5 h-5 text-primary" />
                  <span>Home</span>
                </Link>

                <Link
                  href={`/profile/${session.user?.id}`}
                  onClick={closeMenu}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-bg-tertiary transition-colors text-text-primary"
                >
                  <User className="w-5 h-5 text-text-secondary" />
                  <span>Profile</span>
                </Link>

                <button
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-bg-tertiary transition-colors text-text-primary"
                  onClick={() => {
                    // Handle notifications
                    closeMenu();
                  }}
                >
                  <Bell className="w-5 h-5 text-text-secondary" />
                  <span>Notifications</span>
                </button>

                <button
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-bg-tertiary transition-colors text-text-primary"
                  onClick={() => {
                    // Handle messages
                    closeMenu();
                  }}
                >
                  <Mail className="w-5 h-5 text-text-secondary" />
                  <span>Messages</span>
                </button>
              </div>
            </nav>

            {/* Sign Out */}
            <div className="p-4 border-t border-border-secondary">
              <button
                onClick={() => {
                  signOut();
                  closeMenu();
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-red-500"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={toggleMenu}
        className="md:hidden p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-text-secondary" />
        ) : (
          <Menu className="w-5 h-5 text-text-secondary" />
        )}
      </button>

      {/* Mount portal only when DOM is ready */}
      {mounted &&
        isOpen &&
        createPortal(overlay, document.getElementById("menu-root")!)}
    </>
  );
}
