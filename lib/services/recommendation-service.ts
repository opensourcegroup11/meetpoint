import { haversineDistance, calculateMidpoint, type Coordinate } from "@/lib/utils/distance";
import { fetchKakaoKeyword, fetchNearestTransitDistance, type KakaoPlaceDocument } from "@/lib/kakao/local";

type Category = "cafe" | "meal" | "fun";

export type ScoredPlace = {
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

export type RecommendationResult = {
  mode: string;
  category: string;
  radius: number;
  midpoint: Coordinate;
  baseDistance: number;
  places: ScoredPlace[];
};

function getCategoryQueries(category: Category): string[] {
  if (category === "cafe") return ["카페", "디저트", "베이커리"];
  if (category === "meal") return ["식당", "맛집", "음식점"];
  return ["놀거리", "영화관", "보드게임카페"];
}

export function getCategoryMismatchDegree(
  category: Category,
  place: KakaoPlaceDocument,
): number {
  const text = `${place.place_name} ${place.category_name} ${place.category_group_name}`;

  if (category === "cafe") {
    if (text.includes("카페")) return 0;
    if (text.includes("브런치")) return 0.2;
    if (text.includes("디저트") || text.includes("베이커리") || text.includes("제과")) return 0.4;
    if (text.includes("음식점") || text.includes("식당") || text.includes("맛집")) return 0.8;
    return 1.0;
  }

  if (category === "meal") {
    if (
      text.includes("음식점") || text.includes("식당") ||
      text.includes("한식") || text.includes("중식") ||
      text.includes("일식") || text.includes("양식")
    ) return 0;
    if (text.includes("카페") || text.includes("디저트")) return 0.6;
    return 1.0;
  }

  // fun
  if (
    text.includes("영화") || text.includes("문화") || text.includes("공연") ||
    text.includes("오락") || text.includes("체험") || text.includes("보드게임") ||
    text.includes("관광")
  ) return 0;
  if (text.includes("카페")) return 0.4;
  if (text.includes("음식점") || text.includes("식당")) return 0.6;
  return 1.0;
}

function dedupePlaces(places: KakaoPlaceDocument[]): KakaoPlaceDocument[] {
  const map = new Map<string, KakaoPlaceDocument>();
  for (const place of places) {
    const key = place.id || `${place.place_name}-${place.x}-${place.y}`;
    if (!map.has(key)) map.set(key, place);
  }
  return Array.from(map.values());
}

function transitInconvenienceDegree(distMeters: number): number {
  if (distMeters <= 300) return 0;
  if (distMeters <= 500) return 0.25;
  if (distMeters <= 800) return 0.6;
  return 1.0;
}

export async function getRecommendations(
  departure: Coordinate,
  friendDeparture: Coordinate,
  category: Category,
  mode: string,
): Promise<RecommendationResult> {
  const midpoint = calculateMidpoint(departure, friendDeparture);
  const betweenDistance = haversineDistance(departure, friendDeparture);
  const baseDistance = betweenDistance / 2;

  const searchQueries = getCategoryQueries(category);

  let rawPlaces: KakaoPlaceDocument[] = [];
  let usedRadius = 1000;

  for (const radius of [1000, 2000, 3000]) {
    const results = await Promise.all(
      searchQueries.map((q) => fetchKakaoKeyword(q, midpoint, radius)),
    );
    rawPlaces = dedupePlaces(results.flat());
    usedRadius = radius;
    if (rawPlaces.length >= 5) break;
  }

  const candidates = rawPlaces.slice(0, 12);

  const placeLocations = candidates.map((place) => ({
    place,
    location: { lat: Number(place.y), lng: Number(place.x) } as Coordinate,
  }));

  const nearbyCounts = placeLocations.map(({ location }) =>
    placeLocations.filter(({ place: other, location: otherLoc }) => {
      return (
        haversineDistance(location, otherLoc) <= 500 &&
        getCategoryMismatchDegree(category, other) <= 0.6
      );
    }).length,
  );

  const maxNearbyCount = Math.max(...nearbyCounts, 1);

  const scoredPlaces = await Promise.all(
    placeLocations.map(async ({ place, location }, index) => {
      const distanceFromMe = haversineDistance(departure, location);
      const distanceFromFriend = haversineDistance(friendDeparture, location);
      const averageDistance = (distanceFromMe + distanceFromFriend) / 2;
      const distanceGap = Math.abs(distanceFromMe - distanceFromFriend);

      const mismatch = getCategoryMismatchDegree(category, place);
      const categoryPenalty = baseDistance * 0.15 * mismatch;

      const nearbyCount = nearbyCounts[index];
      const activityShortageDegree = 1 - nearbyCount / maxNearbyCount;
      const activityPenalty = baseDistance * 0.1 * activityShortageDegree;

      const transitDist = await fetchNearestTransitDistance(location);
      const transitPenalty = baseDistance * 0.15 * transitInconvenienceDegree(transitDist);

      const score =
        averageDistance + distanceGap + categoryPenalty + activityPenalty + transitPenalty;

      return {
        id: place.id || `${place.place_name}-${place.x}-${place.y}`,
        name: place.place_name,
        categoryName: place.category_name,
        address: place.road_address_name || place.address_name,
        phone: place.phone,
        placeUrl: place.place_url,
        lat: location.lat,
        lng: location.lng,
        distanceFromMidpoint: Math.round(haversineDistance(midpoint, location)),
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

  return {
    mode,
    category,
    radius: usedRadius,
    midpoint,
    baseDistance: Math.round(baseDistance),
    places: scoredPlaces.slice(0, 5),
  };
}