type FriendJoinRow = {
  id: string;
  friend: {
    id: string;
    nickname: string;
    lat: number | null;
    lng: number | null;
    location_updated_at: string | null;
  } | null;
};
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

// 친구 목록 조회
export async function GET() {
  const currentUser = await getCurrentUserFromCookie();

  if (!currentUser) {
    return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }

  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("friends")
    .select(
      `
      id,
      friend:users!friends_friend_id_fkey (
        id,
        nickname,
        lat,
        lng,
        location_updated_at
      )
    `,
    )
    .eq("user_id", currentUser.userId);

  if (error) {
    return fail(500, "INTERNAL_ERROR", "친구 목록을 불러오지 못했습니다.");
  }

  const rows = (data ?? []) as unknown as FriendJoinRow[];

const friends = rows
  .filter((row) => row.friend)
  .map((row) => ({
    relationId: row.id,
    id: row.friend!.id,
    nickname: row.friend!.nickname,
    lat: row.friend!.lat,
    lng: row.friend!.lng,
    locationUpdatedAt: row.friend!.location_updated_at,
  }));

  return ok({ friends });
}

// 친구 추가
export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUserFromCookie();

  if (!currentUser) {
    return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }

  const body = await req.json();
  const friendNickname = String(body.friendNickname ?? "").trim();

  if (!friendNickname) {
    return fail(400, "INVALID_INPUT", "친구 닉네임을 입력해 주세요.");
  }

  const friendNicknameNormalized = friendNickname.toLowerCase();

  const supabase = getSupabaseAdminClient();

  const { data: friendUser, error: findError } = await supabase
    .from("users")
    .select("id, nickname, lat, lng, location_updated_at")
    .eq("nickname_normalized", friendNicknameNormalized)
    .maybeSingle();

  if (findError) {
    return fail(500, "INTERNAL_ERROR", "친구를 조회하는 중 오류가 발생했습니다.");
  }

  if (!friendUser) {
    return fail(404, "FRIEND_NOT_FOUND", "해당 닉네임의 사용자를 찾을 수 없습니다.");
  }

  if (friendUser.id === currentUser.userId) {
    return fail(400, "INVALID_INPUT", "자기 자신은 친구로 추가할 수 없습니다.");
  }

  const { data: existingRelation, error: existingError } = await supabase
    .from("friends")
    .select("id")
    .eq("user_id", currentUser.userId)
    .eq("friend_id", friendUser.id)
    .maybeSingle();

  if (existingError) {
    return fail(500, "INTERNAL_ERROR", "친구 관계 확인 중 오류가 발생했습니다.");
  }

  if (existingRelation) {
    return ok({
      relationId: existingRelation.id,
      friend: {
        id: friendUser.id,
        nickname: friendUser.nickname,
        lat: friendUser.lat,
        lng: friendUser.lng,
        locationUpdatedAt: friendUser.location_updated_at,
      },
    });
  }

  const { data: insertedRelations, error: insertError } = await supabase
    .from("friends")
    .insert([
      {
        user_id: currentUser.userId,
        friend_id: friendUser.id,
      },
      {
        user_id: friendUser.id,
        friend_id: currentUser.userId,
      },
    ])
    .select("id, user_id, friend_id");

  if (insertError) {
    return fail(500, "INTERNAL_ERROR", "친구 추가 중 오류가 발생했습니다.");
  }

  const myRelation = insertedRelations?.find(
    (relation) => relation.user_id === currentUser.userId,
  );

  return ok(
    {
      relationId: myRelation?.id,
      friend: {
        id: friendUser.id,
        nickname: friendUser.nickname,
        lat: friendUser.lat,
        lng: friendUser.lng,
        locationUpdatedAt: friendUser.location_updated_at,
      },
    },
    201,
  );
}