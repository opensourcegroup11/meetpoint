export type UserSummary = {
  id: string;
  nickname: string;
  lat: number | null;
  lng: number | null;
  locationUpdatedAt: string | null;
};

export type FriendSummary = UserSummary & {
  relationId?: string;
};

export type MessageItem = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

export type RecommendationPlace = {
  name: string;
  category: string;
  lat: number;
  lng: number;
  distanceA: number;
  distanceB: number;
  averageDistance: number;
  distanceGap: number;
  score: number;
};

export type RecommendationResult = {
  midpoint: { lat: number; lng: number };
  places: RecommendationPlace[];
};
