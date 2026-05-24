import { getCurrentUserFromCookie } from "@/lib/auth/session";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

function isValidLatLng(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

// 내 마지막 공유 위치 조회
export async function GET() {
  try {
    const currentUser = await getCurrentUserFromCookie();

    if (!currentUser) {
      return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");
    }

    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("users")
      .select("lat, lng, location_updated_at")
      .eq("id", currentUser.userId)
      .maybeSingle();

    if (error) {
      console.error("GET /api/location Supabase error:", error);
      return fail(500, "INTERNAL_ERROR", "위치 정보를 불러오지 못했습니다.");
    }

    if (!data) {
      return fail(404, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다.");
    }

    const hasLocation = data.lat !== null && data.lng !== null;

    return ok({
      location: hasLocation
        ? {
            lat: data.lat,
            lng: data.lng,
            locationUpdatedAt: data.location_updated_at,
          }
        : null,
    });
  } catch (error) {
    console.error("GET /api/location error:", error);
    return fail(500, "INTERNAL_ERROR", "위치 조회 중 오류가 발생했습니다.");
  }
}

// 내 현재 위치 저장
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromCookie();

    if (!currentUser) {
      return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");
    }

    const body = await req.json().catch(() => ({}));

    const lat = Number(body.lat);
    const lng = Number(body.lng);

    if (!isValidLatLng(lat, lng)) {
      return fail(400, "INVALID_INPUT", "위도와 경도 값이 올바르지 않습니다.");
    }

    const supabase = getSupabaseAdminClient();

    const locationUpdatedAt = new Date().toISOString();

    const { data, error } = await supabase
      .from("users")
      .update({
        lat,
        lng,
        location_updated_at: locationUpdatedAt,
      })
      .eq("id", currentUser.userId)
      .select("lat, lng, location_updated_at")
      .single();

    if (error || !data) {
      console.error("POST /api/location Supabase error:", error);
      return fail(500, "INTERNAL_ERROR", "위치 저장 중 오류가 발생했습니다.");
    }

    return ok({
      location: {
        lat: data.lat,
        lng: data.lng,
        locationUpdatedAt: data.location_updated_at,
      },
    });
  } catch (error) {
    console.error("POST /api/location error:", error);
    return fail(500, "INTERNAL_ERROR", "위치 저장 중 오류가 발생했습니다.");
  }
}