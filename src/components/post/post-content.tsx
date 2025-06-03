"use client";

import React from "react";
import CodePreview from "../code/code-preview";
import { PostWithUser } from "@/types";

type PostContentProps = { post: PostWithUser };

const PostContent: React.FC<PostContentProps> = ({ post }) => {
  return (
    <div className="px-4 pb-3">
      <p className="text-text-primary leading-relaxed mb-3">{post.content}</p>

      {/* Code Snippet */}
      {post.codeSnippet && (
        <CodePreview code={post.codeSnippet} language={post.codeLanguage} />
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-secondary/20 text-secondary rounded text-sm hover:bg-secondary/30 cursor-pointer transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostContent;
