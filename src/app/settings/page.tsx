import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SettingsClient from "@/components/settings-client";
import { getCurrentUser } from "@/lib/fetchers/user";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  return <SettingsClient currentUser={currentUser} />;
}
