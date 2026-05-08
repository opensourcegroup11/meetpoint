export default function FriendAddCard() {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-2">친구 추가하기</h2>
  
        <p className="text-gray-400 text-sm mb-4">
          닉네임으로 친구를 검색하고 추가해보세요.
        </p>
  
        <div className="flex gap-2">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1">
            <span>🔍</span>
            <input
              type="text"
              placeholder="닉네임을 입력하세요"
              className="outline-none text-gray-500 w-full"
            />
          </div>
  
          <button className="bg-[#5B5BD6] text-white px-6 py-2 rounded-lg">
            검색
          </button>
        </div>
      </div>
    );
  }