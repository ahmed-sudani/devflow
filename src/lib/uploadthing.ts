import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/auth";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const ourFileRouter = {
  postImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      try {
        const session = await auth();
        if (!session?.user) throw new UploadThingError("Unauthorized");
        return { userId: session.user.id };
      } catch (error) {
        console.error("Middleware error:", error);
        throw new UploadThingError(
          "Middleware failed: " + (error as Error).message
        );
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        console.log("Upload complete for userId:", metadata.userId);
        console.log("file url", file.url);
        return { uploadedBy: metadata.userId };
      } catch (error) {
        console.error("UploadComplete error:", error);
        throw new UploadThingError(
          "UploadComplete failed: " + (error as Error).message
        );
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
