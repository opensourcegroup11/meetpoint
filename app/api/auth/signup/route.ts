import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  createUser,
  findUserByNormalizedNickname,
} from "@/lib/repositories/users";
import { createAuthToken, setAuthCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const nickname = String(body.nickname ?? "").trim();
    const password = String(body.password ?? "").trim();
    const nicknameNormalized = nickname.toLowerCase();

    if (nickname.length < 2 || nickname.length > 12) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_INPUT",
            message: "닉네임은 2자 이상 12자 이하로 입력해 주세요.",
          },
        },
        { status: 400 },
      );
    }

    if (password.length < 8 || password.length > 20) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_INPUT",
            message: "비밀번호는 8자 이상 20자 이하로 입력해 주세요.",
          },
        },
        { status: 400 },
      );
    }

    const existingUser = await findUserByNormalizedNickname(nicknameNormalized);

    if (existingUser) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "DUPLICATE_NICKNAME",
            message: "이미 사용 중인 닉네임입니다.",
          },
        },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await createUser({
      nickname,
      nicknameNormalized,
      passwordHash,
    });

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
    console.error("[signup error]", error);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "회원가입 처리 중 오류가 발생했습니다.",
        },
      },
      { status: 500 },
    );
  }
}