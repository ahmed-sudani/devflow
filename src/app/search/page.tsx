import { auth } from "@/auth";
import { PostsList } from "@/components/posts-list";
import { getPosts } from "@/lib/actions/post";
import { searchUsers } from "@/lib/actions/user";
import SessionProvider from "@/providers/session-provider";
import { PostWithUser, User as UserType } from "@/types";
import { FileText, Hash, Search, User } from "lucide-react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Search | DevFlow",
};

interface SearchFilters {
  type: "all" | "users" | "posts" | "tags";
  sortBy: "relevance" | "recent" | "popular";
  dateRange: "all" | "day" | "week" | "month" | "year";
}

type SearchResult = { users: UserType[]; posts: PostWithUser[] };

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    sortBy?: string;
    dateRange?: string;
  }>;
}) {
  const session = await auth();
  const { q, type, sortBy, dateRange } = await searchParams;

  const query = q || "";
  const filters: SearchFilters = {
    type: (type as SearchFilters["type"]) || "all",
    sortBy: (sortBy as SearchFilters["sortBy"]) || "relevance",
    dateRange: (dateRange as SearchFilters["dateRange"]) || "all",
  };

  const results: SearchResult = { users: [], posts: [] };
  let totalResults = 0;

  if (query.trim().length >= 2) {
    if (filters.type === "all" || filters.type === "users") {
      const userResults = await searchUsers(query, 20);
      if (userResults.success) {
        results.users = userResults.data;
        totalResults += userResults.data.length;
      }
    }

    if (filters.type === "all" || filters.type === "posts") {
      results.posts = await getPosts({
        searchTerm: query,
        limit: 20,
        sortBy: filters.sortBy,
        dateRange: filters.dateRange,
      });
      totalResults += results.posts.length;
    }

    if (filters.type === "tags") {
      results.posts = await getPosts({
        tags: [query],
        limit: 20,
        sortBy: filters.sortBy,
        dateRange: filters.dateRange,
      });
      totalResults = results.posts.length;
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-4">
            Search DevFlow
          </h1>

          {/* Search Form */}
          <form method="GET" className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search for users, posts, or tags..."
                className="w-full pl-12 pr-4 py-4 bg-bg-secondary border border-border-secondary rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-text-primary placeholder-text-secondary"
                autoFocus
                minLength={2}
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col">
                <label
                  htmlFor="type"
                  className="text-text-secondary mb-1 font-semibold"
                >
                  Type
                </label>
                <select
                  id="type"
                  name="type"
                  defaultValue={filters.type}
                  className="rounded-md border border-border-secondary bg-bg-secondary px-3 py-2 text-text-primary"
                >
                  <option value="all">All</option>
                  <option value="users">Users</option>
                  <option value="posts">Posts</option>
                  <option value="tags">Tags</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="sortBy"
                  className="text-text-secondary mb-1 font-semibold"
                >
                  Sort by
                </label>
                <select
                  id="sortBy"
                  name="sortBy"
                  defaultValue={filters.sortBy}
                  className="rounded-md border border-border-secondary bg-bg-secondary px-3 py-2 text-text-primary"
                >
                  <option value="relevance">Relevance</option>
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="dateRange"
                  className="text-text-secondary mb-1 font-semibold"
                >
                  Date Range
                </label>
                <select
                  id="dateRange"
                  name="dateRange"
                  defaultValue={filters.dateRange}
                  className="rounded-md border border-border-secondary bg-bg-secondary px-3 py-2 text-text-primary"
                >
                  <option value="all">All Time</option>
                  <option value="day">Past 24 Hours</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                  <option value="year">Past Year</option>
                </select>
              </div>

              {/* Submit button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition"
                >
                  Search
                </button>
              </div>
            </div>
          </form>

          <div className="text-text-secondary">
            {totalResults > 0 && (
              <span>
                {totalResults} results found for &quot;{query}&quot;
              </span>
            )}
          </div>
        </div>

        {/* Search Results */}
        {query.trim().length < 2 && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-text-secondary mx-auto mb-6" />
            <h3 className="text-xl font-medium text-text-primary mb-2">
              Search DevFlow
            </h3>
            <p className="text-text-secondary mb-6">
              Find users, posts, and discussions across the developer community
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
              <div className="p-4 bg-bg-secondary border border-border-secondary rounded-lg">
                <User className="w-8 h-8 text-primary mb-3" />
                <h4 className="font-medium text-text-primary mb-2">
                  Find Users
                </h4>
                <p className="text-text-secondary text-sm">
                  Discover developers, follow their work, and connect with the
                  community
                </p>
              </div>
              <div className="p-4 bg-bg-secondary border border-border-secondary rounded-lg">
                <FileText className="w-8 h-8 text-primary mb-3" />
                <h4 className="font-medium text-text-primary mb-2">
                  Search Posts
                </h4>
                <p className="text-text-secondary text-sm">
                  Find code snippets, discussions, and solutions to coding
                  problems
                </p>
              </div>
              <div className="p-4 bg-bg-secondary border border-border-secondary rounded-lg">
                <Hash className="w-8 h-8 text-primary mb-3" />
                <h4 className="font-medium text-text-primary mb-2">
                  Explore Tags
                </h4>
                <p className="text-text-secondary text-sm">
                  Browse topics, technologies, and trending discussions by tags
                </p>
              </div>
            </div>
          </div>
        )}

        {query.trim().length >= 2 && totalResults === 0 && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-text-secondary mx-auto mb-6" />
            <h3 className="text-xl font-medium text-text-primary mb-2">
              No results found
            </h3>
            <p className="text-text-secondary mb-6">
              We couldn&apos;t find anything matching &quot;{query}&quot;
            </p>
            <div className="text-text-tertiary text-sm space-y-1">
              <p>Try:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Different keywords or phrases</li>
                <li>More general terms</li>
                <li>Checking your spelling</li>
                <li>Using fewer filters</li>
              </ul>
            </div>
          </div>
        )}

        {/* Users Results */}
        {results.users.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Users ({results.users.length})
            </h2>
            <div className="grid gap-4">
              {results.users.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-4 p-4 bg-bg-secondary border border-border-secondary rounded-lg hover:bg-bg-tertiary transition-colors"
                >
                  <Image
                    src={user.image || "/default-avatar.png"}
                    alt={user.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-text-primary font-medium">
                        {user.name}
                      </h3>
                      {user.badge && (
                        <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs font-medium">
                          {user.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-text-secondary">@{user.username}</p>
                    <div className="flex items-center gap-4 mt-2 text-text-tertiary text-sm">
                      <span>{user.followersCount} followers</span>
                      <span>{user.followingCount} following</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Posts Results */}
        {results.posts && results.posts.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Posts ({results.posts.length})
            </h2>

            <div className="grid gap-6">
              <SessionProvider session={session}>
                <PostsList posts={results.posts} />
              </SessionProvider>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
