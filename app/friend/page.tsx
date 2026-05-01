export default function FriendPage() {
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
            {['영걸', '영준', '지민', '민서'].map((name) => (
              <div key={name} className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  <span className="text-gray-700">{name}</span>
                </div>
                <span className="text-gray-400">{'>'}</span>
              </div>
            ))}
          </div>
  
          {/* 오른쪽 */}
          <div className="flex flex-col gap-6 flex-1">
  
            {/* 친구 추가하기 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-2">친구 추가하기</h2>
              <p className="text-gray-400 text-sm mb-4">닉네임으로 친구를 검색하고 추가해보세요.</p>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1">
                  <span>🔍</span>
                  <input type="text" placeholder="닉네임을 입력하세요" className="outline-none text-gray-500 w-full" />
                </div>
                <button className="bg-[#5B5BD6] text-white px-6 py-2 rounded-lg">검색</button>
              </div>
            </div>
  
            {/* 지도 배너 */}
            <div className="bg-[#EEEEFF] rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">지도로 친구 위치 확인하기</h2>
                <p className="text-gray-500 text-sm mb-4">친구들의 현재 위치를 지도에서 확인하고,<br />만날 장소를 함께 정해보세요.</p>
                <button className="bg-[#5B5BD6] text-white px-6 py-2 rounded-lg">지도 보기 →</button>
              </div>
              <div className="text-6xl">🗺️</div>
            </div>
  
          </div>
        </div>
      </main>
    )
  }