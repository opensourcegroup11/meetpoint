export async function GET() {
  return Response.json({
    ok: true,
    data: {
      midpoint: null,
      places: [],
    },
  });
}
