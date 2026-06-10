import LogoutButton from "@/components/common/LogoutButton";

type HeaderProps = {
  showLogout?: boolean;
};

export default function Header({ showLogout = false }: HeaderProps) {
  return (
    <header className="w-full flex items-center justify-between px-12 py-4 bg-white shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-xl">📍</span>
        <span className="text-xl font-bold text-[#5B5BD6]">meetpoint</span>
      </div>



      {showLogout ? (
        <LogoutButton />
      ) : (
        <a
          href="/login"
          className="bg-[#5B5BD6] text-white px-5 py-2 rounded-lg"
        >
          sign in
        </a>
      )}
    </header>
  );
}