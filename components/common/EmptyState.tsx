type EmptyStateProps = {
  message?: string;
};

export default function EmptyState({
  message = "표시할 데이터가 없습니다.",
}: EmptyStateProps) {
  return <p className="text-sm text-gray-400">{message}</p>;
}
