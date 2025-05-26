"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export function useLoginModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [action, setAction] = useState<string>("");
  const { data: session } = useSession();

  const requireAuth = (actionDescription: string, callback?: () => void) => {
    if (!session) {
      setAction(actionDescription);
      setIsOpen(true);
      return false;
    }

    // User is authenticated, execute the callback
    if (callback) {
      callback();
    }
    return true;
  };

  const closeModal = () => {
    setIsOpen(false);
    setAction("");
  };

  return {
    isOpen,
    action,
    requireAuth,
    closeModal,
    isAuthenticated: !!session,
  };
}
