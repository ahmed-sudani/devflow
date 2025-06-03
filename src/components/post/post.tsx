"use client";

import { PostWithUser } from "@/types";
import Image from "next/image";
import PostActions from "./post-actions";
import PostContent from "./post-content";
import PostHeader from "./post-header";

interface PostProps {
  post: PostWithUser;
}

export function Post({ post }: PostProps) {
  return (
    <div className="bg-bg-secondary rounded-lg border border-border-primary overflow-hidden shadow-md">
      {/* Post Header */}
      <PostHeader post={post} />

      {/* Post Content */}
      <PostContent post={post} />

      {/* Post Image */}
      {post.image && (
        <div className="relative">
          <Image
            src={post.image}
            alt="Post content"
            width={600}
            height={320}
            className="w-full h-80 object-cover"
          />
        </div>
      )}

      {/* Post Actions */}
      <PostActions post={post} />
    </div>
  );
}
