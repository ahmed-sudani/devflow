import NextAuth, { NextAuthConfig } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { accounts, sessions, users, userSettings } from "./db/schema";
import { ensureFirebaseUser } from "./lib/firebase/admin";
import { User } from "./types";

export const authOptions: NextAuthConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
  }),
  providers: [
    GithubProvider({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          username: profile.login,
        };
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/auth/signin",
  },
  events: {
    createUser: async ({ user }) => {
      if (!user.id) {
        console.error("User ID is missing, cannot create default settings");
        return;
      }

      // Create default user settings when a new user is created
      try {
        await db.insert(userSettings).values({
          userId: user.id!,
          // All other fields will use their default values from the schema
        });
        console.log(`Default settings created for user: ${user.id}`);

        await ensureFirebaseUser({
          uid: user.id,
          email: user.email,
          displayName: user.name,
          photoURL: user.image,
        });

        console.log(
          `Default settings and Firebase user created for: ${user.id}`
        );
      } catch (error) {
        console.error(
          "Error creating default user settings or Firebase user:",
          error
        );
      }
    },
    signIn: async ({ user }) => {
      // Sync user data with Firebase on each sign in
      if (user.id) {
        try {
          await ensureFirebaseUser({
            uid: user.id,
            email: user.email,
            displayName: user.name,
            photoURL: user.image,
          });
        } catch (error) {
          console.error("Error syncing user with Firebase:", error);
        }
      }
    },
  },
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user && user?.id) {
        session.user.id = user.id;
        // Add any additional user data to session if needed
        session.user.username = (user as unknown as User).username;
      }
      return session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);
