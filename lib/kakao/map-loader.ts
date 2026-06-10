/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
    interface Window {
      kakao: {
        maps: {
          load: (callback: () => void) => void;
          Map: new (container: HTMLElement, options: object) => object;
          LatLng: new (lat: number, lng: number) => object;
          Marker: new (options: object) => {
            setPosition: (latlng: object) => void;
            setMap: (map: object | null) => void;
          };
          event: {
            addListener: (target: object, type: string, handler: (e: any) => void) => void;
          };
          services: {
            Geocoder: new () => {
              coord2Address: (
                lng: number,
                lat: number,
                callback: (result: Array<{ address: { address_name: string } }>, status: string) => void
              ) => void;
            };
            Status: { OK: string };
          };
        };
      };
    }
  }
  
  export function loadKakaoMapSdk(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") return reject(new Error("서버 환경"));
  
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => resolve());
        return;
      }
  
      if (document.getElementById("kakao-map-sdk")) {
        const interval = setInterval(() => {
          if (window.kakao?.maps) {
            clearInterval(interval);
            window.kakao.maps.load(() => resolve());
          }
        }, 100);
        return;
      }
  
      const script = document.createElement("script");
      script.id = "kakao-map-sdk";
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY}&libraries=services&autoload=false`;
      script.onload = () => {
        window.kakao.maps.load(() => resolve());
      };
      script.onerror = () => reject(new Error("카카오맵 SDK 로드 실패"));
      document.head.appendChild(script);
    });
  }