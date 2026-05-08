export default function MapCard() {
    return (
      <div className="bg-[#EEEEFF] rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold mb-2">지도로 친구 위치 확인하기</h2>
  
          <p className="text-gray-500 text-sm mb-4">
            친구들의 현재 위치를 지도에서 확인하고,
            <br />
            만날 장소를 함께 정해보세요.
          </p>
  
          <button className="bg-[#5B5BD6] text-white px-6 py-2 rounded-lg">
            지도 보기 →
          </button>
        </div>
  
        <div className="text-6xl">🗺️</div>
      </div>
    );
  }