export default function HeroSection() {
    return (
      <section className="flex items-center justify-between px-20 py-24 bg-[#EEEEFF]">
        <div className="flex flex-col gap-6 max-w-lg">
          <h1 className="text-5xl font-bold text-gray-900 leading-tight">
            Meet smarter,<br />meet faster.
          </h1>
          <p className="text-gray-500 text-lg">
            Share your location, chat with friends,<br />
            and find the perfect meeting spot in seconds.
          </p>
          <button className="bg-[#5B5BD6] text-white px-6 py-3 rounded-lg w-fit">
            Let's get started!
          </button>
        </div>
        <div className="w-80 h-80 bg-green-400 rounded-2xl flex items-center justify-center text-white text-8xl">
          ✓
        </div>
      </section>
    )
  }