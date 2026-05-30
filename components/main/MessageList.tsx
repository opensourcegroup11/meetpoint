"use client";

type MessageItem = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

type MessageListProps = {
  messages: MessageItem[];
  friendId: string;
  loading: boolean;
  error: string | null;
};

export default function MessageList({
  messages,
  friendId,
  loading,
  error,
}: MessageListProps) {
  return (
    <div className="flex-1 flex flex-col gap-4 px-6 py-4 overflow-y-auto">
      <p className="text-center text-gray-400 text-sm">---오늘---</p>
      {loading && messages.length === 0 && (
        <p className="text-center text-gray-400 text-sm">
          메시지를 불러오는 중...
        </p>
      )}
      {error && <p className="text-center text-red-500 text-sm">{error}</p>}
      {!loading && !error && messages.length === 0 && (
        <p className="text-center text-gray-400 text-sm">
          아직 메시지가 없습니다.
        </p>
      )}
      {messages.map((message) => {
        const isMine = message.senderId !== friendId;
        if (isMine) {
          return (
            <div key={message.id} className="flex justify-end">
              <div className="bg-[#5B5BD6] text-white rounded-2xl px-4 py-2 text-sm max-w-[70%]">
                {message.content}
              </div>
            </div>
          );
        }
        return (
          <div key={message.id} className="flex items-end gap-2">
            <div className="w-8 h-8 rounded-full bg-[#EEEEFF] overflow-hidden flex items-center justify-center">
              <img
                src="/user.png"
                alt="프로필"
                className="w-6 h-6 object-contain"
              />
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-2 text-sm max-w-[70%]">
              {message.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}