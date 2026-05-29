"use client";

type FriendListFilterProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function FriendListFilter({ value, onChange }: FriendListFilterProps) {
  return (
    <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 mb-4">
      <span>🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="친구 이름 검색"
        className="outline-none text-gray-500 w-full"
      />
    </div>
  );
}