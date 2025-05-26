import { Terminal, Search, Home, Bell, Mail } from "lucide-react";
import SignIn from "./signin";
import Image from "next/image";
import NewPostModal from "./new-post-modal";
import { auth } from "@/auth";
import Link from "next/link";

export default async function Header() {
  const session = await auth();

  return (
    <header className="fixed top-0 left-0 right-0 bg-bg-secondary/95 backdrop-blur-sm border-b border-border-primary z-30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <Terminal className="w-8 h-8 text-primary" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  DevFlow
                </h1>
              </div>
            </Link>

            <div className="hidden md:block relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
              <input
                type="text"
                placeholder="Search ..."
                className="pl-10 pr-4 py-2 bg-bg-tertiary border border-border-secondary rounded-lg w-96 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-text-primary placeholder-text-secondary"
              />
            </div>
          </div>

          {session?.user ? (
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex items-center space-x-6">
                <Home className="w-6 h-6 text-primary" />
                <Bell className="w-6 h-6 text-text-secondary hover:text-primary transition-colors cursor-pointer" />
                <Mail className="w-6 h-6 text-text-secondary hover:text-primary transition-colors cursor-pointer" />
              </nav>

              <div className="flex items-center space-x-3">
                <NewPostModal />
                <Link href={`/profile/${session.user.id}`}>
                  <Image
                    src={session.user.image || ""}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full cursor-pointer"
                  />
                </Link>
              </div>
            </div>
          ) : (
            <SignIn />
          )}
        </div>
      </div>
    </header>
  );
}
