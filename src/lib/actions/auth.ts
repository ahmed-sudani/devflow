"use server";
import { createCustomToken, ensureFirebaseUser } from "@/lib/firebase/admin";
import { auth } from "@/auth";

export async function getFirebaseToken() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  try {
    // Ensure Firebase user exists and is synced
    await ensureFirebaseUser({
      uid: session.user.id,
      email: session.user.email,
      displayName: session.user.name,
      photoURL: session.user.image,
    });

    // Create custom token with additional claims if needed
    const customToken = await createCustomToken(session.user.id, {
      // Add any custom claims here
      provider: "nextauth",
      username: session.user.username,
    });

    return customToken;
  } catch (error) {
    console.error("Error creating Firebase token:", error);
    throw error;
  }
}
