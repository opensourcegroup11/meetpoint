"use client";

import { useEffect, useState } from "react";
import LocationStatus from "./LocationStatus";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

type LocationResponse = {
  location: {
    lat: number | null;
    lng: number | null;
    locationUpdatedAt: string | null;
  };
};

export default function MapCard() {
  const [isSharing, setIsSharing] = useState(false);
  const [locationUpdatedAt, setLocationUpdatedAt] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function fetchSavedLocation() {
    try {
      const res = await fetch("/api/location");
      const result = (await res.json()) as ApiResponse<LocationResponse>;

      if (!result.ok) {
        return;
      }

      setLocationUpdatedAt(result.data.location.locationUpdatedAt);
    } catch {
      // 처음 위치 조회 실패는 화면 전체 오류로 처리하지 않음
    }
  }

  useEffect(() => {
    void fetchSavedLocation();
  }, []);

  async function saveLocation(lat: number, lng: number) {
    const res = await fetch("/api/location", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat, lng }),
    });

    const result = (await res.json()) as ApiResponse<LocationResponse>;

    if (!result.ok) {
      throw new Error(result.error.message);
    }

    setLocationUpdatedAt(result.data.location.locationUpdatedAt);
  }

  function handleShareLocation() {
    setError(null);

    if (!navigator.geolocation) {
      setError("이 브라우저에서는 위치 정보를 사용할 수 없습니다.");
      return;
    }

    setIsSharing(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await saveLocation(
            position.coords.latitude,
            position.coords.longitude,
          );
        } catch (saveError) {
          setError(
            saveError instanceof Error
              ? saveError.message
              : "위치 저장에 실패했습니다.",
          );
        } finally {
          setIsSharing(false);
        }
      },
      () => {
        setError("위치 권한을 허용해 주세요.");
        setIsSharing(false);
      },
    );
  }

  return (
    <div className="bg-[#EEEEFF] rounded-2xl p-6 shadow-sm flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold mb-2">지도로 친구 위치 확인하기</h2>

        <p className="text-gray-500 text-sm mb-4">
          친구들의 현재 위치를 지도에서 확인하고,
          <br />
          만날 장소를 함께 정해보세요.
        </p>

        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={handleShareLocation}
            disabled={isSharing}
            className="bg-[#5B5BD6] text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {isSharing ? "공유 중..." : "내 위치 공유"}
          </button>

          <button
            type="button"
            className="border border-[#5B5BD6] text-[#5B5BD6] px-6 py-2 rounded-lg"
          >
            지도 보기 →
          </button>
        </div>

        <LocationStatus
          locationUpdatedAt={locationUpdatedAt}
          error={error}
          isSharing={isSharing}
        />
      </div>

      <div className="text-6xl">🗺️</div>
    </div>
  );
}