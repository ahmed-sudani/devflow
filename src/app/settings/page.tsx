import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SettingsClient from "@/components/settings-client";
import { getCurrentUser } from "@/lib/fetchers/user";
import { getUserSettings } from "@/lib/actions/user";

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
