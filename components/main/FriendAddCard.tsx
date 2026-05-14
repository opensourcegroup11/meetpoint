"use client";

import { FormEvent, useState } from "react";

type FriendAddCardProps = {
  onAddFriend: (friendNickname: string) => Promise<void>;
};

export default function FriendAddCard({ onAddFriend }: FriendAddCardProps) {
  const [friendNickname, setFriendNickname] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nickname = friendNickname.trim();

    if (!nickname) {
      setMessage("친구 닉네임을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await onAddFriend(nickname);
      setFriendNickname("");
      setMessage("친구가 추가되었습니다.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "친구 추가에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-bold mb-2">친구 추가하기</h2>

      <p className="text-gray-400 text-sm mb-4">
        닉네임으로 친구를 검색하고 추가해보세요.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1">
          <span>🔍</span>
          <input
            type="text"
            value={friendNickname}
            onChange={(event) => setFriendNickname(event.target.value)}
            placeholder="닉네임을 입력하세요"
            className="outline-none text-gray-500 w-full"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#5B5BD6] text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          {isSubmitting ? "추가 중" : "검색"}
        </button>
      </form>

      {message && <p className="text-sm text-gray-500 mt-3">{message}</p>}
    </div>
  );
}