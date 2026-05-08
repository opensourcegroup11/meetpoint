import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

export default function ChatPanel() {
  return (
    <div className="bg-white rounded-2xl flex flex-col flex-1 shadow-sm overflow-hidden min-h-[520px]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full" />
          <span className="font-bold">영걸 님과의 채팅</span>
        </div>

        <button className="border border-[#5B5BD6] text-[#5B5BD6] px-4 py-1 rounded-lg text-sm">
          지도에서 위치 확인
        </button>
      </div>

      <MessageList />
      <MessageInput />
    </div>
  );
}