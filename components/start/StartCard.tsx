import Image from "next/image";
import Link from "next/link";

export default function StartCard() {
  return (
    <section className="flex min-h-[calc(100vh-88px)] items-center justify-between overflow-hidden bg-[#EEEEFF] px-20 py-24">
      <div className="z-10 flex max-w-lg -translate-y-24 flex-col gap-6">
        <h1 className="text-5xl font-bold leading-tight text-gray-900">
          Meet smarter,
          <br />
          meet faster.
        </h1>

        <p className="text-lg text-gray-500">
          Share your location, chat with friends,
          <br />
          and find the perfect meeting spot in seconds.
        </p>

        <Link
          href="/login"
          className="w-fit rounded-lg bg-[#5B5BD6] px-6 py-3 font-semibold text-white transition hover:bg-[#4B4BC4]"
        >
          Let&apos;s get started!
        </Link>
      </div>

      <div className="flex flex-1 -translate-y-24 justify-end">
        <Image
          src="/hero-image.png"
          alt="MeetPoint 추천 화면"
          width={1200}
          height={840}
          priority
          className="h-auto w-[1000px] max-w-none"
        />
      </div>
    </section>
  );
}