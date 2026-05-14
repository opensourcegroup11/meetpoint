import { clearAuthCookie } from "@/lib/auth/session";

export async function POST() {
  await clearAuthCookie();

  return Response.json({
    ok: true,
    data: {
      cleared: true,
    },
  });
}