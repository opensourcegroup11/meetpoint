export default function AuthForm() {
    return (
      <div className="bg-white rounded-2xl shadow-lg px-12 py-10 flex flex-col items-center gap-4 w-96">
        <span className="text-4xl">📍</span>
  
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome to MeetPoint
        </h1>
  
        <p className="text-gray-400 text-sm">
          Enter your nickname to continue
        </p>
  
        <input
          type="text"
          placeholder="Enter nickname"
          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-600 outline-none"
        />
  
        <a
          href="/main"
          className="w-full bg-[#5B5BD6] text-white py-3 rounded-lg font-medium text-center"
        >
          Continue →
        </a>
      </div>
    );
  }