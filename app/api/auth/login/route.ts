import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserForLogin } from "@/lib/repositories/users";
import { createAuthToken, setAuthCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const nickname = String(body.nickname ?? "").trim();
    const password = String(body.password ?? "").trim();
    const nicknameNormalized = nickname.toLowerCase();

    if (!nickname || !password) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_INPUT",
            message: "닉네임과 비밀번호를 입력해 주세요.",
          },
        },
        { status: 400 },
      );
    }

    const user = await findUserForLogin(nicknameNormalized);

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "닉네임 또는 비밀번호가 올바르지 않습니다.",
          },
        },
        { status: 401 },
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "닉네임 또는 비밀번호가 올바르지 않습니다.",
          },
        },
        { status: 401 },
      );
    }

    const token = createAuthToken({
      userId: user.id,
      nickname: user.nickname,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      ok: true,
      data: {
        user: {
          id: user.id,
          nickname: user.nickname,
          lat: user.lat,
          lng: user.lng,
          locationUpdatedAt: user.location_updated_at,
        },
      },
    });
  } catch (error) {
    console.error("[login error]", error);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "로그인 처리 중 오류가 발생했습니다.",
        },
      },
      { status: 500 },
    );
  }
}