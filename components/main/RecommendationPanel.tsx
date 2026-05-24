"use client";

import { useEffect, useState } from "react";

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
  midpoint: {
    lat: number;
    lng: number;
  };
  baseDistance: number;
  places: RecommendationPlace[];
};

type RecommendationPanelProps = {
  selectedFriend: FriendSummary | null;
};

function formatMeter(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}km`;
  }

  return `${value}m`;
}

function getFriendLocation(friend: FriendSummary | null): LocationPoint | null {
  if (!friend) return null;
  if (friend.lat == null || friend.lng == null) return null;

  return {
    lat: friend.lat,
    lng: friend.lng,
    locationUpdatedAt: friend.locationUpdatedAt,
  };
}

export default function RecommendationPanel({
  selectedFriend,
}: RecommendationPanelProps) {
  const [mode, setMode] = useState<Mode>("now");
  const [category, setCategory] = useState<Category>("cafe");
  const [myLocation, setMyLocation] = useState<LocationPoint | null>(null);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const friendLocation = getFriendLocation(selectedFriend);

  useEffect(() => {
    async function fetchMyLocation() {
      try {
        const res = await fetch("/api/location");
        const json = (await res.json()) as ApiResponse<LocationResponse>;

        if (json.ok) {
          setMyLocation(json.data.location);
        }
      } catch {
        // 추천 패널에서는 초기 위치 조회 실패를 조용히 처리
      }
    }

    void fetchMyLocation();
  }, []);

  async function handleRecommend() {
    setError(null);
    setResult(null);

    if (!selectedFriend) {
      setError("먼저 친구를 선택해 주세요.");
      return;
    }

    setLoading(true);

    try {
      const body: {
        friendId: string;
        mode: Mode;
        category: Category;
        departure?: { lat: number; lng: number };
        friendDeparture?: { lat: number; lng: number };
      } = {
        friendId: selectedFriend.id,
        mode,
        category,
      };

      if (mode === "later") {
        if (myLocation) {
          body.departure = {
            lat: myLocation.lat,
            lng: myLocation.lng,
          };
        }

        if (friendLocation) {
          body.friendDeparture = {
            lat: friendLocation.lat,
            lng: friendLocation.lng,
          };
        }
      }

      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as ApiResponse<RecommendationResponse>;

      if (!json.ok) {
        throw new Error(json.error.message);
      }

      setResult(json.data);
    } catch (recommendError) {
      setError(
        recommendError instanceof Error
          ? recommendError.message
          : "추천 장소를 불러오지 못했습니다.",
      );
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
            onChange={(event) => setMode(event.target.value as Mode)}
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
            onChange={(event) => setCategory(event.target.value as Category)}
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

      <div className="mt-3 text-sm text-gray-500">
        {selectedFriend ? (
          <p>선택한 친구: {selectedFriend.nickname}</p>
        ) : (
          <p>친구를 선택하면 추천을 받을 수 있습니다.</p>
        )}

        {mode === "later" && (
          <p className="mt-1">
            나중에 만나기는 현재 저장된 내 위치와 친구 위치를 출발 위치로 사용합니다.
          </p>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-5">
          <div className="mb-3 rounded-xl bg-[#F5F5FF] p-4 text-sm text-gray-700">
            <p>
              중심점: {result.midpoint.lat.toFixed(5)},{" "}
              {result.midpoint.lng.toFixed(5)}
            </p>
            <p>검색 반경: {formatMeter(result.radius)}</p>
            <p>기준거리: {formatMeter(result.baseDistance)}</p>
          </div>

          <div className="space-y-3">
            {result.places.map((place, index) => (
              <article
                key={place.id}
                className="rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#5B5BD6]">
                      추천 {index + 1}위
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-gray-900">
                      {place.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {place.categoryName}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {place.address}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500">score</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatMeter(place.score)}
                    </p>
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
                  <a
                    href={place.placeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-semibold text-[#5B5BD6]"
                  >
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