import { Terminal, Home, Bell, Mail, Search } from "lucide-react";
import SignIn from "./signin";
import Image from "next/image";
import NewPostModal from "./new-post-modal";
import { auth } from "@/auth";
import Link from "next/link";
import { MobileMenu } from "./mobile-menu";

export default async function Header() {
  const session = await auth();

  return (
    <header className="fixed top-0 left-0 right-0 bg-bg-secondary/95 backdrop-blur-sm border-b border-border-primary z-30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Always visible */}
          <Link href="/">
            <div className="flex items-center space-x-2">
              <Terminal className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                DevFlow
              </h1>
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden lg:block flex-1 max-w-md mx-8">
            <Link href="/search" className="relative block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
              <div className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-border-secondary rounded-lg transition-all text-text-secondary text-sm cursor-pointer hover:border-primary/50">
                Search users, posts, or tags...
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {session?.user ? (
            <div className="flex items-center space-x-3 sm:space-x-6">
              {/* Desktop Navigation Icons */}
              <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
                <Link href="/" className="hover:text-primary transition-colors">
                  <Home className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                </Link>
                <button className="hover:text-primary transition-colors">
                  <Bell className="w-5 h-5 lg:w-6 lg:h-6 text-text-secondary hover:text-primary transition-colors cursor-pointer" />
                </button>
                <button className="hover:text-primary transition-colors">
                  <Mail className="w-5 h-5 lg:w-6 lg:h-6 text-text-secondary hover:text-primary transition-colors cursor-pointer" />
                </button>
              </nav>

              {/* Search Icon for Mobile/Tablet */}
              <Link
                href="/search"
                className="lg:hidden hover:text-primary transition-colors"
              >
                <Search className="w-5 h-5 text-text-secondary hover:text-primary" />
              </Link>

              {/* New Post + Profile */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <NewPostModal />
                <Link href={`/profile/${session.user.id}`}>
                  <Image
                    src={session.user.image || ""}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  />
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <MobileMenu session={session} />
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              {/* Search Icon for Mobile when not logged in */}
              <Link
                href="/search"
                className="lg:hidden hover:text-primary transition-colors"
              >
                <Search className="w-5 h-5 text-text-secondary hover:text-primary" />
              </Link>
              <SignIn />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
