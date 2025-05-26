import SocialMediaHome from "@/components/social-media-home";
import { getPosts, getSuggestedUsers } from "@/lib/fetchers/post";
import { auth } from "@/auth";
import SessionProvider from "@/providers/session-provider";
import { getCurrentUser } from "@/lib/fetchers/user";

export default async function HomePage() {
  const [posts, suggestedUsers, currentUser, session] = await Promise.all([
    getPosts("recent"),
    getSuggestedUsers(),
    getCurrentUser(),
    auth(),
  ]);

  return (
    <SessionProvider session={session}>
      <SocialMediaHome
        initialPosts={posts}
        initialSuggestedUsers={suggestedUsers}
        currentUser={currentUser}
      />
    </SessionProvider>
  );
}
