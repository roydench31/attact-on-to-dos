"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReCAPTCHA from "react-google-recaptcha";
import { env } from "~/env";

export function LoginForm() {
  const router = useRouter();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA verification.");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        recaptchaToken,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        recaptchaRef.current?.reset();
        setRecaptchaToken(null);
      } else {
        router.push("/todos");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="animate-fade-slide-up border border-aot-slate bg-aot-obsidian p-8 shadow-2xl shadow-aot-gold/5">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-military text-3xl font-bold tracking-widest text-aot-parchment">
            ATTACK ON TODOS
          </h1>
          <div className="mx-auto mt-2 h-px w-2/3 bg-aot-gold" />
          <p className="mt-3 font-military text-sm tracking-widest text-aot-fog">
            RECONNAISSANCE CORPS — FIELD ENTRY
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="login-email"
              className="mb-1 block font-military text-xs tracking-widest text-aot-fog"
            >
              EMAIL
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
              disabled={loading}
              className="w-full border border-aot-slate bg-aot-iron px-3 py-2 text-aot-bone placeholder-aot-fog outline-none transition-colors duration-200 hover:border-aot-fog focus:border-aot-gold focus:ring-1 focus:ring-aot-gold/50 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="soldier@walls.mil"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-1 block font-military text-xs tracking-widest text-aot-fog"
            >
              PASSWORD
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-required="true"
                disabled={loading}
                className="w-full border border-aot-slate bg-aot-iron px-3 py-2 pr-10 text-aot-bone placeholder-aot-fog outline-none transition-colors duration-200 hover:border-aot-fog focus:border-aot-gold focus:ring-1 focus:ring-aot-gold/50 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="••••••••"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-aot-fog transition-colors hover:text-aot-bone"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
              onChange={setRecaptchaToken}
              theme="dark"
            />
          </div>

          {error && (
            <p
              role="alert"
              aria-live="polite"
              className="border border-aot-blood/50 bg-aot-blood/10 px-3 py-2 text-sm text-aot-blood"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full cursor-pointer bg-aot-blood py-2 font-military text-sm tracking-widest text-aot-parchment transition hover:scale-[1.02] hover:bg-aot-blood/80 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "DEPLOYING..." : "ENTER THE WALLS"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-aot-fog">
          No account?{" "}
          <Link
            href="/signup"
            className="text-aot-gold underline transition-colors duration-200 hover:text-aot-parchment"
          >
            Enlist now
          </Link>
        </p>
      </div>
    </div>
  );
}
