"use client";

import { useEffect, useState } from "react";
import { openPostcodeSearch } from "@/lib/daum/postcode-loader";
import PinPickerLayer from "./PinPickerLayer";

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
  if (value >= 1000) return `${(value / 1000).toFixed(2)}km`;
  return `${Math.round(value)}m`;
}

/**
 * 거리 바 width% 계산
 * - 최대값 기준 비율로 계산하되 최대 72%까지만 차도록 캡을 씌움
 * - 이렇게 하면 막대가 꽉 차지 않아서 나/친구 간 차이가 시각적으로 잘 드러남
 */
function calcBarWidth(value: number, max: number) {
  if (max === 0) return 0;
  const ratio = value / max;
  return Math.round(ratio * 72);
}

const RANK_COLORS = ["#3B52B4", "#6B7FC4", "#9AA8D8"];
const RANK_BANNER = [
  "linear-gradient(90deg,#3B52B4,#5B72D4)",
  "linear-gradient(90deg,#6B7FC4,#8B9FE4)",
  "linear-gradient(90deg,#9AA8D8,#BAC8F8)",
];

const CATEGORY_LABEL: Record<Category, string> = {
  cafe: "카페",
  meal: "식사",
  fun: "놀거리",
};

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
  const [showPinPicker, setShowPinPicker] = useState(false);

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
          if (json.data.departure) {
            const dep = {
              address: json.data.departure.address,
              lat: json.data.departure.lat,
              lng: json.data.departure.lng,
            };

            setMyDeparture(dep);
            onMyDepartureChange?.(dep);
          }

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
  }, [mode, selectedFriend, onMyDepartureChange, onFriendDepartureChange]);

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
      } = {
        friendId: selectedFriend.id,
        mode,
        category,
      };

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

  const maxDist = result
    ? Math.max(...result.places.flatMap((p) => [p.distanceFromMe, p.distanceFromFriend]))
    : 1;

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
            className="w-full rounded-lg bg-[#3B52B4] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
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

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openPostcodeSearch((address, lat, lng) => {
                      const dep = { address, lat, lng };
                      setMyDeparture(dep);
                      onMyDepartureChange?.(dep);
                      setSaveMessage(null);
                    })
                  }
                  className="flex-1 rounded-lg border border-[#3B52B4] px-3 py-2 text-left text-sm text-[#3B52B4]"
                >
                  {myDeparture ? myDeparture.address : "주소 검색"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPinPicker(true)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  📍 핀
                </button>
              </div>

              {myDeparture && (
                <>
                  <p className="text-xs text-gray-400">
                    {myDeparture.lat.toFixed(5)}, {myDeparture.lng.toFixed(5)}
                  </p>

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
                  <p className="text-xs text-gray-400">
                    {friendDeparture.lat.toFixed(5)}, {friendDeparture.lng.toFixed(5)}
                  </p>
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
          <div
            className="mb-4 flex flex-wrap items-center gap-2 rounded-xl px-4 py-3 text-xs font-medium"
            style={{ background: "rgba(59,82,180,0.07)", color: "#3B52B4" }}
          >
            <span>
              중심점&nbsp;
              <span className="font-mono font-bold">
                {result.midpoint.lat.toFixed(5)}, {result.midpoint.lng.toFixed(5)}
              </span>
            </span>

            <span className="opacity-30">·</span>

            <span>
              반경&nbsp;
              <span className="font-mono font-bold">{formatMeter(result.radius)}</span>
            </span>

            <span className="opacity-30">·</span>

            <span>
              기준거리&nbsp;
              <span className="font-mono font-bold">{formatMeter(result.baseDistance)}</span>
            </span>

            <span className="opacity-30">·</span>

            <span>
              {mode === "now" ? "지금 만나기" : "나중에 만나기"}&nbsp;·&nbsp;
              {CATEGORY_LABEL[result.category]}
            </span>
          </div>

          <div className="space-y-4">
            {result.places.map((place, index) => {
              const rankColor = RANK_COLORS[index] ?? "#9AA8D8";
              const banner = RANK_BANNER[index] ?? RANK_BANNER[2];
              const meBarW = calcBarWidth(place.distanceFromMe, maxDist);
              const frBarW = calcBarWidth(place.distanceFromFriend, maxDist);
              const avgBarW = calcBarWidth(place.averageDistance, maxDist);

              return (
                <article
                  key={place.id}
                  className="overflow-hidden rounded-2xl bg-white"
                  style={{
                    boxShadow:
                      "0 2px 16px rgba(59,82,180,0.10), 0 1px 4px rgba(59,82,180,0.06)",
                  }}
                >
                  <div style={{ height: 6, background: banner }} />

                  <div className="p-5">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                          <div
                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-sm font-black text-white"
                            style={{ background: rankColor }}
                          >
                            {index + 1}
                          </div>

                          <span className="text-xs font-medium text-gray-400">
                            추천 {index + 1}위
                          </span>
                        </div>

                        <h3
                          className="truncate text-lg font-black leading-tight tracking-tight text-gray-900"
                          style={{ letterSpacing: "-0.3px" }}
                        >
                          {place.name}
                        </h3>
                      </div>

                      <div
                        className="flex-shrink-0 rounded-xl px-3 py-2 text-right"
                        style={{ background: "rgba(59,82,180,0.07)" }}
                      >
                        <p
                          className="mb-0.5 font-mono text-[10px] uppercase tracking-widest"
                          style={{ color: "#8B98C0" }}
                        >
                          score
                        </p>

                        <p
                          className="font-mono text-[18px] font-black leading-none"
                          style={{ color: rankColor }}
                        >
                          {formatMeter(place.score)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 flex flex-wrap items-center gap-1.5">
                      <span
                        className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          background: "rgba(59,82,180,0.08)",
                          color: "#3B52B4",
                        }}
                      >
                        {place.categoryName}
                      </span>

                      <span className="text-[11px] text-gray-400">{place.address}</span>
                    </div>

                    <div className="mb-3 rounded-xl p-4" style={{ background: "#F8FAFF" }}>
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex w-10 flex-shrink-0 items-center gap-1.5 text-xs font-semibold text-gray-600">
                          <div
                            className="h-2 w-2 flex-shrink-0 rounded-full"
                            style={{ background: "#3B82F6" }}
                          />
                          나
                        </div>

                        <div
                          className="h-2.5 flex-1 overflow-hidden rounded-full"
                          style={{ background: "rgba(59,82,180,0.08)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${meBarW}%`,
                              background: "linear-gradient(90deg,#3B82F6,#60A5FA)",
                            }}
                          />
                        </div>

                        <div className="w-16 flex-shrink-0 text-right font-mono text-xs font-bold text-gray-800">
                          {formatMeter(place.distanceFromMe)}
                        </div>
                      </div>

                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex w-10 flex-shrink-0 items-center gap-1.5 text-xs font-semibold text-gray-600">
                          <div
                            className="h-2 w-2 flex-shrink-0 rounded-full"
                            style={{ background: "#22C55E" }}
                          />
                          친구
                        </div>

                        <div
                          className="h-2.5 flex-1 overflow-hidden rounded-full"
                          style={{ background: "rgba(59,82,180,0.08)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${frBarW}%`,
                              background: "linear-gradient(90deg,#22C55E,#4ADE80)",
                            }}
                          />
                        </div>

                        <div className="w-16 flex-shrink-0 text-right font-mono text-xs font-bold text-gray-800">
                          {formatMeter(place.distanceFromFriend)}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 flex-shrink-0 text-xs font-bold"
                          style={{ color: rankColor }}
                        >
                          평균
                        </div>

                        <div
                          className="h-2.5 flex-1 overflow-hidden rounded-full"
                          style={{ background: "rgba(59,82,180,0.08)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${avgBarW}%`,
                              background: `linear-gradient(90deg,${rankColor},#6B7FC4)`,
                              opacity: 0.6,
                            }}
                          />
                        </div>

                        <div
                          className="w-16 flex-shrink-0 text-right font-mono text-xs font-bold"
                          style={{ color: rankColor }}
                        >
                          {formatMeter(place.averageDistance)}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 grid grid-cols-2 gap-2">
                      {[
                        { label: "편차", value: place.distanceGap },
                        { label: "카테고리", value: place.categoryPenalty },
                        { label: "활성도", value: place.activityPenalty },
                        { label: "교통", value: place.transitPenalty },
                      ].map(({ label, value }) => {
                        const isZero = value === 0;

                        return (
                          <div
                            key={label}
                            className="flex items-center justify-between rounded-xl px-3 py-2.5"
                            style={{
                              background: isZero
                                ? "rgba(34,197,94,0.07)"
                                : "rgba(245,158,11,0.07)",
                              border: `1px solid ${
                                isZero ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"
                              }`,
                            }}
                          >
                            <span className="text-sm font-medium" style={{ color: "#6B7280" }}>
                              {label}
                            </span>

                            <span
                              className="font-mono text-sm font-black"
                              style={{ color: isZero ? "#16A34A" : "#D97706" }}
                            >
                              {isZero ? "+0m" : `+${formatMeter(value)}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-1.5 text-[11px]"
                        style={{ color: "#8B98C0" }}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4l3 3" />
                        </svg>
                        주변 후보{" "}
                        <span className="font-mono font-bold" style={{ color: "#4A5580" }}>
                          {place.nearbyCount}개
                        </span>
                      </div>

                      {place.placeUrl && (
                        <a
                          href={place.placeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors"
                          style={{
                            background: "rgba(59,82,180,0.07)",
                            color: "#3B52B4",
                          }}
                        >
                          카카오맵
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {showPinPicker && (
        <PinPickerLayer
          onConfirm={(address, lat, lng) => {
            const dep = { address, lat, lng };
            setMyDeparture(dep);
            onMyDepartureChange?.(dep);
            setSaveMessage(null);
            setShowPinPicker(false);
          }}
          onClose={() => setShowPinPicker(false)}
        />
      )}
    </section>
  );
}