import { redirect } from "next/navigation";
import Header from "@/components/common/Header";
import StartCard from "@/components/start/StartCard";
import { getCurrentUserFromCookie } from "@/lib/auth/session";

export default async function HomePage() {
  const currentUser = await getCurrentUserFromCookie();

  if (currentUser) {
    redirect("/main");
  }

  return (
    <main className="min-h-screen bg-[#EEEEFF] flex flex-col">
      <Header />
      <StartCard />
    </main>
  );
}