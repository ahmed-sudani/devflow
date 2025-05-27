import { eq } from "drizzle-orm";
import { users, posts, postComments, postLikes, followers } from "./schema";
import { db } from "@/lib/db";

// Sample data arrays
const sampleUsers = [
  {
    name: "Alex Johnson",
    username: "alexdev",
    email: "alex@example.com",
    badge: "🚀",
    image: "https://api.dicebear.com/7.x/micah/svg?seed=alexdev",
  },
  {
    name: "Sarah Chen",
    username: "sarahcodes",
    email: "sarah@example.com",
    badge: "💻",
    image: "https://api.dicebear.com/7.x/micah/svg?seed=sarahcodes",
  },
  {
    name: "Mike Rodriguez",
    username: "mikedev",
    email: "mike@example.com",
    badge: "⚡",
    image: "https://api.dicebear.com/7.x/micah/svg?seed=mikedev",
  },
  {
    name: "Emily Watson",
    username: "emilycodes",
    email: "emily@example.com",
    badge: "🎨",
    image: "https://api.dicebear.com/7.x/micah/svg?seed=emilycodes",
  },
  {
    name: "David Kim",
    username: "davidtech",
    email: "david@example.com",
    badge: "🔥",
    image: "https://api.dicebear.com/7.x/micah/svg?seed=davidtech",
  },
  {
    name: "Lisa Park",
    username: "lisabuilds",
    email: "lisa@example.com",
    badge: "🌟",
    image: "https://api.dicebear.com/7.x/micah/svg?seed=lisabuilds",
  },
  {
    name: "Tom Wilson",
    username: "tomcodes",
    email: "tom@example.com",
    badge: "🛠️",
    image: "https://api.dicebear.com/7.x/micah/svg?seed=tomcodes",
  },
  {
    name: "Jessica Lee",
    username: "jessdev",
    email: "jessica@example.com",
    badge: "💡",
    image: "https://api.dicebear.com/7.x/micah/svg?seed=jessdev",
  },
];

const samplePosts = [
  {
    content:
      "Just deployed my first full-stack app! 🎉 Built with Next.js, PostgreSQL, and Drizzle ORM. The learning curve was steep but totally worth it!",
    codeSnippet: `// Simple Next.js API route
export async function GET() {
  const users = await db.select().from(usersTable);
  return Response.json(users);
}`,
    tags: ["nextjs", "postgresql", "drizzle", "fullstack"],
  },
  {
    content:
      "Quick tip: Always use TypeScript strict mode in your projects. It catches so many bugs before they reach production! 🐛➡️✅",
    tags: ["typescript", "tips", "development"],
  },
  {
    content:
      "Working on a new React component library. Here's a sneak peek of the Button component with variants and sizes!",
    codeSnippet: `interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = ({ variant = 'primary', size = 'md', children, ...props }: ButtonProps) => {
  return <button className={\`btn btn-\${variant} btn-\${size}\`} {...props}>{children}</button>;
};`,
    tags: ["react", "components", "ui", "library"],
  },
  {
    content:
      "Database optimization tip: Use indexes wisely! They speed up reads but slow down writes. Profile your queries first! 📊",
    tags: ["database", "performance", "optimization"],
  },
  {
    content:
      "Just discovered the power of React Server Components. The mental model shift is real, but the performance benefits are incredible! 🚀",
    codeSnippet: `// Server Component - runs on server
async function UserProfile({ userId }: { userId: string }) {
  const user = await fetchUser(userId); // Direct DB call
  
  return (
    <div>
      <h1>{user.name}</h1>
      <ClientComponent user={user} />
    </div>
  );
}`,
    tags: ["react", "server-components", "performance"],
  },
  {
    content:
      "CSS Grid vs Flexbox: Use Grid for 2D layouts (rows AND columns), Flexbox for 1D layouts (either rows OR columns). Both are powerful! 💪",
    tags: ["css", "layout", "grid", "flexbox"],
  },
  {
    content:
      "Authentication doesn't have to be complicated! Next-Auth makes it so easy to add social login to your apps.",
    codeSnippet: `import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ]
})`,
    tags: ["auth", "nextauth", "security"],
  },
  {
    content:
      "Hot take: Writing tests isn't just about catching bugs - it's about designing better APIs and understanding your code better. 🧪",
    tags: ["testing", "development", "philosophy"],
  },
  {
    content:
      "Loving the new features in ES2024! Top-level await and the Temporal API are game changers for modern JavaScript development.",
    codeSnippet: `// Top-level await
const config = await import('./config.json', { assert: { type: 'json' } });

// Temporal API (when it arrives)
const now = Temporal.Now.plainDateTimeISO();
const tomorrow = now.add({ days: 1 });`,
    tags: ["javascript", "es2024", "temporal", "features"],
  },
  {
    content:
      "Docker tip: Use multi-stage builds to keep your production images lean! Here's how I reduced my Node.js image from 1GB to 200MB.",
    codeSnippet: `# Multi-stage Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`,
    tags: ["docker", "optimization", "devops"],
  },
];

const sampleComments = [
  "This is awesome! Thanks for sharing 🙌",
  "Great explanation, very helpful!",
  "I've been struggling with this, perfect timing!",
  "Nice code example, clean and readable 👍",
  "This saved me hours of debugging, thank you!",
  "Love the approach, definitely trying this out",
  "Could you elaborate on the performance benefits?",
  "This is exactly what I needed for my project!",
  "Brilliant solution! Why didn't I think of this?",
  "Thanks for the detailed explanation 🚀",
  "This pattern has been a game changer for me",
  "Super helpful, bookmarked for later!",
];

export async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Clear existing data (optional - be careful in production!)
    console.log("🧹 Clearing existing data...");
    await db.delete(postComments);
    await db.delete(postLikes);
    await db.delete(posts);
    await db.delete(followers);
    await db.delete(users);

    // Insert users
    console.log("👥 Creating users...");
    const insertedUsers = await db
      .insert(users)
      .values(sampleUsers)
      .returning();
    console.log(`✅ Created ${insertedUsers.length} users`);

    // Create follower relationships
    console.log("🤝 Creating follower relationships...");
    const followerPairs = [];
    for (let i = 0; i < insertedUsers.length; i++) {
      for (let j = 0; j < insertedUsers.length; j++) {
        if (i !== j && Math.random() > 0.5) {
          // 50% chance of following
          followerPairs.push({
            followerId: insertedUsers[i].id,
            followingId: insertedUsers[j].id,
          });
        }
      }
    }

    if (followerPairs.length > 0) {
      await db.insert(followers).values(followerPairs);
      console.log(`✅ Created ${followerPairs.length} follower relationships`);

      // Update follower counts
      for (const user of insertedUsers) {
        const followersCount = followerPairs.filter(
          (f) => f.followingId === user.id
        ).length;
        const followingCount = followerPairs.filter(
          (f) => f.followerId === user.id
        ).length;

        await db
          .update(users)
          .set({
            followersCount,
            followingCount,
          })
          .where(eq(users.id, user.id));
      }
      console.log("✅ Updated follower counts");
    }

    // Insert posts (without commentsCount initially)
    console.log("📝 Creating posts...");
    const postsToInsert = samplePosts.map((post) => ({
      ...post,
      userId:
        insertedUsers[Math.floor(Math.random() * insertedUsers.length)].id,
      likesCount: Math.floor(Math.random() * 50),
      commentsCount: 0, // Will be updated after comments are inserted
      sharesCount: Math.floor(Math.random() * 10),
    }));

    const insertedPosts = await db
      .insert(posts)
      .values(postsToInsert)
      .returning();
    console.log(`✅ Created ${insertedPosts.length} posts`);

    // Insert post likes
    console.log("❤️ Creating post likes...");
    const likesToInsert = [];
    for (const post of insertedPosts) {
      const likeCount = Math.floor(Math.random() * 8) + 1; // 1-8 likes per post
      const usersWhoLiked = new Set();

      for (
        let i = 0;
        i < likeCount && usersWhoLiked.size < insertedUsers.length;
        i++
      ) {
        let randomUser;
        do {
          randomUser =
            insertedUsers[Math.floor(Math.random() * insertedUsers.length)];
        } while (usersWhoLiked.has(randomUser.id));

        usersWhoLiked.add(randomUser.id);
        likesToInsert.push({
          userId: randomUser.id,
          postId: post.id,
        });
      }
    }

    if (likesToInsert.length > 0) {
      await db.insert(postLikes).values(likesToInsert);
      console.log(`✅ Created ${likesToInsert.length} post likes`);
    }

    // Insert post comments
    console.log("💬 Creating post comments...");
    const commentsToInsert = [];
    for (const post of insertedPosts) {
      const commentCount = Math.floor(Math.random() * 5) + 1; // 1-5 comments per post

      for (let i = 0; i < commentCount; i++) {
        commentsToInsert.push({
          userId:
            insertedUsers[Math.floor(Math.random() * insertedUsers.length)].id,
          postId: post.id,
          content:
            sampleComments[Math.floor(Math.random() * sampleComments.length)],
        });
      }
    }

    const repliesToInsert = [];
    if (commentsToInsert.length > 0) {
      const insertedComments = await db
        .insert(postComments)
        .values(commentsToInsert)
        .returning();
      console.log(`✅ Created ${insertedComments.length} post comments`);

      // Add some replies to comments
      const replyCount = Math.min(
        10,
        Math.floor(insertedComments.length * 0.3)
      ); // 30% of comments get replies

      for (let i = 0; i < replyCount; i++) {
        const parentComment =
          insertedComments[Math.floor(Math.random() * insertedComments.length)];
        repliesToInsert.push({
          userId:
            insertedUsers[Math.floor(Math.random() * insertedUsers.length)].id,
          postId: parentComment.postId,
          content:
            sampleComments[Math.floor(Math.random() * sampleComments.length)],
          parentId: parentComment.id,
        });
      }

      if (repliesToInsert.length > 0) {
        await db.insert(postComments).values(repliesToInsert);
        console.log(`✅ Created ${repliesToInsert.length} comment replies`);
      }
    }

    // Update posts with accurate comment counts
    console.log("🔄 Updating post comment counts...");
    const allComments = [...commentsToInsert, ...repliesToInsert];

    for (const post of insertedPosts) {
      const actualCommentCount = allComments.filter(
        (comment) => comment.postId === post.id
      ).length;

      await db
        .update(posts)
        .set({
          commentsCount: actualCommentCount,
        })
        .where(eq(posts.id, post.id));
    }
    console.log("✅ Updated post comment counts");

    console.log("🎉 Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`👥 Users: ${insertedUsers.length}`);
    console.log(`🤝 Follower relationships: ${followerPairs.length}`);
    console.log(`📝 Posts: ${insertedPosts.length}`);
    console.log(`❤️ Likes: ${likesToInsert.length}`);
    console.log(
      `💬 Comments: ${commentsToInsert.length + repliesToInsert.length}`
    );
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("✅ Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
}
