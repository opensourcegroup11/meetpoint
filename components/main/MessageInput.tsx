"use client";

import { FormEvent, useState } from "react";

type MessageInputProps = {
  onSendMessage: (content: string) => Promise<void>;
};

export default function MessageInput({ onSendMessage }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setError("메시지를 입력해 주세요.");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await onSendMessage(trimmedContent);
      setContent("");
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "메시지 전송에 실패했습니다.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="px-6 py-4 border-t border-gray-100"
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="메시지를 입력하세요."
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2 outline-none text-sm"
        />

        <button
          type="submit"
          disabled={isSending}
          className="bg-[#5B5BD6] text-white px-6 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {isSending ? "전송 중" : "전송"}
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </form>
  );
}