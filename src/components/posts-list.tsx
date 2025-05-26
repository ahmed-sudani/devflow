import { PostWithUser } from "@/lib/fetchers/post";
import { Post } from "./post";

interface PostsListProps {
  posts: PostWithUser[];
}

export function PostsList({ posts }: PostsListProps) {
  if (posts.length === 0) {
    return (
      <div className="bg-bg-secondary rounded-lg border border-border-primary p-8 text-center shadow-md">
        <p className="text-text-secondary text-lg mb-2">No posts to show</p>
        <p className="text-text-secondary text-sm">
          Try following some users or switch to recent posts
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  );
}
