import { redirect } from "next/navigation";
import MainShell from "@/components/main/MainShell";
import { getCurrentUserFromCookie } from "@/lib/auth/session";

export default async function MainPage() {
  const currentUser = await getCurrentUserFromCookie();

  if (!currentUser) {
    redirect("/");
  }

  return <MainShell />;
}