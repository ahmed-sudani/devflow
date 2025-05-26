ALTER TABLE "posts" ALTER COLUMN "likes_count" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "comments_count" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "followers_count" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "following_count" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;