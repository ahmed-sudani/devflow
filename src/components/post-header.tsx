import Image from "next/image";
import Link from "next/link";
import React, { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { PostWithUser } from "@/types";
import PostOptions from "./post-options";
import { useSession } from "next-auth/react";

type PostHeaderProps = { post: PostWithUser };

const PostHeader: React.FC<PostHeaderProps> = ({ post }) => {
  const { data: session } = useSession();

  const timeAgo = useMemo(
    () =>
      post.createdAt
        ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
        : "",
    [post]
  );

  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-center space-x-md">
        <Link href={`/profile/${post.user.id}`}>
          <Image
            src={post.user.image || "/default-avatar.png"}
            alt={post.user.name || "User"}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover"
          />
        </Link>

        <div>
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-text-primary">
              {post.user.name}
            </h4>
            {post.user.badge && (
              <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs">
                {post.user.badge}
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary">
            {post.user.username} • {timeAgo}
          </p>
        </div>
      </div>
      {session?.user?.id == post.user.id && <PostOptions post={post} />}
    </div>
  );
};

export default PostHeader;
