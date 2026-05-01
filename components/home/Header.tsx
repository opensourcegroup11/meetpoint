export default function Header() {
    return (
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
    )
  }