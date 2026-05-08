import Header from "@/components/common/Header";
import AuthForm from "@/components/start/AuthForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#EEEEFF] flex flex-col">
      <Header />

      <div className="flex-1 flex items-center justify-center">
        <AuthForm />
      </div>
    </main>
  );
}