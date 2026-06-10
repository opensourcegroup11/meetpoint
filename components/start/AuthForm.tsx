"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "signup" | "login";

export default function AuthForm() {
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitAuth(mode: AuthMode) {
    setErrorMessage("");
    setIsSubmitting(true);

    const path = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";

    try {
      const response = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setErrorMessage(
          result.error?.message ??
            (mode === "signup"
              ? "회원가입 중 오류가 발생했습니다."
              : "로그인 중 오류가 발생했습니다."),
        );
        return;
      }

      router.push("/main");
      router.refresh();
    } catch {
      setErrorMessage("서버 연결 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg px-12 py-10 flex flex-col items-center gap-4 w-96">
      <span className="text-4xl">📍</span>

      <h1 className="text-2xl font-bold text-gray-900">
        Welcome to MeetPoint
      </h1>

      <p className="text-gray-400 text-sm">
        Enter your nickname and password to continue
      </p>

      <input
        type="text"
        value={nickname}
        onChange={(event) => setNickname(event.target.value)}
        placeholder="Enter nickname"
        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-600 outline-none"
      />

      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Enter password"
        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-600 outline-none"
      />

      {errorMessage ? (
        <p className="w-full text-sm text-red-500">{errorMessage}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 w-full">
        <button
          type="button"
          onClick={() => submitAuth("signup")}
          disabled={isSubmitting}
          className="bg-[#5B5BD6] text-white py-3 rounded-lg font-medium text-center disabled:opacity-60"
        >
          Sign up
        </button>

        <button
          type="button"
          onClick={() => submitAuth("login")}
          disabled={isSubmitting}
          className="border border-[#5B5BD6] text-[#5B5BD6] py-3 rounded-lg font-medium text-center disabled:opacity-60"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}