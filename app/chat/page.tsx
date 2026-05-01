export default function ChatPage() {
    return (
      <main className="min-h-screen bg-[#F5F5F5] flex flex-col">
        {/* 네비바 */}
        <header className="w-full flex items-center justify-between px-12 py-4 bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">📍</span>
            <span className="text-xl font-bold text-[#5B5BD6]">meetpoint</span>
          </div>
          <nav className="flex gap-10 text-gray-600">
            <a href="#">Home</a>
            <a href="#">Features</a>
            <a href="#">About us</a>
          </nav>
          <button className="bg-[#5B5BD6] text-white px-5 py-2 rounded-lg">
            sungeun
          </button>
        </header>
  
        {/* 메인 컨텐츠 */}
        <div className="flex gap-6 px-12 py-8">
  
          {/* 왼쪽: 친구 목록 */}
          <div className="bg-white rounded-2xl p-6 w-80 shadow-sm">
            <h2 className="text-xl font-bold mb-4">친구 목록</h2>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 mb-4">
              <span>🔍</span>
              <input type="text" placeholder="친구 이름 검색" className="outline-none text-gray-500 w-full" />
            </div>
            {[{name: '영걸', active: true}, {name: '영준', active: false}, {name: '지민', active: false}, {name: '민서', active: false}].map((friend) => (
              <div key={friend.name} className={`flex items-center justify-between py-3 border-b border-gray-100 px-2 rounded-lg ${friend.active ? 'bg-[#EEEEFF]' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  <span className="text-gray-700">{friend.name}</span>
                </div>
                <span className="text-gray-400">{'>'}</span>
              </div>
            ))}
          </div>
  
          {/* 오른쪽: 채팅창 */}
          <div className="bg-white rounded-2xl flex flex-col flex-1 shadow-sm overflow-hidden">
            {/* 채팅 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <span className="font-bold">영걸 님과의 채팅</span>
              </div>
              <button className="border border-[#5B5BD6] text-[#5B5BD6] px-4 py-1 rounded-lg text-sm">
                지도에서 위치 확인
              </button>
            </div>
  
            {/* 메시지 목록 */}
            <div className="flex-1 flex flex-col gap-4 px-6 py-4">
              <p className="text-center text-gray-400 text-sm">---오늘---</p>
  
              {/* 상대방 메시지 */}
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="bg-gray-100 rounded-2xl px-4 py-2 text-sm">지금 어디야?</div>
              </div>
  
              {/* 내 메시지 */}
              <div className="flex justify-end">
                <div className="bg-[#5B5BD6] text-white rounded-2xl px-4 py-2 text-sm">지금 학교에 있어</div>
              </div>
  
              {/* 상대방 메시지 */}
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="bg-gray-100 rounded-2xl px-4 py-2 text-sm">난 강남역 근처야</div>
              </div>
  
              {/* 내 메시지 */}
              <div className="flex justify-end">
                <div className="bg-[#5B5BD6] text-white rounded-2xl px-4 py-2 text-sm">그럼 우리 중간쯤에서 만나자</div>
              </div>
  
              {/* 상대방 메시지 */}
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="bg-gray-100 rounded-2xl px-4 py-2 text-sm">좋아 지도에서 중간 지점 확인해보자</div>
              </div>
            </div>
  
            {/* 입력창 */}
            <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-100">
              <input
                type="text"
                placeholder="메세지를 입력하세요."
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2 outline-none text-sm"
              />
              <button className="bg-[#5B5BD6] text-white px-6 py-2 rounded-lg text-sm">전송</button>
            </div>
          </div>
  
        </div>
      </main>
    )
  }