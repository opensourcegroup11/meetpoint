// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { findUserByNormalizedNickname } from "@/lib/repositories/users";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const nickname = String(body.nickname ?? "").trim();
  const nicknameNormalized = nickname.toLowerCase();

  const existingUser = await findUserByNormalizedNickname(nicknameNormalized);

  if (existingUser) {
    return NextResponse.json(
      { error: { code: "DUPLICATE_NICKNAME", message: "이미 사용 중인 닉네임입니다." } },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true });
}