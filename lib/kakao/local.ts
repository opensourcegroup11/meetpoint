export type KakaoPlaceDocument = {
  id: string;
  place_name: string;
  category_name: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance?: string;
};

type KakaoSearchResponse = {
  documents: KakaoPlaceDocument[];
};

export async function fetchKakaoKeyword(
  query: string,
  center: { lat: number; lng: number },
  radius: number,
): Promise<KakaoPlaceDocument[]> {
  const restKey = process.env.KAKAO_LOCAL_REST_API_KEY;
  if (!restKey) throw new Error("KAKAO_LOCAL_REST_API_KEY가 설정되지 않았습니다.");

  const params = new URLSearchParams({
    query,
    x: String(center.lng),
    y: String(center.lat),
    radius: String(radius),
    size: "15",
    sort: "distance",
  });

  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`,
    { headers: { Authorization: `KakaoAK ${restKey}` }, cache: "no-store" },
  );

  if (!res.ok) throw new Error(`Kakao Local API 호출 실패: ${res.status}`);
  const json = (await res.json()) as KakaoSearchResponse;
  return json.documents;
}

// ─── 내부 공통 함수 (export 안 함) ───────────────────────────────────────────
async function fetchNearestCategoryDistance(
  place: { lat: number; lng: number },
  categoryGroupCode: string,
  radius: number,
): Promise<number> {
  const restKey = process.env.KAKAO_LOCAL_REST_API_KEY;
  if (!restKey) return 9999;

  try {
    const params = new URLSearchParams({
      category_group_code: categoryGroupCode,
      x: String(place.lng),
      y: String(place.lat),
      radius: String(radius),
      size: "1",
      sort: "distance",
    });

    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/category.json?${params}`,
      { headers: { Authorization: `KakaoAK ${restKey}` }, cache: "no-store" },
    );

    if (!res.ok) return 9999;

    const json = (await res.json()) as KakaoSearchResponse;
    return Number(json.documents[0]?.distance ?? 9999);
  } catch {
    return 9999;
  }
}

// ─── 지하철(SW8) + 버스정류장(BUS8) 중 더 가까운 거리 반환 ──────────────────
export async function fetchNearestTransitDistance(
  place: { lat: number; lng: number },
): Promise<number> {
  const [subwayDist, busDist] = await Promise.all([
    fetchNearestCategoryDistance(place, "SW8", 1000),
    fetchNearestCategoryDistance(place, "BUS8", 500),
  ]);
  return Math.min(subwayDist, busDist);
}