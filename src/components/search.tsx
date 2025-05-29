"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, User, FileText, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPosts, searchUsers } from "@/lib/actions/post";
import { PostWithUser, User as TypeUser } from "@/types";

interface SearchResult {
  users: TypeUser[];
  posts: PostWithUser[];
}

export default function SearchComponent() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult>({
    users: [],
    posts: [],
  });
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<
    "all" | "users" | "posts" | "tags"
  >("all");
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = useCallback(
    async (searchQuery: string = query) => {
      if (!searchQuery || searchQuery.trim().length < 2) return;

      setLoading(true);
      try {
        const searchResults: SearchResult = { users: [], posts: [] };

        if (searchType === "all" || searchType === "users") {
          const userResults = await searchUsers(searchQuery);
          if (userResults.success) {
            searchResults.users = userResults.data;
          }
        }

        if (searchType === "all" || searchType === "posts") {
          const postResults = await getPosts({ searchTerm: searchQuery });
          searchResults.posts = postResults;
        }

        if (searchType === "tags") {
          const postResults = await getPosts({ tags: [searchQuery] });
          searchResults.posts = postResults;
        }

        setResults(searchResults);
        setIsOpen(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    },
    [query, searchType]
  );

  // Get suggestions as user types
  useEffect(() => {
    const getSuggestions = async () => {
      if (query.length >= 2) {
        await handleSearch(query);
      }
    };
    const debounceTimer = setTimeout(getSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [handleSearch, query, searchType]);

  // Perform search

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults({ users: [], posts: [] });
    setIsOpen(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          onFocus={() => setIsOpen(true)}
          placeholder="Search users, posts, or tags..."
          className="w-full pl-10 pr-12 py-2 bg-bg-tertiary border border-border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-text-primary placeholder-text-secondary"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-bg-secondary border border-border-primary rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          <div className="flex gap-2 m-2">
            {(["all", "users", "posts", "tags"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSearchType(type)}
                className={`px-3 py-1 text-sm rounded-full transition-colors capitalize ${
                  searchType === type
                    ? "bg-primary text-white"
                    : "bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-quaternary"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="p-4 text-center text-text-secondary">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2">Searching...</p>
            </div>
          ) : (
            <>
              {/* Show suggestions when query is short */}
              {query.length > 0 && query.length < 2 && (
                <div className="p-4">
                  <p className="text-text-secondary text-sm mb-3">
                    Type at least 2 characters to search
                  </p>
                </div>
              )}

              {/* Show search results */}
              {query.length >= 2 && (
                <div className="p-4 space-y-4">
                  {/* Users Results */}
                  {results.users.length > 0 && (
                    <div>
                      <h4 className="text-text-primary font-medium mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Users ({results.users.length})
                      </h4>
                      {results.users.map((user) => (
                        <Link
                          key={user.id}
                          href={`/profile/${user.id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 p-3 hover:bg-bg-tertiary rounded-lg transition-colors"
                        >
                          <Image
                            src={user.image || "/default-avatar.png"}
                            alt={user.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-text-primary font-medium">
                                {user.name}
                              </p>
                              {user.badge && (
                                <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs">
                                  {user.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-text-secondary text-sm">
                              @{user.username}
                            </p>
                            <p className="text-text-tertiary text-xs">
                              {user.followersCount} followers
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Posts Results */}
                  {results.posts.length > 0 && (
                    <div>
                      <h4 className="text-text-primary font-medium mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Posts ({results.posts.length})
                      </h4>
                      {results.posts.map((post) => (
                        <div
                          key={post.id}
                          className="p-3 hover:bg-bg-tertiary rounded-lg transition-colors cursor-pointer"
                          onClick={() => {
                            router.push(`/post/${post.id}`);
                            setIsOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Image
                              src={post.user.image || "/default-avatar.png"}
                              alt={post.user.name}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="text-text-primary font-medium text-sm">
                              {post.user.name}
                            </span>
                            <span className="text-text-secondary text-sm">
                              @{post.user.username}
                            </span>
                            <span className="text-text-tertiary text-xs">
                              {formatDate(post.createdAt)}
                            </span>
                          </div>

                          <p className="text-text-primary text-sm mb-2 line-clamp-2">
                            {post.content}
                          </p>

                          {post.codeSnippet && (
                            <div className="bg-bg-quaternary p-2 rounded text-xs font-mono text-text-secondary mb-2 overflow-hidden h-10 line-clamp-2">
                              {post.codeSnippet}
                            </div>
                          )}

                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {post.tags
                                .slice(0, 3)
                                .map((tag: string, index: number) => (
                                  <span
                                    key={index}
                                    className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              {post.tags.length > 3 && (
                                <span className="text-text-tertiary text-xs">
                                  +{post.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-text-tertiary text-xs">
                            <span>{post.likesCount} likes</span>
                            <span>{post.commentsCount} comments</span>
                            <span>{post.sharesCount} shares</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No Results */}
                  {query.length >= 2 &&
                    results.users.length === 0 &&
                    results.posts.length === 0 &&
                    !loading && (
                      <div className="text-center py-8">
                        <Search className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                        <p className="text-text-secondary">
                          No results found for &quot;{query}&quot;
                        </p>
                        <p className="text-text-tertiary text-sm mt-1">
                          Try different keywords or check your spelling
                        </p>
                      </div>
                    )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
