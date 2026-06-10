/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useCallback, useEffect, useState } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

type FriendSummary = {
  id: string;
  relationId?: string;
  nickname: string;
  lat: number | null;
  lng: number | null;
  locationUpdatedAt: string | null;
};

type MessageItem = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

type ChatPanelProps = {
  selectedFriend: FriendSummary;
};

export default function ChatPanel({ selectedFriend }: ChatPanelProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/messages?friendId=${selectedFriend.id}`);
      const result = (await res.json()) as ApiResponse<{
        messages: MessageItem[];
        lastMessageCreatedAt: string | null;
        pollingIntervalSec: number;
      }>;
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setMessages(result.data.messages);
    } catch {
      setError("메시지를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [selectedFriend.id]);

  useEffect(() => {
    void fetchMessages();
    const intervalId = window.setInterval(() => {
      void fetchMessages();
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [fetchMessages]);

  async function handleSendMessage(content: string) {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        friendId: selectedFriend.id,
        content,
      }),
    });
    const result = (await res.json()) as ApiResponse<{
      message: MessageItem;
    }>;
    if (!result.ok) {
      throw new Error(result.error.message);
    }
    await fetchMessages();
  }

  return (
    <div className="bg-white rounded-2xl flex flex-col flex-1 shadow-sm overflow-hidden min-h-[520px]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#EEEEFF] overflow-hidden flex items-center justify-center">
            <img
              src="/user.png"
              alt="프로필"
              className="w-6 h-6 object-contain"
            />
          </div>
          <span className="font-bold">
            {selectedFriend.nickname} 님과의 채팅
          </span>
        </div>
        <button className="border border-[#5B5BD6] text-[#5B5BD6] px-4 py-1 rounded-lg text-sm">
          지도에서 위치 확인
        </button>
      </div>
      <MessageList
        messages={messages}
        friendId={selectedFriend.id}
        loading={loading}
        error={error}
      />
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
}