export async function GET() {
  return Response.json({
    ok: true,
    data: {
      messages: [],
      pollingIntervalSec: 5,
    },
  });
}

export async function POST() {
  return Response.json({
    ok: true,
    data: {
      message: "메시지 저장 API 구현 예정",
    },
  });
}
