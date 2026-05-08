export async function GET() {
  return Response.json({
    ok: true,
    data: {
      friends: [],
    },
  });
}

export async function POST() {
  return Response.json({
    ok: true,
    data: {
      message: "친구 추가 API 구현 예정",
    },
  });
}
