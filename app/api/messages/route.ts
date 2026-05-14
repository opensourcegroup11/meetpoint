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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function verifyFriendRelation(currentUserId: string, friendId: string) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("friends")
    .select("id")
    .eq("user_id", currentUserId)
    .eq("friend_id", friendId)
    .maybeSingle();

  if (error) {
    return { ok: false as const, status: 500, code: "INTERNAL_ERROR" };
  }

  if (!data) {
    return { ok: false as const, status: 403, code: "FORBIDDEN_RELATION" };
  }

  return { ok: true as const, relationId: data.id };
}

// 메시지 조회
export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUserFromCookie();

  if (!currentUser) {
    return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }

  const { searchParams } = new URL(req.url);

  const friendId = String(searchParams.get("friendId") ?? "").trim();
  const after = searchParams.get("after");
  const limitParam = searchParams.get("limit");

  if (!friendId || !isUuid(friendId)) {
    return fail(400, "INVALID_INPUT", "친구 ID 형식이 올바르지 않습니다.");
  }

  const limit = limitParam ? Number(limitParam) : 50;

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return fail(400, "INVALID_INPUT", "메시지 조회 개수가 올바르지 않습니다.");
  }

  if (after && Number.isNaN(Date.parse(after))) {
    return fail(400, "INVALID_INPUT", "after 날짜 형식이 올바르지 않습니다.");
  }

  const relation = await verifyFriendRelation(currentUser.userId, friendId);

  if (!relation.ok) {
    if (relation.code === "FORBIDDEN_RELATION") {
      return fail(403, "FORBIDDEN_RELATION", "친구 관계가 없는 사용자입니다.");
    }

    return fail(500, "INTERNAL_ERROR", "친구 관계 확인 중 오류가 발생했습니다.");
  }

  const supabase = getSupabaseAdminClient();

  let query = supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, created_at")
    .or(
      `and(sender_id.eq.${currentUser.userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUser.userId})`,
    )
    .order("created_at", { ascending: true })
    .limit(limit);

  if (after) {
    query = query.gt("created_at", after);
  }

  const { data, error } = await query;

  if (error) {
    return fail(500, "INTERNAL_ERROR", "메시지를 불러오지 못했습니다.");
  }

  const messages =
    data?.map((message) => ({
      id: message.id,
      senderId: message.sender_id,
      receiverId: message.receiver_id,
      content: message.content,
      createdAt: message.created_at,
    })) ?? [];

  const lastMessageCreatedAt =
    messages.length > 0 ? messages[messages.length - 1].createdAt : null;

  return ok({
    messages,
    lastMessageCreatedAt,
    pollingIntervalSec: 5,
  });
}

// 메시지 저장
export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUserFromCookie();

  if (!currentUser) {
    return fail(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }

  const body = await req.json().catch(() => ({}));

  const friendId = String(body.friendId ?? "").trim();
  const content = String(body.content ?? "").trim();

  if (!friendId || !isUuid(friendId)) {
    return fail(400, "INVALID_INPUT", "친구 ID 형식이 올바르지 않습니다.");
  }

  if (!content || content.length > 500) {
    return fail(400, "INVALID_INPUT", "메시지는 1자 이상 500자 이하로 입력해 주세요.");
  }

  const relation = await verifyFriendRelation(currentUser.userId, friendId);

  if (!relation.ok) {
    if (relation.code === "FORBIDDEN_RELATION") {
      return fail(403, "FORBIDDEN_RELATION", "친구 관계가 없는 사용자에게 메시지를 보낼 수 없습니다.");
    }

    return fail(500, "INTERNAL_ERROR", "친구 관계 확인 중 오류가 발생했습니다.");
  }

  const supabase = getSupabaseAdminClient();

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      sender_id: currentUser.userId,
      receiver_id: friendId,
      content,
    })
    .select("id, sender_id, receiver_id, content, created_at")
    .single();

  if (error || !message) {
    return fail(500, "INTERNAL_ERROR", "메시지 저장 중 오류가 발생했습니다.");
  }

  return ok(
    {
      message: {
        id: message.id,
        senderId: message.sender_id,
        receiverId: message.receiver_id,
        content: message.content,
        createdAt: message.created_at,
      },
    },
    201,
  );
}