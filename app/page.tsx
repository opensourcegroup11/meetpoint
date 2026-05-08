import Header from "@/components/common/Header";
import StartCard from "@/components/start/StartCard";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#EEEEFF] flex flex-col">
      <Header />
      <StartCard />
    </main>
  );
}