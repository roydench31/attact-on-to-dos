import Image from "next/image";
import { LoginForm } from "~/app/_components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen">
      {/* Left panel — Wings of Freedom emblem (hidden on mobile) */}
      <div className="relative hidden items-center justify-center md:flex md:w-1/2">
        <div className="wall-bg absolute inset-0" />
        <div className="absolute inset-0 bg-aot-void/60" />
        <div className="relative z-10 flex flex-col items-center gap-8">
          <Image
            src="/auth-logo.webp"
            alt="Wings of Freedom"
            width={192}
            height={192}
            className="h-48 w-48 drop-shadow-lg"
            priority
          />
          <p className="font-military text-lg tracking-[0.3em] text-aot-parchment/80">
            DEDICATE YOUR HEART
          </p>
        </div>
      </div>

      {/* Right panel — Login form */}
      <div className="relative z-10 flex w-full items-center justify-center bg-aot-void px-4 md:w-1/2">
        <LoginForm />
      </div>
    </main>
  );
}
