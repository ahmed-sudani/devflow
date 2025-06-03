"use client";

import { sharePost } from "@/lib/actions/post";
import { PostWithUser } from "@/types";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Facebook, Link as LinkIcon, Share2, Twitter } from "lucide-react";
import { useState, useTransition } from "react";

type PostShareProps = { post: PostWithUser };

const PostShare: React.FC<PostShareProps> = ({ post }) => {
  const startTransition = useTransition()[1];
  const [sharesCount, setSharesCount] = useState(post.sharesCount);

  const handleShare = async (shareType: "copy" | "twitter" | "facebook") => {
    const postUrl = `${window.location.origin}/posts/${post.id}`;

    if (shareType === "copy") {
      try {
        await navigator.clipboard.writeText(postUrl);
        console.log("Link copied to clipboard");
      } catch (error) {
        console.error("Failed to copy link:", error);
      }
    } else if (shareType === "twitter") {
      const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        postUrl
      )}&text=${encodeURIComponent(
        `Check out this post by ${post.user.name}: ${post.content.substring(
          0,
          100
        )}...`
      )}`;
      window.open(twitterUrl, "_blank");
    } else if (shareType === "facebook") {
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        postUrl
      )}`;
      window.open(facebookUrl, "_blank");
    }

    const newSharesCount = sharesCount + 1;
    setSharesCount(newSharesCount);

    startTransition(async () => {
      const result = await sharePost(post.id);
      if (!result.success) {
        setSharesCount(sharesCount);
      }
    });
  };
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center space-x-2 text-text-secondary hover:text-status-success transition-colors group">
          <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">{sharesCount}</span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        side="top"
        align="start"
        sideOffset={8}
        className="bg-bg-secondary border border-border-primary rounded-lg shadow-lg py-2 min-w-[200px] z-50"
      >
        <DropdownMenu.Item
          onSelect={() => handleShare("copy")}
          className="w-full px-4 py-2 text-sm text-text-primary hover:bg-bg-tertiary 
             transition-colors flex items-center space-x-2 cursor-pointer 
             focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
        >
          <LinkIcon className="w-4 h-4" />
          <span>Copy Link</span>
        </DropdownMenu.Item>

        <DropdownMenu.Item
          onSelect={() => handleShare("twitter")}
          className="w-full px-4 py-2 text-sm text-text-primary hover:bg-bg-tertiary 
             transition-colors flex items-center space-x-2 cursor-pointer 
             focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
        >
          <Twitter className="w-4 h-4" />
          <span>Share on Twitter</span>
        </DropdownMenu.Item>

        <DropdownMenu.Item
          onSelect={() => handleShare("facebook")}
          className="w-full px-4 py-2 text-sm text-text-primary hover:bg-bg-tertiary 
             transition-colors flex items-center space-x-2 cursor-pointer 
             focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
        >
          <Facebook className="w-4 h-4" />
          <span>Share on Facebook</span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default PostShare;
