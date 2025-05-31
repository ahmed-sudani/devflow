import { auth } from "@/auth";
import SocialMediaHome from "@/components/social-media-home";
import { getPosts, getTrendingTagsWithTimeframe } from "@/lib/actions/post";
import { getCurrentUser, getSuggestedUsers } from "@/lib/actions/user";
import SessionProvider from "@/providers/session-provider";

export default async function HomePage() {
  const [session, currentUser, postRes, trendingTags, suggestedUsers] =
    await Promise.all([
      auth(),
      getCurrentUser(),
      getPosts({ sortBy: "recent" }),
      getTrendingTagsWithTimeframe("day", 3),
      getSuggestedUsers(),
    ]);

  return (
    <SessionProvider session={session}>
      <SocialMediaHome
        currentUser={currentUser}
        initialPosts={postRes}
        initialTrendingTags={trendingTags}
        initialSuggestedUsers={suggestedUsers}
      />
    </SessionProvider>
  );
}
