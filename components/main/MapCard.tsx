/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LocationStatus from "./LocationStatus";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

type LocationPoint = {
  lat: number;
  lng: number;
  locationUpdatedAt: string | null;
};

type LocationResponse = {
  location: LocationPoint | null;
};

type RecommendedPlace = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type MapCardProps = {
  friendLocation?: LocationPoint | null;
  recommendedPlaces?: RecommendedPlace[];
  myDeparture?: LocationPoint | null;
};

function loadKakaoMapScript(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return;
    const kakao = (window as any).kakao;
    if (kakao?.maps) {
      kakao.maps.load(() => resolve(kakao));
      return;
    }
    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;
    if (!appKey) {
      reject(new Error("NEXT_PUBLIC_KAKAO_MAP_APP_KEY가 설정되지 않았습니다."));
      return;
    }
    const existingScript = document.getElementById("kakao-map-sdk");
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        const loadedKakao = (window as any).kakao;
        loadedKakao.maps.load(() => resolve(loadedKakao));
      });
      return;
    }
    const script = document.createElement("script");
    script.id = "kakao-map-sdk";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => {
      const loadedKakao = (window as any).kakao;
      loadedKakao.maps.load(() => resolve(loadedKakao));
    };
    script.onerror = () => reject(new Error("Kakao Map SDK를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });
}

// 순위별 색상
const RANK_COLORS = ["#3B52B4", "#6B7FC4", "#9AA8D8"];

function createMarkerContent(
  label: string,
  type: "me" | "friend" | "midpoint" | "place",
  rank?: number, // 추천 장소일 때만 전달
) {
  // ── 내 위치 / 내 출발 위치 ──
  if (type === "me") {
    return `
      <div style="
        display:flex; align-items:center; gap:6px;
        padding:6px 12px 6px 8px;
        border-radius:999px;
        background:#5B5BD6;
        box-shadow:0 4px 14px rgba(91,91,214,0.45);
        white-space:nowrap;
      ">
        <div style="
          width:8px; height:8px; border-radius:50%;
          background:white; flex-shrink:0;
        "></div>
        <span style="color:white; font-size:12px; font-weight:700;">${label}</span>
      </div>`;
  }

  // ── 친구 위치 / 친구 출발 위치 ──
  if (type === "friend") {
    return `
      <div style="
        display:flex; align-items:center; gap:6px;
        padding:6px 12px 6px 8px;
        border-radius:999px;
        background:#10B981;
        box-shadow:0 4px 14px rgba(16,185,129,0.45);
        white-space:nowrap;
      ">
        <div style="
          width:8px; height:8px; border-radius:50%;
          background:white; flex-shrink:0;
        "></div>
        <span style="color:white; font-size:12px; font-weight:700;">${label}</span>
      </div>`;
  }

  // ── 중심점 ──
  if (type === "midpoint") {
    return `
      <div style="
        display:flex; align-items:center; gap:5px;
        padding:6px 14px 6px 10px;
        border-radius:999px;
        background:#F59E0B;
        box-shadow:0 4px 14px rgba(245,158,11,0.45);
        white-space:nowrap;
      ">
        <span style="font-size:13px; line-height:1;">★</span>
        <span style="color:white; font-size:12px; font-weight:700;">중심점</span>
      </div>`;
  }

  // ── 추천 장소 ──
  const rankColor = rank != null ? (RANK_COLORS[rank - 1] ?? "#9AA8D8") : "#9AA8D8";
  // 장소명이 너무 길면 7자에서 자르기
  const shortName = label.length > 8 ? label.slice(0, 8) + "…" : label;

  return `
    <div style="
      display:flex; align-items:center; gap:7px;
      padding:5px 12px 5px 5px;
      border-radius:999px;
      background:white;
      border:2px solid ${rankColor};
      box-shadow:0 4px 16px rgba(0,0,0,0.14);
      white-space:nowrap;
      cursor:pointer;
    ">
      <div style="
        width:22px; height:22px; border-radius:50%;
        background:${rankColor};
        color:white;
        font-size:11px; font-weight:900;
        display:flex; align-items:center; justify-content:center;
        flex-shrink:0;
      ">${rank}</div>
      <span style="
        font-size:12px; font-weight:700;
        color:#1a1a2e;
      ">${shortName}</span>
    </div>`;
}

export default function MapCard({
  friendLocation = null,
  recommendedPlaces = [],
  myDeparture = null,
}: MapCardProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [myLocation, setMyLocation] = useState<LocationPoint | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [locationUpdatedAt, setLocationUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  const effectiveMyLocation = myDeparture ?? myLocation;
  const effectiveFriendLocation = friendLocation;

  const midpoint = useMemo(() => {
    if (!effectiveMyLocation || !effectiveFriendLocation) return null;
    return {
      lat: (effectiveMyLocation.lat + effectiveFriendLocation.lat) / 2,
      lng: (effectiveMyLocation.lng + effectiveFriendLocation.lng) / 2,
      locationUpdatedAt: null,
    };
  }, [effectiveMyLocation, effectiveFriendLocation]);

  async function fetchSavedLocation() {
    try {
      const res = await fetch("/api/location");
      const result = (await res.json()) as ApiResponse<LocationResponse>;
      if (!result.ok) return;
      setMyLocation(result.data.location);
      setLocationUpdatedAt(result.data.location?.locationUpdatedAt ?? null);
    } catch {}
  }

  useEffect(() => {
    void fetchSavedLocation();
  }, []);

  useEffect(() => {
    if (myDeparture) setShowMap(true);
  }, [myDeparture]);

  useEffect(() => {
    if (!showMap) return;
    if (!mapRef.current) return;
    if (!effectiveMyLocation && !effectiveFriendLocation) return;

    let cancelled = false;

    async function renderMap() {
      try {
        setMapError(null);
        const kakao = await loadKakaoMapScript();
        if (cancelled || !mapRef.current) return;

        const centerLocation = midpoint ?? effectiveMyLocation ?? effectiveFriendLocation;
        if (!centerLocation) return;

        const center = new kakao.maps.LatLng(centerLocation.lat, centerLocation.lng);
        const map = new kakao.maps.Map(mapRef.current, { center, level: 5 });
        const bounds = new kakao.maps.LatLngBounds();
        let markerCount = 0;

        function addMarker(
          location: LocationPoint,
          label: string,
          type: "me" | "friend" | "midpoint" | "place",
          rank?: number,
        ) {
          const position = new kakao.maps.LatLng(location.lat, location.lng);
          new kakao.maps.CustomOverlay({
            map,
            position,
            content: createMarkerContent(label, type, rank),
            yAnchor: 1.35,
          });
          bounds.extend(position);
          markerCount += 1;
        }

        if (effectiveMyLocation) {
          addMarker(
            effectiveMyLocation,
            myDeparture ? "내 출발 위치" : "내 위치",
            "me",
          );
        }
        if (effectiveFriendLocation) {
          addMarker(
            effectiveFriendLocation,
            myDeparture ? "친구 출발 위치" : "친구 위치",
            "friend",
          );
        }
        if (midpoint) {
          addMarker(midpoint, "중심점", "midpoint");
        }
        // 추천 장소: rank 번호 전달
        recommendedPlaces.forEach((place, index) => {
          addMarker(
            { lat: place.lat, lng: place.lng, locationUpdatedAt: null },
            place.name,
            "place",
            index + 1,
          );
        });

        if (markerCount >= 2) {
          map.setBounds(bounds);
        }
      } catch (mapLoadError) {
        console.error(mapLoadError);
        setMapError(
          mapLoadError instanceof Error ? mapLoadError.message : "지도를 불러오지 못했습니다.",
        );
      }
    }

    renderMap();
    return () => { cancelled = true; };
  }, [showMap, effectiveMyLocation, effectiveFriendLocation, midpoint, recommendedPlaces, myDeparture]);

  async function saveLocation(lat: number, lng: number) {
    const res = await fetch("/api/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng }),
    });
    const result = (await res.json()) as ApiResponse<LocationResponse>;
    if (!result.ok) throw new Error(result.error.message);
    setMyLocation(result.data.location);
    setLocationUpdatedAt(result.data.location?.locationUpdatedAt ?? null);
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
          await saveLocation(position.coords.latitude, position.coords.longitude);
          setShowMap(true);
        } catch (saveError) {
          setError(saveError instanceof Error ? saveError.message : "위치 저장에 실패했습니다.");
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
    <div className="bg-[#EEEEFF] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between gap-6">
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
              onClick={() => setShowMap((prev) => !prev)}
              className="border border-[#5B5BD6] text-[#5B5BD6] px-6 py-2 rounded-lg"
            >
              {showMap ? "지도 접기" : "지도 보기 →"}
            </button>
          </div>
          <LocationStatus
            locationUpdatedAt={locationUpdatedAt}
            error={error}
            isSharing={isSharing}
          />
        </div>
        <div className="text-9xl">🗺️</div>
      </div>

      {showMap && (
        <div className="mt-6">
          {!effectiveMyLocation && !effectiveFriendLocation ? (
            <div className="flex h-80 items-center justify-center rounded-xl bg-white/70 px-4 text-center text-sm text-gray-500">
              내 위치를 공유하거나, 위치를 공유한 친구를 선택하면 지도가 표시됩니다.
            </div>
          ) : (
            <div ref={mapRef} className="h-80 w-full overflow-hidden rounded-xl bg-white" />
          )}
          {mapError && <p className="mt-3 text-sm text-red-500">{mapError}</p>}
          <div className="mt-3 space-y-1 text-sm text-gray-600">
            <p>
              {myDeparture ? "내 출발 위치" : "내 위치"}:{" "}
              {effectiveMyLocation
                ? `${effectiveMyLocation.lat.toFixed(5)}, ${effectiveMyLocation.lng.toFixed(5)}`
                : "없음"}
            </p>
            <p>
              {myDeparture ? "친구 출발 위치" : "친구 위치"}:{" "}
              {effectiveFriendLocation
                ? `${effectiveFriendLocation.lat.toFixed(5)}, ${effectiveFriendLocation.lng.toFixed(5)}`
                : "없음"}
            </p>
            <p>
              중심점:{" "}
              {midpoint
                ? `${midpoint.lat.toFixed(5)}, ${midpoint.lng.toFixed(5)}`
                : "계산 불가"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
