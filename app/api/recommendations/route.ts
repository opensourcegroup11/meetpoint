import { getCurrentUserFromCookie } from "@/lib/auth/session";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Mode = "now" | "later";
type Category = "cafe" | "meal" | "fun";

type LocationPoint = {
  lat: number;
  lng: number;
};

type UserLocationRow = {
  id: string;
  nickname: string;
  lat: number | null;
  lng: number | null;
  location_updated_at: string | null;
};

type KakaoPlaceDocument = {
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

function ok(data: unknown, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

function fail(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message },
    },
    { status },
  );
}

function isMode(value: unknown): value is Mode {
  return value === "now" || value === "later";
}

function isCategory(value: unknown): value is Category {
  return value === "cafe" || value === "meal" || value === "fun";
}

function isValidLocation(location: unknown): location is LocationPoint {
  if (!location || typeof location !== "object") return false;

  const value = location as { lat?: unknown; lng?: unknown };

  const lat = Number(value.lat);
  const lng = Number(value.lng);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function toLocation(row: UserLocationRow | undefined): LocationPoint | null {
  if (!row) return null;
  if (row.lat == null || row.lng == null) return null;

  return {
    lat: row.lat,
    lng: row.lng,
  };
}

function getMidpoint(a: LocationPoint, b: LocationPoint): LocationPoint {
  return {
    lat: (a.lat + b.lat) / 2,
    lng: (a.lng + b.lng) / 2,
  };
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(a: LocationPoint, b: LocationPoint) {
  const earthRadius = 6371000;

  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);

  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return 2 * earthRadius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function getCategoryQueries(category: Category) {
  if (category === "cafe") {
    return ["카페", "디저트", "베이커리"];
  }

  if (category === "meal") {
    return ["식당", "맛집", "음식점"];
  }

  return ["놀거리", "영화관", "보드게임카페"];
}

function getCategoryMismatchDegree(category: Category, place: KakaoPlaceDocument) {
  const text = `${place.place_name} ${place.category_name} ${place.category_group_name}`;

  if (category === "cafe") {
    if (text.includes("카페")) return 0;
    if (text.includes("브런치")) return 0.2;
    if (text.includes("디저트") || text.includes("베이커리") || text.includes("제과")) {
      return 0.4;
    }
    if (text.includes("음식점") || text.includes("식당") || text.includes("맛집")) {
      return 0.8;
    }
    return 1.0;
  }

  if (category === "meal") {
    if (
      text.includes("음식점") ||
      text.includes("식당") ||
      text.includes("맛집") ||
      text.includes("한식") ||
      text.includes("중식") ||
      text.includes("일식") ||
      text.includes("양식")
    ) {
      return 0;
    }
    if (text.includes("카페") || text.includes("디저트")) return 0.6;
    return 1.0;
  }

  if (
    text.includes("영화") ||
    text.includes("문화") ||
    text.includes("공연") ||
    text.includes("오락") ||
    text.includes("체험") ||
    text.includes("보드게임") ||
    text.includes("관광")
  ) {
    return 0;
  }

  if (text.includes("카페")) return 0.4;
  if (text.includes("음식점") || text.includes("식당")) return 0.6;

  return 1.0;
}

async function searchKakaoPlaces(
  query: string,
  center: LocationPoint,
  radius: number,
) {
  const restKey = process.env.KAKAO_LOCAL_REST_API_KEY;

  if (!restKey) {
    throw new Error("KAKAO_LOCAL_REST_API_KEY가 설정되지 않았습니다.");
  }

  const params = new URLSearchParams({
    query,
    x: String(center.lng),
    y: String(center.lat),
    radius: String(radius),
    size: "15",
    sort: "distance",
  });

  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?${params.toString()}`,
    {
      headers: {
        Authorization: `KakaoAK ${restKey}`,
      },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error(`Kakao Local API 호출 실패: ${res.status}`);
  }

  const json = (await res.json()) as KakaoSearchResponse;
  return json.documents;
}

async function getTransitInconvenience(place: LocationPoint) {
  const restKey = process.env.KAKAO_LOCAL_REST_API_KEY;

  if (!restKey) {
    return 0.6;
  }

  try {
    const params = new URLSearchParams({
      category_group_code: "SW8",
      x: String(place.lng),
      y: String(place.lat),
      radius: "800",
      size: "1",
      sort: "distance",
    });

    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/category.json?${params.toString()}`,
      {
        headers: {
          Authorization: `KakaoAK ${restKey}`,
        },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      return 0.6;
    }

    const json = (await res.json()) as KakaoSearchResponse;
    const nearestDistance = Number(json.documents[0]?.distance ?? 9999);

    if (nearestDistance <= 300) return 0;
    if (nearestDistance <= 500) return 0.25;
    if (nearestDistance <= 800) return 0.6;

    return 1.0;
  } catch {
    return 0.6;
  }
}

function dedupePlaces(places: KakaoPlaceDocument[]) {
  const map = new Map<string, KakaoPlaceDocument>();

  for (const place of places) {
    const key = place.id || `${place.place_name}-${place.x}-${place.y}`;

    if (!map.has(key)) {
      map.set(key, place);
    }
  }

  return Array.from(map.values());
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromCookie();

    if (!currentUser) {
      return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");
    }

    const body = await req.json().catch(() => ({}));

    const friendId = String(body.friendId ?? "");
    const mode = body.mode;
    const category = body.category;

    if (!friendId) {
      return fail(400, "INVALID_INPUT", "친구를 선택해 주세요.");
    }

    if (!isMode(mode)) {
      return fail(400, "INVALID_MODE", "만남 모드 값이 올바르지 않습니다.");
    }

    if (!isCategory(category)) {
      return fail(400, "INVALID_CATEGORY", "추천 목적을 선택해 주세요.");
    }

    const supabase = getSupabaseAdminClient();

    const { data: relation, error: relationError } = await supabase
      .from("friends")
      .select("id")
      .eq("user_id", currentUser.userId)
      .eq("friend_id", friendId)
      .maybeSingle();

    if (relationError) {
      console.error("friend relation error:", relationError);
      return fail(500, "INTERNAL_ERROR", "친구 관계 확인 중 오류가 발생했습니다.");
    }

    if (!relation) {
      return fail(403, "FORBIDDEN", "친구 관계가 확인되지 않았습니다.");
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, nickname, lat, lng, location_updated_at")
      .in("id", [currentUser.userId, friendId]);

    if (usersError) {
      console.error("users location error:", usersError);
      return fail(500, "INTERNAL_ERROR", "위치 정보를 불러오지 못했습니다.");
    }

    const rows = (users ?? []) as UserLocationRow[];

    const me = rows.find((row) => row.id === currentUser.userId);
    const friend = rows.find((row) => row.id === friendId);

    const mySavedLocation = toLocation(me);
    const friendSavedLocation = toLocation(friend);

    const departure =
      mode === "later" && isValidLocation(body.departure)
        ? {
            lat: Number(body.departure.lat),
            lng: Number(body.departure.lng),
          }
        : mySavedLocation;

    const friendDeparture =
      mode === "later" && isValidLocation(body.friendDeparture)
        ? {
            lat: Number(body.friendDeparture.lat),
            lng: Number(body.friendDeparture.lng),
          }
        : friendSavedLocation;

    if (!departure || !friendDeparture) {
      return fail(
        400,
        "LOCATION_REQUIRED",
        "내 위치와 친구 위치가 모두 필요합니다. 먼저 위치를 공유해 주세요.",
      );
    }

    const midpoint = getMidpoint(departure, friendDeparture);
    const betweenDistance = getDistanceMeters(departure, friendDeparture);
    const baseDistance = betweenDistance / 2;

    const searchQueries = getCategoryQueries(category);

    const placesByRadius = [1000, 2000, 3000];
    let rawPlaces: KakaoPlaceDocument[] = [];
    let usedRadius = 1000;

    for (const radius of placesByRadius) {
      const results = await Promise.all(
        searchQueries.map((query) => searchKakaoPlaces(query, midpoint, radius)),
      );

      rawPlaces = dedupePlaces(results.flat());
      usedRadius = radius;

      if (rawPlaces.length >= 5) {
        break;
      }
    }

    if (rawPlaces.length === 0) {
      return fail(
        404,
        "NO_PLACES",
        "중심점 주변에서 추천할 장소를 찾지 못했습니다.",
      );
    }

    const candidates = rawPlaces.slice(0, 12);

    const placeLocations = candidates.map((place) => ({
      place,
      location: {
        lat: Number(place.y),
        lng: Number(place.x),
      },
    }));

    const nearbyCounts = placeLocations.map(({ place, location }) => {
      return placeLocations.filter((other) => {
        const distance = getDistanceMeters(location, other.location);
        const mismatch = getCategoryMismatchDegree(category, other.place);

        return distance <= 500 && mismatch <= 0.6;
      }).length;
    });

    const maxNearbyCount = Math.max(...nearbyCounts, 1);

    const scoredPlaces = await Promise.all(
      placeLocations.map(async ({ place, location }, index) => {
        const distanceFromMe = getDistanceMeters(departure, location);
        const distanceFromFriend = getDistanceMeters(friendDeparture, location);

        const averageDistance = (distanceFromMe + distanceFromFriend) / 2;
        const distanceGap = Math.abs(distanceFromMe - distanceFromFriend);

        const categoryMismatchDegree = getCategoryMismatchDegree(category, place);
        const categoryPenalty = baseDistance * 0.15 * categoryMismatchDegree;

        const nearbyCount = nearbyCounts[index];
        const activityShortageDegree = 1 - nearbyCount / maxNearbyCount;
        const activityPenalty = baseDistance * 0.1 * activityShortageDegree;

        const transitInconvenienceDegree = await getTransitInconvenience(location);
        const transitPenalty = baseDistance * 0.15 * transitInconvenienceDegree;

        const score =
          averageDistance +
          distanceGap +
          categoryPenalty +
          activityPenalty +
          transitPenalty;

        return {
          id: place.id || `${place.place_name}-${place.x}-${place.y}`,
          name: place.place_name,
          categoryName: place.category_name,
          address: place.road_address_name || place.address_name,
          phone: place.phone,
          placeUrl: place.place_url,
          lat: location.lat,
          lng: location.lng,
          distanceFromMidpoint: Math.round(getDistanceMeters(midpoint, location)),
          distanceFromMe: Math.round(distanceFromMe),
          distanceFromFriend: Math.round(distanceFromFriend),
          averageDistance: Math.round(averageDistance),
          distanceGap: Math.round(distanceGap),
          nearbyCount,
          categoryPenalty: Math.round(categoryPenalty),
          activityPenalty: Math.round(activityPenalty),
          transitPenalty: Math.round(transitPenalty),
          score: Math.round(score),
        };
      }),
    );

    scoredPlaces.sort((a, b) => a.score - b.score);

    return ok({
      mode,
      category,
      radius: usedRadius,
      midpoint: {
        lat: midpoint.lat,
        lng: midpoint.lng,
      },
      baseDistance: Math.round(baseDistance),
      places: scoredPlaces.slice(0, 5),
    });
  } catch (error) {
    console.error("POST /api/recommendations error:", error);

    return fail(
      500,
      "INTERNAL_ERROR",
      error instanceof Error
        ? error.message
        : "추천 장소를 불러오는 중 오류가 발생했습니다.",
    );
  }
}