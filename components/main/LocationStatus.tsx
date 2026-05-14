type LocationStatusProps = {
  locationUpdatedAt: string | null;
  error: string | null;
  isSharing: boolean;
};

export default function LocationStatus({
  locationUpdatedAt,
  error,
  isSharing,
}: LocationStatusProps) {
  if (isSharing) {
    return <p className="text-sm text-gray-500">위치를 저장하는 중...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  if (!locationUpdatedAt) {
    return (
      <p className="text-sm text-gray-500">
        마지막 위치 공유: 아직 없음
      </p>
    );
  }

  return (
    <p className="text-sm text-gray-500">
      마지막 위치 공유:{" "}
      {new Date(locationUpdatedAt).toLocaleString("ko-KR")}
    </p>
  );
}