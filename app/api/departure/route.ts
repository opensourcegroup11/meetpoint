import { getCurrentUserFromCookie } from "@/lib/auth/session";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function ok(data: unknown, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

function fail(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromCookie();
    if (!currentUser) return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");

    const friendId = req.nextUrl.searchParams.get("friendId");
    if (!friendId) return fail(400, "INVALID_INPUT", "friendId가 필요합니다.");

    const supabase = getSupabaseAdminClient();

    // 내 출발 위치
    const { data: myDeparture, error: myError } = await (supabase as any)
      .from("departure_locations")
      .select("*")
      .eq("user_id", currentUser.userId)
      .eq("friend_id", friendId)
      .maybeSingle();

    if (myError) return fail(500, "INTERNAL_ERROR", "내 위치 조회 실패");

    // 친구 출발 위치 (친구가 나와의 약속을 위해 저장한 위치)
    const { data: friendDeparture, error: friendError } = await (supabase as any)
      .from("departure_locations")
      .select("*")
      .eq("user_id", friendId)
      .eq("friend_id", currentUser.userId)
      .maybeSingle();

    if (friendError) return fail(500, "INTERNAL_ERROR", "친구 위치 조회 실패");

    return ok({
      departure: myDeparture ?? null,
      friendDeparture: friendDeparture ?? null,
    });
  } catch {
    return fail(500, "INTERNAL_ERROR", "오류가 발생했습니다.");
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromCookie();
    if (!currentUser) return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");

    const body = await req.json().catch(() => ({}));
    const { friendId, lat, lng, address } = body;

    if (!friendId || lat == null || lng == null || !address) {
      return fail(400, "INVALID_INPUT", "필수 값이 누락되었습니다.");
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await (supabase as any)
      .from("departure_locations")
      .upsert(
        {
          user_id: currentUser.userId,
          friend_id: friendId,
          lat,
          lng,
          address,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,friend_id" },
      )
      .select()
      .single();

    if (error) {
      console.error("departure POST error:", error);
      return fail(500, "INTERNAL_ERROR", "저장 실패");
    }

    return ok({ departure: data });
  } catch {
    return fail(500, "INTERNAL_ERROR", "오류가 발생했습니다.");
  }
}