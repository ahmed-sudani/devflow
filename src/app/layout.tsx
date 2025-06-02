import Header from "@/components/header"; // Adjust path if needed
import { ourFileRouter } from "@/lib/uploadthing";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import type { Metadata } from "next";
import { ToastContainer } from "react-toastify";
import { extractRouterConfig } from "uploadthing/server";
import "./globals.css";
import ToastContainerIcon from "@/components/toast-container";
import { ChatProvider } from "@/contexts/chat-context";
import SessionProvider from "@/providers/session-provider";
import { auth } from "@/auth";
import { ChatManager } from "@/components/chat/chat-manager";
import { NotificationProvider } from "@/contexts/notification-context";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
export const metadata: Metadata = {
  title: {
    default: "DevFlow — Connect, Share & Grow as a Developer",
    template: "%s | DevFlow",
  },
  description:
    "DevFlow is a social platform built for developers to share posts, discover trends, follow peers, and collaborate through conversations and code.",
  keywords: [
    "DevFlow",
    "Developer Community",
    "Social Platform for Developers",
    "Code Sharing",
    "Tech Network",
    "Developer Tools",
    "Build In Public",
  ],
  authors: [{ name: "Ahmed", url: baseUrl }],
  creator: "Ahmed",
  metadataBase: new URL(baseUrl),
  openGraph: {
    title: "DevFlow — Connect, Share & Grow as a Developer",
    description:
      "Join DevFlow, the social platform made for developers. Post code, follow peers, and explore trending dev content.",
    url: baseUrl,
    siteName: "DevFlow",
    images: [
      {
        url: "/og.png", // Make sure to have this image in your public directory
        width: 1200,
        height: 630,
        alt: "DevFlow Open Graph Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevFlow — Connect, Share & Grow as a Developer",
    description:
      "Explore DevFlow, a social platform for developers to share knowledge, code, and conversations.",
    site: "@devflow",
    creator: "@ahmed_codes_dev",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-900 text-gray-100">
        <SessionProvider session={session}>
          <ChatProvider>
            <NotificationProvider>
              <NextSSRPlugin
                routerConfig={extractRouterConfig(ourFileRouter)}
              />
              <Header />
              <main>{children}</main>
              <div id="menu-root" />
              <ToastContainer
                toastClassName="bg-bg-secondary rounded-lg border border-border-primary text-text-primary"
                autoClose={3000}
                hideProgressBar
                theme="dark"
                icon={ToastContainerIcon}
              />
            </NotificationProvider>

            <ChatManager />
          </ChatProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
