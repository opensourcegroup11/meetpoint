export default function FriendListFilter() {
    return (
      <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 mb-4">
        <span>🔍</span>
        <input
          type="text"
          placeholder="친구 이름 검색"
          className="outline-none text-gray-500 w-full"
        />
      </div>
    );
  }