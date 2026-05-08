export default function MessageInput() {
    return (
      <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-100">
        <input
          type="text"
          placeholder="메세지를 입력하세요."
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2 outline-none text-sm"
        />
  
        <button className="bg-[#5B5BD6] text-white px-6 py-2 rounded-lg text-sm">
          전송
        </button>
      </div>
    );
  }