import { auth } from "@/auth";
import ProfileClient from "@/components/profile-client";
import { getUserPosts } from "@/lib/fetchers/post";
import { getUserProfile } from "@/lib/fetchers/user"; // Need to create these
import SessionProvider from "@/providers/session-provider";

interface ProfilePageProps {
  params: {
    userId: string;
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await auth();
  const currentUser = session?.user;

  const [profileUser, userPosts] = await Promise.all([
    getUserProfile(params.userId),
    getUserPosts(params.userId),
  ]);

  return (
    <SessionProvider session={session}>
      <ProfileClient
        profileUser={profileUser}
        userPosts={userPosts}
        isOwnProfile={currentUser?.id === params.userId}
      />
    </SessionProvider>
  );
}
