import { auth } from "@/auth";
import { Post } from "@/components/post";
import { getPostById } from "@/lib/fetchers/post";
import SessionProvider from "@/providers/session-provider";
import { notFound } from "next/navigation";

interface PostPageProps {
  params: Promise<{ postId: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { postId } = await params;

  const [post, session] = await Promise.all([
    getPostById(Number(postId)),
    auth(),
  ]);

  if (!post) {
    return notFound();
  }

  return (
    <div className="pt-24 max-w-6xl mx-auto px-4">
      <SessionProvider session={session}>
        <Post post={post} />
      </SessionProvider>
    </div>
  );
}
