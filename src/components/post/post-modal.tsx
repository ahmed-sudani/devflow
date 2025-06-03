"use client";

import { createPost, CreatePostInput, updatePost } from "@/lib/actions/post";
import { UploadButton } from "@/lib/uploadthing-components";
import { Post } from "@/types";
import * as Dialog from "@radix-ui/react-dialog";
import { Code, Hash, Image as ImageIcon, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState, useTransition } from "react";
import CodeEditor from "../code/code-editor";

export default function PostModal({
  post,
  trigger,
}: {
  post?: Post;
  trigger: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<CreatePostInput>({
    content: post?.content || "",
    codeSnippet: post?.codeSnippet || "",
    codeLanguage: post?.codeLanguage || "javascript",
    image: post?.image || "",
    tags: post?.tags || [],
  });

  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.content.trim()) {
      setError("Please write something to share!");
      return;
    }

    startTransition(async () => {
      const result = post
        ? await updatePost({
            postId: post.id,
            ...formData,
            tags: formData.tags?.filter((tag) => tag.trim() !== ""),
          })
        : await createPost({
            ...formData,
            tags: formData.tags?.filter((tag) => tag.trim() !== ""),
          });

      if (result.success) {
        setFormData({
          content: "",
          codeSnippet: "",
          codeLanguage: "javascript",
          image: "",
          tags: [],
        });
        setShowCodeEditor(false);
        setTagInput("");
        document.getElementById("close-dialog-btn")?.click();
      } else {
        setError(result.error || "Failed to create post");
      }
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      addTag();
    }
  };

  const handleCodeChange = useCallback((code: string, language: string) => {
    setFormData((prev) => ({
      ...prev,
      codeSnippet: code,
      codeLanguage: language,
    }));
  }, []);

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        {/* <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105 flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Post
        </button> */}
        {trigger}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg sm:max-w-4xl max-h-[90vh] overflow-y-auto transform -translate-x-1/2 -translate-y-1/2 rounded-lg bg-bg-secondary p-4 sm:p-6 border border-border-primary focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border-primary">
            <Dialog.Title className="text-lg sm:text-xl font-semibold text-text-primary">
              Create New Post
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-md hover:bg-bg-tertiary">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-6">
            <div>
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="What's on your mind? Share your dev journey..."
                className="w-full p-3 sm:p-4 bg-bg-tertiary border border-border-secondary rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary placeholder-text-secondary min-h-[120px] text-sm sm:text-base"
                maxLength={2000}
              />
              <div className="flex justify-between mt-2 text-xs text-text-secondary">
                <span>{formData.content.length}/2000 characters</span>
              </div>
            </div>

            {showCodeEditor && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Code Snippet (Optional)
                </label>
                <CodeEditor
                  value={post?.codeSnippet}
                  language={post?.codeLanguage}
                  onChange={handleCodeChange}
                />
                {formData.codeSnippet && (
                  <div className="mt-2 text-xs text-text-secondary">
                    Language: {formData.codeLanguage} • Characters:{" "}
                    {formData.codeSnippet.length}
                  </div>
                )}
              </div>
            )}

            {formData.image && (
              <div className="relative">
                <Image
                  src={formData.image}
                  alt="Upload preview"
                  width={600}
                  height={300}
                  className="w-full h-60 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, image: "" }))
                  }
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Tags (Optional)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-primary-dark"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a tag..."
                  className="flex-1 p-2 bg-bg-tertiary border border-border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary placeholder-text-secondary"
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-status-error/10 border border-status-error/20 text-status-error p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border-primary">
              <div className="flex flex-wrap gap-2">
                {!formData.image && (
                  <UploadButton
                    endpoint="postImage"
                    onClientUploadComplete={(res: { url: string }[]) => {
                      if (res?.[0]?.url) {
                        setFormData((prev) => ({
                          ...prev,
                          image: res[0].url,
                        }));
                      }
                    }}
                    onUploadError={(error: Error) => {
                      setError(`Upload failed: ${error.message}`);
                    }}
                    appearance={{
                      button:
                        "bg-transparent border border-border-secondary text-text-secondary hover:text-text-primary hover:border-primary transition-colors px-3 py-2 rounded-lg text-sm flex items-center gap-2",
                      allowedContent: "hidden",
                    }}
                    content={{
                      button: (
                        <>
                          <ImageIcon className="w-4 h-4" />
                          Photo
                        </>
                      ),
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setShowCodeEditor(!showCodeEditor)}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
                    showCodeEditor
                      ? "border-primary text-primary bg-primary/5"
                      : "border-border-secondary text-text-secondary hover:text-text-primary hover:border-primary"
                  }`}
                >
                  <Code className="w-4 h-4" />
                  Code
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 border border-border-secondary text-text-secondary hover:text-text-primary hover:border-primary rounded-lg text-sm"
                >
                  <Hash className="w-4 h-4" />
                  Tags
                </button>
              </div>

              <div className="flex items-center gap-3 justify-end">
                <Dialog.Close asChild>
                  <button
                    id="close-dialog-btn"
                    className="px-4 py-2 text-text-secondary hover:text-text-primary transition"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={isPending || !formData.content.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:shadow-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Posting...
                    </>
                  ) : post ? (
                    "Update Post"
                  ) : (
                    "Post"
                  )}
                </button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
