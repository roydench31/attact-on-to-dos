"use client";

import { useState, useRef, useMemo } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReCAPTCHA from "react-google-recaptcha";
import { api } from "~/trpc/react";
import { env } from "~/env";

function getPasswordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 1, label: "WEAK", color: "#8b1a1a" };
  if (score === 2) return { level: 2, label: "FAIR", color: "#c0622a" };
  if (score === 3) return { level: 3, label: "GOOD", color: "#c9a227" };
  return { level: 4, label: "STRONG", color: "#6b7c42" };
}

export function SignupForm() {
  const router = useRouter();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState("");

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const register = api.auth.register.useMutation({
    onSuccess: async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Account created, but login failed. Please sign in manually.");
      } else {
        router.push("/todos");
        router.refresh();
      }
    },
    onError: (err) => {
      setError(err.message);
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA verification.");
      return;
    }

    register.mutate({ name, email, password, recaptchaToken });
  }

  const loading = register.isPending;

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
            RECONNAISSANCE CORPS — NEW RECRUIT
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="signup-name"
              className="mb-1 block font-military text-xs tracking-widest text-aot-fog"
            >
              NAME
            </label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              aria-required="true"
              disabled={loading}
              className="w-full border border-aot-slate bg-aot-iron px-3 py-2 text-aot-bone placeholder-aot-fog outline-none transition-colors duration-200 hover:border-aot-fog focus:border-aot-gold focus:ring-1 focus:ring-aot-gold/50 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Eren Yeager"
            />
          </div>

          <div>
            <label
              htmlFor="signup-email"
              className="mb-1 block font-military text-xs tracking-widest text-aot-fog"
            >
              EMAIL
            </label>
            <input
              id="signup-email"
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
              htmlFor="signup-password"
              className="mb-1 block font-military text-xs tracking-widest text-aot-fog"
            >
              PASSWORD
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-required="true"
                disabled={loading}
                minLength={8}
                className="w-full border border-aot-slate bg-aot-iron px-3 py-2 pr-10 text-aot-bone placeholder-aot-fog outline-none transition-colors duration-200 hover:border-aot-fog focus:border-aot-gold focus:ring-1 focus:ring-aot-gold/50 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Min. 8 characters"
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

            {/* Password strength indicator */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((segment) => (
                    <div
                      key={segment}
                      className="strength-segment"
                      style={
                        segment <= strength.level
                          ? { backgroundColor: strength.color }
                          : undefined
                      }
                    />
                  ))}
                </div>
                <p
                  className={`mt-1 font-military text-xs tracking-widest ${
                    strength.level <= 1
                      ? "text-aot-blood"
                      : strength.level === 2
                        ? "text-aot-rust"
                        : strength.level === 3
                          ? "text-aot-gold"
                          : "text-aot-wings"
                  }`}
                >
                  {strength.label}
                </p>
              </div>
            )}
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
            {loading ? "ENLISTING..." : "JOIN THE CORPS"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-aot-fog">
          Already a soldier?{" "}
          <Link
            href="/login"
            className="text-aot-gold underline transition-colors duration-200 hover:text-aot-parchment"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
