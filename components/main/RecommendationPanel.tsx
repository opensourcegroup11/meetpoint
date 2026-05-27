"use client";

import { useEffect, useState } from "react";
import { openPostcodeSearch } from "@/lib/daum/postcode-loader";

type Mode = "now" | "later";
type Category = "cafe" | "meal" | "fun";

type FriendSummary = {
  id: string;
  relationId?: string;
  nickname: string;
  lat: number | null;
  lng: number | null;
  locationUpdatedAt: string | null;
};

type LocationPoint = {
  lat: number;
  lng: number;
  locationUpdatedAt?: string | null;
};

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

type LocationResponse = {
  location: LocationPoint | null;
};

type RecommendationPlace = {
  id: string;
  name: string;
  categoryName: string;
  address: string;
  phone: string;
  placeUrl: string;
  lat: number;
  lng: number;
  distanceFromMidpoint: number;
  distanceFromMe: number;
  distanceFromFriend: number;
  averageDistance: number;
  distanceGap: number;
  nearbyCount: number;
  categoryPenalty: number;
  activityPenalty: number;
  transitPenalty: number;
  score: number;
};

type RecommendationResponse = {
  mode: Mode;
  category: Category;
  radius: number;
  midpoint: { lat: number; lng: number };
  baseDistance: number;
  places: RecommendationPlace[];
};

type DeparturePoint = {
  address: string;
  lat: number;
  lng: number;
};

type DepartureResponse = {
  departure: { lat: number; lng: number; address: string } | null;
  friendDeparture: { lat: number; lng: number; address: string } | null;
};

type RecommendationPanelProps = {
  selectedFriend: FriendSummary | null;
  onResult?: (result: RecommendationResponse | null) => void;
  onModeChange?: (mode: Mode) => void;
  onMyDepartureChange?: (departure: DeparturePoint | null) => void;
  onFriendDepartureChange?: (departure: DeparturePoint | null) => void;
};

function formatMeter(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}km`;
  return `${value}m`;
}

export default function RecommendationPanel({
  selectedFriend,
  onResult,
  onModeChange,
  onMyDepartureChange,
  onFriendDepartureChange,
}: RecommendationPanelProps) {
  const [mode, setMode] = useState<Mode>("now");
  const [category, setCategory] = useState<Category>("cafe");
  const [myLocation, setMyLocation] = useState<LocationPoint | null>(null);
  const [myDeparture, setMyDeparture] = useState<DeparturePoint | null>(null);
  const [friendDeparture, setFriendDeparture] = useState<DeparturePoint | null>(null);
  const [savingDeparture, setSavingDeparture] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMyLocation() {
      try {
        const res = await fetch("/api/location");
        const json = (await res.json()) as ApiResponse<LocationResponse>;
        if (json.ok) setMyLocation(json.data.location);
      } catch {}
    }
    void fetchMyLocation();
  }, []);

  useEffect(() => {
    if (mode !== "later" || !selectedFriend) return;

    const friend = selectedFriend;
    setMyDeparture(null);
    setFriendDeparture(null);
    setSaveMessage(null);
    onMyDepartureChange?.(null);
    onFriendDepartureChange?.(null);

    async function fetchDeparture() {
      try {
        const res = await fetch(`/api/departure?friendId=${friend.id}`);
        const json = (await res.json()) as ApiResponse<DepartureResponse>;
        if (json.ok) {
          // 내 출발 위치
          if (json.data.departure) {
            const dep = {
              address: json.data.departure.address,
              lat: json.data.departure.lat,
              lng: json.data.departure.lng,
            };
            setMyDeparture(dep);
            onMyDepartureChange?.(dep);
          }
    
          // 친구 출발 위치 (친구가 저장한 위치 우선, 없으면 마지막 위치)
          if (json.data.friendDeparture) {
            const friendDep = {
              address: json.data.friendDeparture.address,
              lat: json.data.friendDeparture.lat,
              lng: json.data.friendDeparture.lng,
            };
            setFriendDeparture(friendDep);
            onFriendDepartureChange?.(friendDep);
          } else if (friend.lat != null && friend.lng != null) {
            const friendDep = {
              address: `${friend.nickname}의 마지막 위치`,
              lat: friend.lat,
              lng: friend.lng,
            };
            setFriendDeparture(friendDep);
            onFriendDepartureChange?.(friendDep);
          }
        }
      } catch {}
    }
    void fetchDeparture();
  }, [mode, selectedFriend]);

  function handleModeChange(newMode: Mode) {
    setMode(newMode);
    setMyDeparture(null);
    setFriendDeparture(null);
    setSaveMessage(null);
    onModeChange?.(newMode);
    onMyDepartureChange?.(null);
    onFriendDepartureChange?.(null);
  }

  async function handleSaveDeparture() {
    if (!myDeparture || !selectedFriend) return;
    setSavingDeparture(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/departure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendId: selectedFriend.id,
          lat: myDeparture.lat,
          lng: myDeparture.lng,
          address: myDeparture.address,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setSaveMessage("출발 위치가 저장됐어요. 다음에 자동으로 불러옵니다.");
      } else {
        setSaveMessage("저장 실패: " + json.error.message);
      }
    } catch {
      setSaveMessage("저장 중 오류가 발생했습니다.");
    } finally {
      setSavingDeparture(false);
    }
  }

  async function handleRecommend() {
    setError(null);
    setResult(null);
    onResult?.(null);

    if (!selectedFriend) {
      setError("먼저 친구를 선택해 주세요.");
      return;
    }

    if (mode === "later") {
      if (!myDeparture) {
        setError("내 출발 위치를 검색해 주세요.");
        return;
      }
      if (!friendDeparture) {
        setError("친구가 위치를 공유하지 않았습니다.");
        return;
      }
    }

    setLoading(true);

    try {
      const body: {
        friendId: string;
        mode: Mode;
        category: Category;
        departure?: { lat: number; lng: number };
        friendDeparture?: { lat: number; lng: number };
      } = { friendId: selectedFriend.id, mode, category };

      if (mode === "later") {
        body.departure = { lat: myDeparture!.lat, lng: myDeparture!.lng };
        body.friendDeparture = { lat: friendDeparture!.lat, lng: friendDeparture!.lng };
      }

      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as ApiResponse<RecommendationResponse>;
      if (!json.ok) throw new Error(json.error.message);

      setResult(json.data);
      onResult?.(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "추천 장소를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">중심점 주변 장소 추천</h2>
        <p className="mt-1 text-sm text-gray-500">
          선택한 친구와의 위치를 기준으로 공정한 약속 장소 후보를 추천합니다.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          만남 모드
          <select
            value={mode}
            onChange={(e) => handleModeChange(e.target.value as Mode)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="now">지금 만나기</option>
            <option value="later">나중에 만나기</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          만남 목적
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="cafe">카페</option>
            <option value="meal">식사</option>
            <option value="fun">놀거리</option>
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleRecommend}
            disabled={loading || !selectedFriend}
            className="w-full rounded-lg bg-[#5B5BD6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "추천 중..." : "추천 장소 찾기"}
          </button>
        </div>
      </div>

      {mode === "later" && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-gray-900">출발 위치 설정</h3>
            <p className="mt-1 text-xs text-gray-500">
              내 출발 위치를 검색하고 저장하면 다음에 자동으로 불러옵니다.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">내 출발 위치</span>
              <button
                type="button"
                onClick={() => openPostcodeSearch((address, lat, lng) => {
                  const dep = { address, lat, lng };
                  setMyDeparture(dep);
                  onMyDepartureChange?.(dep);
                  setSaveMessage(null);
                })}
                className="rounded-lg border border-[#5B5BD6] px-3 py-2 text-sm text-[#5B5BD6] text-left"
              >
                {myDeparture ? myDeparture.address : "주소 검색"}
              </button>
              {myDeparture && (
                <>
                  <p className="text-xs text-gray-400">{myDeparture.lat.toFixed(5)}, {myDeparture.lng.toFixed(5)}</p>
                  <button
                    type="button"
                    onClick={handleSaveDeparture}
                    disabled={savingDeparture}
                    className="mt-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                  >
                    {savingDeparture ? "저장 중..." : "이 위치 저장하기"}
                  </button>
                  {saveMessage && <p className="text-xs text-green-600">{saveMessage}</p>}
                </>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">친구 출발 위치</span>
              {friendDeparture ? (
                <>
                  <p className="rounded-lg border border-[#10B981] px-3 py-2 text-sm text-[#10B981]">
                    {friendDeparture.address}
                  </p>
                  <p className="text-xs text-gray-400">{friendDeparture.lat.toFixed(5)}, {friendDeparture.lng.toFixed(5)}</p>
                </>
              ) : (
                <p className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-400">
                  친구가 위치를 공유하지 않았습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 text-sm text-gray-500">
        {selectedFriend ? (
          <p>선택한 친구: {selectedFriend.nickname}</p>
        ) : (
          <p>친구를 선택하면 추천을 받을 수 있습니다.</p>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {result && (
        <div className="mt-5">
          <div className="mb-3 rounded-xl bg-[#F5F5FF] p-4 text-sm text-gray-700">
            <p>중심점: {result.midpoint.lat.toFixed(5)}, {result.midpoint.lng.toFixed(5)}</p>
            <p>검색 반경: {formatMeter(result.radius)}</p>
            <p>기준거리: {formatMeter(result.baseDistance)}</p>
          </div>

          <div className="space-y-3">
            {result.places.map((place, index) => (
              <article key={place.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#5B5BD6]">추천 {index + 1}위</p>
                    <h3 className="mt-1 text-lg font-bold text-gray-900">{place.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{place.categoryName}</p>
                    <p className="mt-1 text-sm text-gray-500">{place.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">score</p>
                    <p className="text-xl font-bold text-gray-900">{formatMeter(place.score)}</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-gray-600 md:grid-cols-2">
                  <p>내 거리: {formatMeter(place.distanceFromMe)}</p>
                  <p>친구 거리: {formatMeter(place.distanceFromFriend)}</p>
                  <p>평균 이동거리: {formatMeter(place.averageDistance)}</p>
                  <p>거리 편차: {formatMeter(place.distanceGap)}</p>
                  <p>카테고리 패널티: {formatMeter(place.categoryPenalty)}</p>
                  <p>활성도 패널티: {formatMeter(place.activityPenalty)}</p>
                  <p>교통 패널티: {formatMeter(place.transitPenalty)}</p>
                  <p>주변 관련 후보 수: {place.nearbyCount}개</p>
                </div>

                {place.placeUrl && (
                  <a href={place.placeUrl} target="_blank" rel="noreferrer"
                    className="mt-3 inline-block text-sm font-semibold text-[#5B5BD6]">
                    카카오맵에서 보기 →
                  </a>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}