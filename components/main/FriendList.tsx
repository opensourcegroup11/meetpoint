import FriendListFilter from "./FriendListFilter";

const friends = ["영걸", "영준", "지민", "민서"];

export default function FriendList() {
  return (
    <div className="bg-white rounded-2xl p-6 w-80 shadow-sm">
      <h2 className="text-xl font-bold mb-4">친구 목록</h2>

      <FriendListFilter />

      {friends.map((name) => (
        <a
          key={name}
          href="/chat"
          className="flex items-center justify-between py-3 border-b border-gray-100 px-2 rounded-lg hover:bg-[#EEEEFF]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <span className="text-gray-700">{name}</span>
          </div>

          <span className="text-gray-400">{">"}</span>
        </a>
      ))}
    </div>
  );
}