import { auth } from "@/auth";
import SettingsClient from "@/components/settings-client";
import { getCurrentUser, getUserSettings } from "@/lib/actions/user";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Settings | DevFlow",
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const [currentUser, userSettings] = await Promise.all([
    getCurrentUser(),
    getUserSettings(session.user.id!),
  ]);

  if (!currentUser) {
    redirect("/");
  }

  return (
    <SettingsClient userSettings={userSettings} currentUser={currentUser} />
  );
}
