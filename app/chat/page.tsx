import Header from "@/components/common/Header";
import FriendList from "@/components/main/FriendList";
import ChatPanel from "@/components/main/ChatPanel";

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <Header />

      <div className="flex gap-6 px-12 py-8">
        <FriendList />
        <ChatPanel />
      </div>
    </main>
  );
}