"use client";

import { signIn } from "next-auth/react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Github, Lock, Users, Heart } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  action?: string; // Description of what action triggered the modal
}

export function LoginModal({ isOpen, onClose, action }: LoginModalProps) {
  const handleSignIn = async () => {
    try {
      await signIn("github", { callbackUrl: window.location.href });
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-md transform -translate-x-1/2 -translate-y-1/2 rounded-lg bg-bg-primary shadow-xl border border-border-primary mx-4 focus:outline-none animate-in fade-in-0 zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border-primary">
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-primary" />
              <Dialog.Title className="text-lg font-semibold text-text-primary">
                Sign in Required
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                onClick={onClose}
                className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-md hover:bg-bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Github className="w-8 h-8 text-white" />
              </div>

              <p className="text-text-secondary mb-2">
                {action
                  ? `To ${action}, you need to sign in first.`
                  : "Please sign in to continue."}
              </p>

              <p className="text-sm text-text-tertiary">
                Join the developer community and unlock all features
              </p>
            </div>

            {/* Features */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center space-x-3 text-sm text-text-secondary">
                <Users className="w-4 h-4 text-primary" />
                <span>Follow other developers</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-text-secondary">
                <Heart className="w-4 h-4 text-primary" />
                <span>Like and comment on posts</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-text-secondary">
                <Lock className="w-4 h-4 text-primary" />
                <span>Create and share your content</span>
              </div>
            </div>

            {/* Sign in button */}
            <button
              onClick={handleSignIn}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white px-4 py-3 rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-2"
            >
              <Github className="w-5 h-5" />
              <span>Continue with GitHub</span>
            </button>

            <p className="text-xs text-text-tertiary text-center mt-4">
              By signing in, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
