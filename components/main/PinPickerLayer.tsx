"use client";

import { useEffect, useRef, useState } from "react";
import { loadKakaoMapSdk } from "@/lib/kakao/map-loader";

type PinPickerLayerProps = {
  onConfirm: (address: string, lat: number, lng: number) => void;
  onClose: () => void;
};

export default function PinPickerLayer({ onConfirm, onClose }: PinPickerLayerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let marker: ReturnType<typeof createMarker> | null = null;

    function createMarker(map: object, latlng: object) {
      return new window.kakao.maps.Marker({ position: latlng, map });
    }

    async function initMap() {
      try {
        await loadKakaoMapSdk();
        if (!mapRef.current) return;

        const center = new window.kakao.maps.LatLng(37.5665, 126.978);
        const map = new window.kakao.maps.Map(mapRef.current, {
          center,
          level: 5,
        });

        marker = createMarker(map, center);

        window.kakao.maps.event.addListener(map, "click", (mouseEvent: { latLng: object & { getLat: () => number; getLng: () => number } }) => {
          const latlng = mouseEvent.latLng;
          marker?.setPosition(latlng);

          const geocoder = new window.kakao.maps.services.Geocoder();
          geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (result, status) => {
            if (status === window.kakao.maps.services.Status.OK && result[0]) {
              const addr = result[0].address.address_name;
              setAddress(addr);
              setCoords({ lat: latlng.getLat(), lng: latlng.getLng() });
            } else {
              setAddress("주소를 가져올 수 없습니다.");
              setCoords({ lat: latlng.getLat(), lng: latlng.getLng() });
            }
          });
        });
      } catch {
        setError("지도를 불러오지 못했습니다.");
      }
    }

    void initMap();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-[600px] max-w-[95vw] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-bold text-gray-900">지도에서 핀으로 위치 지정</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {error ? (
          <div className="p-6 text-sm text-red-500">{error}</div>
        ) : (
          <>
            <div ref={mapRef} className="w-full h-[400px]" />
            <div className="px-5 py-4 border-t bg-gray-50">
              <p className="text-sm text-gray-500 mb-3">
                {address ? (
                  <span>📍 {address}</span>
                ) : (
                  <span className="text-gray-400">지도를 클릭해서 위치를 선택하세요.</span>
                )}
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={!coords}
                  onClick={() => {
                    if (coords && address) onConfirm(address, coords.lat, coords.lng);
                  }}
                  className="px-4 py-2 text-sm rounded-lg bg-[#5B5BD6] text-white disabled:opacity-50"
                >
                  이 위치로 설정
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}