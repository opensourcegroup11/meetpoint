"use client";
import { useState } from "react";
import FriendListFilter from "./FriendListFilter";

type FriendSummary = {
  id: string;
  relationId?: string;
  nickname: string;
  lat: number | null;
  lng: number | null;
  locationUpdatedAt: string | null;
};

type FriendListProps = {
  friends: FriendSummary[];
  loading: boolean;
  error: string | null;
  selectedFriendId: string | null;
  onSelectFriend: (friendId: string) => void;
};

export default function FriendList({
  friends,
  loading,
  error,
  selectedFriendId,
  onSelectFriend,
}: FriendListProps) {
  const [filterText, setFilterText] = useState("");

  const filteredFriends = friends.filter((f) =>
    f.nickname.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl p-6 w-80 shadow-sm">
      <h2 className="text-xl font-bold mb-4">친구 목록</h2>
      <FriendListFilter value={filterText} onChange={setFilterText} />

      {loading && (
        <p className="text-sm text-gray-400 py-4">
          친구 목록을 불러오는 중...
        </p>
      )}
      {error && <p className="text-sm text-red-500 py-4">{error}</p>}
      {!loading && !error && friends.length === 0 && (
        <p className="text-sm text-gray-400 py-4">
          아직 추가된 친구가 없습니다.
        </p>
      )}
      {!loading && !error && friends.length > 0 && filteredFriends.length === 0 && (
        <p className="text-sm text-gray-400 py-4">
          검색 결과가 없습니다.
        </p>
      )}

      {!loading &&
        !error &&
        filteredFriends.map((friend) => (
          <button
            key={friend.id}
            type="button"
            onClick={() => onSelectFriend(friend.id)}
            className={`w-full flex items-center justify-between py-3 border-b border-gray-100 px-2 rounded-lg hover:bg-[#EEEEFF] ${
              selectedFriendId === friend.id ? "bg-[#EEEEFF]" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#EEEEFF] overflow-hidden flex items-center justify-center">
                <img
                  src="/user.png"
                  alt="프로필"
                  className="w-6 h-6 object-contain"
                />
              </div>
              <span className="text-gray-700">{friend.nickname}</span>
            </div>
            <span className="text-gray-400">{">"}</span>
          </button>
        ))}
    </div>
  );
}