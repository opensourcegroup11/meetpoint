import { getCurrentUserFromCookie } from "@/lib/auth/session";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getRecommendations } from "@/lib/services/recommendation-service";
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

function ok(data: unknown, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

function fail(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
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
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}

function toLocation(row: UserLocationRow | undefined): LocationPoint | null {
  if (!row) return null;
  if (row.lat == null || row.lng == null) return null;
  return { lat: row.lat, lng: row.lng };
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
        ? { lat: Number(body.departure.lat), lng: Number(body.departure.lng) }
        : mySavedLocation;

    const friendDeparture =
      mode === "later" && isValidLocation(body.friendDeparture)
        ? { lat: Number(body.friendDeparture.lat), lng: Number(body.friendDeparture.lng) }
        : friendSavedLocation;

    if (!departure || !friendDeparture) {
      return fail(
        400,
        "LOCATION_REQUIRED",
        "내 위치와 친구 위치가 모두 필요합니다. 먼저 위치를 공유해 주세요.",
      );
    }

    const result = await getRecommendations(departure, friendDeparture, category, mode);
    return ok(result);

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