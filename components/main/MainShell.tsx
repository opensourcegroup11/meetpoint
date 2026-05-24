"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "@/components/common/Header";
import FriendList from "./FriendList";
import FriendAddCard from "./FriendAddCard";
import MapCard from "./MapCard";
import ChatPanel from "./ChatPanel";

type FriendSummary = {
  id: string;
  relationId?: string;
  nickname: string;
  lat: number | null;
  lng: number | null;
  locationUpdatedAt: string | null;
};

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export default function MainShell() {
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    setFriendsLoading(true);
    setFriendsError(null);

    try {
      const res = await fetch("/api/friends");
      const result = (await res.json()) as ApiResponse<{
        friends: FriendSummary[];
      }>;

      if (!result.ok) {
        setFriendsError(result.error.message);
        return;
      }

      setFriends(result.data.friends);
    } catch {
      setFriendsError("친구 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setFriendsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFriends();
  }, [fetchFriends]);

  async function handleAddFriend(friendNickname: string) {
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ friendNickname }),
    });

    const result = (await res.json()) as ApiResponse<{
      relationId: string;
      friend: FriendSummary;
    }>;

    if (!result.ok) {
      throw new Error(result.error.message);
    }

    await fetchFriends();
  }

  const selectedFriend =
    friends.find((friend) => friend.id === selectedFriendId) ?? null;

  const friendLocation =
    selectedFriend?.lat != null && selectedFriend?.lng != null
      ? {
          lat: selectedFriend.lat,
          lng: selectedFriend.lng,
          locationUpdatedAt: selectedFriend.locationUpdatedAt,
        }
      : null;

  return (
    <main className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <Header showLogout />

      <div className="flex gap-6 px-12 py-8">
        <FriendList
          friends={friends}
          loading={friendsLoading}
          error={friendsError}
          selectedFriendId={selectedFriendId}
          onSelectFriend={setSelectedFriendId}
        />

        <div className="flex flex-col gap-6 flex-1">
          <FriendAddCard onAddFriend={handleAddFriend} />

          {selectedFriend ? (
            <ChatPanel selectedFriend={selectedFriend} />
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm text-gray-400">
              친구를 선택하면 채팅을 시작할 수 있습니다.
            </div>
          )}

          <MapCard friendLocation={friendLocation} />
        </div>
      </div>
    </main>
  );
}