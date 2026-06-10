/* eslint-disable @typescript-eslint/no-explicit-any */
let postcodePromise: Promise<void> | null = null;

async function ensureKakaoMaps(): Promise<void> {
  const kakao = (window as any).kakao;
  if (kakao?.maps?.services) return;

  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;
  if (!appKey) throw new Error("NEXT_PUBLIC_KAKAO_MAP_APP_KEY가 없습니다.");

  await new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("kakao-map-sdk");
    if (existing) {
      (window as any).kakao?.maps?.load(() => resolve());
      return;
    }
    const script = document.createElement("script");
    script.id = "kakao-map-sdk";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => (window as any).kakao.maps.load(() => resolve());
    script.onerror = () => reject(new Error("Kakao Map SDK 로드 실패"));
    document.head.appendChild(script);
  });
}

export function loadDaumPostcode(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if ((window as any).daum?.Postcode) return Promise.resolve();

  if (!postcodePromise) {
    postcodePromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Daum Postcode 로드 실패"));
      document.head.appendChild(script);
    });
  }

  return postcodePromise;
}

export function openPostcodeSearch(
  onSelect: (address: string, lat: number, lng: number) => void,
) {
  Promise.all([loadDaumPostcode(), ensureKakaoMaps()])
    .then(() => {
      new (window as any).daum.Postcode({
        oncomplete: (data: any) => {
          const address = data.roadAddress || data.jibunAddress;
          const kakao = (window as any).kakao;
          const geocoder = new kakao.maps.services.Geocoder();
          geocoder.addressSearch(address, (result: any[], status: string) => {
            if (status === kakao.maps.services.Status.OK && result.length > 0) {
              onSelect(address, Number(result[0].y), Number(result[0].x));
            } else {
              alert("좌표를 찾을 수 없습니다. 다른 주소를 입력해보세요.");
            }
          });
        },
      }).open();
    })
    .catch(() => {
      alert("주소 검색을 불러오지 못했습니다.");
    });
}