export default function LoginPage() {
    return (
      <main className="min-h-screen bg-[#EEEEFF] flex flex-col">
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
            sign in
          </button>
        </header>
  
        {/* 가운데 카드 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg px-12 py-10 flex flex-col items-center gap-4 w-96">
            <span className="text-4xl">📍</span>
            <h1 className="text-2xl font-bold text-gray-900">Welcome to MeetPoint</h1>
            <p className="text-gray-400 text-sm">Enter your nickname to continue</p>
            <input
              type="text"
              placeholder="Enter nickname"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-600 outline-none"
            />
            <button className="w-full bg-[#5B5BD6] text-white py-3 rounded-lg font-medium">
              Continue →
            </button>
          </div>
        </div>
      </main>
    )
  }