import Header from "@/components/common/Header";
import FriendList from "./FriendList";
import FriendAddCard from "./FriendAddCard";
import MapCard from "./MapCard";

export default function MainShell() {
  return (
    <main className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <Header showLogout />

      <div className="flex gap-6 px-12 py-8">
        <FriendList />

        <div className="flex flex-col gap-6 flex-1">
          <FriendAddCard />
          <MapCard />
        </div>
      </div>
    </main>
  );
}