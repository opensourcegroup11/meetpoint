"use client";

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
  return (
    <div className="bg-white rounded-2xl p-6 w-80 shadow-sm">
      <h2 className="text-xl font-bold mb-4">친구 목록</h2>

      <FriendListFilter />

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

      {!loading &&
        !error &&
        friends.map((friend) => (
          <button
            key={friend.id}
            type="button"
            onClick={() => onSelectFriend(friend.id)}
            className={`w-full flex items-center justify-between py-3 border-b border-gray-100 px-2 rounded-lg hover:bg-[#EEEEFF] ${
              selectedFriendId === friend.id ? "bg-[#EEEEFF]" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <span className="text-gray-700">{friend.nickname}</span>
            </div>

            <span className="text-gray-400">{">"}</span>
          </button>
        ))}
    </div>
  );
}