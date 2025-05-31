"use client";

import { deletePost } from "@/lib/actions/post";
import { Post } from "@/types";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Edit, MoreHorizontal, Trash } from "lucide-react";
import { toast } from "react-toastify";
import PostModal from "./post-modal";

type PostOptionsProps = {
  post: Post;
};

const PostOptions: React.FC<PostOptionsProps> = ({ post }) => {
  const handlePostDelete = async () => {
    const result = await deletePost(post.id);
    if (result.success) {
      toast.success("Post removed successfully");
    } else {
      toast.error(result.error || "Action failed");
    }
  };

  return (
    <AlertDialog.Root>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <MoreHorizontal className="w-5 h-5 text-text-secondary cursor-pointer hover:text-text-tertiary" />
        </DropdownMenu.Trigger>

        <DropdownMenu.Content className="bg-bg-secondary border border-border-primary rounded-lg shadow-lg py-2 min-w-[200px] z-50">
          <PostModal
            post={post}
            trigger={
              <div
                className="w-full px-4 py-2 text-sm text-text-primary hover:bg-bg-tertiary 
             transition-colors flex items-center space-x-2 cursor-pointer 
             focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Post</span>
              </div>
            }
          />

          <DropdownMenu.Separator />

          <AlertDialog.Trigger asChild>
            <DropdownMenu.Item
              className="w-full px-4 py-2 text-sm text-text-primary hover:bg-bg-tertiary 
             transition-colors flex items-center space-x-2 cursor-pointer 
             focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
            >
              <Trash className="w-4 h-4" />
              <span>Remove Post</span>
            </DropdownMenu.Item>
          </AlertDialog.Trigger>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform bg-bg-secondary rounded-lg shadow-lg p-6 space-y-4 z-50 border border-border-primary focus:outline-none">
          <AlertDialog.Title className="text-lg font-semibold">
            Are you sure?
          </AlertDialog.Title>
          <AlertDialog.Description className="text-sm">
            This will permanently delete the post and it cannot be undone.
          </AlertDialog.Description>

          <div className="flex justify-end gap-3 mt-4">
            <AlertDialog.Cancel asChild>
              <button className="px-4 py-2 rounded-md">Cancel</button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={handlePostDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Yes, delete
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

export default PostOptions;
