import { haversineDistance, calculateMidpoint, type Coordinate } from "@/lib/utils/distance";
import { fetchKakaoKeyword, fetchNearestTransitDistance, type KakaoPlaceDocument } from "@/lib/kakao/local";

type Category = "cafe" | "meal" | "fun";
type PlaceIntent = "cafe" | "meal" | "alcohol" | "fun" | "unknown";

const CATEGORY_WEIGHT = 0.2;
const ACTIVITY_WEIGHT = 0.1;
const TRANSIT_WEIGHT = 0.15;

const MIN_SCORING_CANDIDATE_COUNT = 12;
const MAX_SCORING_CANDIDATE_COUNT = 15;
const RECOMMENDATION_RESULT_COUNT = 5;

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
  if (category === "cafe") {
    return ["카페", "커피전문점", "디저트카페"];
  }

  if (category === "meal") {
    return ["식당", "한식", "분식", "일식", "양식"];
  }

  return ["놀거리", "영화관", "보드게임카페", "노래방"];
}

function getPlaceText(place: KakaoPlaceDocument): string {
  return [
    place.place_name ?? "",
    place.category_name ?? "",
    place.category_group_name ?? "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function isAlcoholPlace(text: string): boolean {
  return (
    text.includes("술집") ||
    text.includes("주점") ||
    text.includes("호프") ||
    text.includes("포차") ||
    text.includes("이자카야") ||
    text.includes("오뎅바") ||
    text.includes("와인바") ||
    text.includes("맥주") ||
    text.includes("칵테일") ||
    text.includes("펍")
  );
}

function classifyPlaceIntent(place: KakaoPlaceDocument): PlaceIntent {
  const text = getPlaceText(place);

  // 보드게임카페처럼 "카페"가 들어가지만 실제 목적은 놀거리인 경우를 먼저 처리
  if (
    text.includes("보드게임카페") ||
    text.includes("방탈출") ||
    text.includes("노래방") ||
    text.includes("영화관") ||
    text.includes("볼링") ||
    text.includes("pc방") ||
    text.includes("피시방") ||
    text.includes("오락") ||
    text.includes("공연") ||
    text.includes("문화") ||
    text.includes("체험") ||
    text.includes("관광")
  ) {
    return "fun";
  }

  // 카페/디저트
  if (
    text.includes("카페") ||
    text.includes("커피") ||
    text.includes("커피전문점") ||
    text.includes("디저트") ||
    text.includes("베이커리") ||
    text.includes("제과") ||
    text.includes("빵집")
  ) {
    return "cafe";
  }

  // 술집/주점 계열
  // 주의: "바" 한 글자는 너무 넓어서 사용하지 않음
  if (isAlcoholPlace(text)) {
    return "alcohol";
  }

  // 실제 식사 장소
  if (
    text.includes("한식") ||
    text.includes("중식") ||
    text.includes("일식") ||
    text.includes("양식") ||
    text.includes("분식") ||
    text.includes("식당") ||
    text.includes("맛집") ||
    text.includes("고기") ||
    text.includes("갈비") ||
    text.includes("국밥") ||
    text.includes("찌개") ||
    text.includes("초밥") ||
    text.includes("라멘") ||
    text.includes("돈까스") ||
    text.includes("파스타") ||
    text.includes("피자") ||
    text.includes("햄버거") ||
    text.includes("패스트푸드") ||
    text.includes("뷔페") ||
    text.includes("치킨") ||
    text.includes("음식점")
  ) {
    return "meal";
  }

  return "unknown";
}

export function getCategoryMismatchDegree(
  category: Category,
  place: KakaoPlaceDocument,
): number {
  const intent = classifyPlaceIntent(place);

  if (category === "cafe") {
    if (intent === "cafe") return 0;
    if (intent === "fun") return 0.5;
    if (intent === "meal") return 0.8;
    if (intent === "alcohol") return 0.9;
    return 1.0;
  }

  if (category === "meal") {
    if (intent === "meal") return 0;
    if (intent === "cafe") return 0.6;
    if (intent === "alcohol") return 0.7;
    if (intent === "fun") return 0.9;
    return 1.0;
  }

  // category === "fun"
  if (intent === "fun") return 0;
  if (intent === "cafe") return 0.4;
  if (intent === "meal") return 0.6;
  if (intent === "alcohol") return 0.7;
  return 1.0;
}

function isRelevantForActivity(
  category: Category,
  place: KakaoPlaceDocument,
): boolean {
  const intent = classifyPlaceIntent(place);

  if (category === "cafe") {
    return intent === "cafe";
  }

  if (category === "meal") {
    return intent === "meal";
  }

  if (category === "fun") {
    return intent === "fun";
  }

  return false;
}

function dedupePlaces(places: KakaoPlaceDocument[]): KakaoPlaceDocument[] {
  const map = new Map<string, KakaoPlaceDocument>();

  for (const place of places) {
    const key = place.id || `${place.place_name}-${place.x}-${place.y}`;

    if (!map.has(key)) {
      map.set(key, place);
    }
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

    if (rawPlaces.length >= MIN_SCORING_CANDIDATE_COUNT) {
      break;
    }
  }

  const candidates = rawPlaces
    .map((place) => {
      const location = {
        lat: Number(place.y),
        lng: Number(place.x),
      } as Coordinate;

      return {
        place,
        distanceFromMidpoint: haversineDistance(midpoint, location),
      };
    })
    .sort((a, b) => a.distanceFromMidpoint - b.distanceFromMidpoint)
    .slice(0, MAX_SCORING_CANDIDATE_COUNT)
    .map(({ place }) => place);

  const placeLocations = candidates.map((place) => ({
    place,
    location: {
      lat: Number(place.y),
      lng: Number(place.x),
    } as Coordinate,
  }));

  const nearbyCounts = placeLocations.map(({ location }) =>
    placeLocations.filter(({ place: other, location: otherLoc }) => {
      return (
        haversineDistance(location, otherLoc) <= 500 &&
        isRelevantForActivity(category, other)
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
      const categoryPenalty = baseDistance * CATEGORY_WEIGHT * mismatch;

      const nearbyCount = nearbyCounts[index];
      const activityShortageDegree = 1 - nearbyCount / maxNearbyCount;
      const activityPenalty = baseDistance * ACTIVITY_WEIGHT * activityShortageDegree;

      const transitDist = await fetchNearestTransitDistance(location);
      const transitPenalty =
        baseDistance * TRANSIT_WEIGHT * transitInconvenienceDegree(transitDist);

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

  scoredPlaces.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    if (a.distanceGap !== b.distanceGap) return a.distanceGap - b.distanceGap;
    if (a.averageDistance !== b.averageDistance) {
      return a.averageDistance - b.averageDistance;
    }
    return a.name.localeCompare(b.name, "ko");
  });

  return {
    mode,
    category,
    radius: usedRadius,
    midpoint,
    baseDistance: Math.round(baseDistance),
    places: scoredPlaces.slice(0, RECOMMENDATION_RESULT_COUNT),
  };
}