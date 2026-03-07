"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReCAPTCHA from "react-google-recaptcha";
import { api } from "~/trpc/react";
import { env } from "~/env";

export function SignupForm() {
  const router = useRouter();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState("");

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

  return (
    <div className="w-full max-w-md">
      <div className="border border-aot-slate bg-aot-obsidian p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-military text-3xl font-bold tracking-widest text-aot-parchment">
            ATTACK ON TO-DOS
          </h1>
          <div className="mx-auto mt-2 h-px w-2/3 bg-aot-gold" />
          <p className="mt-3 font-military text-sm tracking-widest text-aot-fog">
            RECONNAISSANCE CORPS — NEW RECRUIT
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block font-military text-xs tracking-widest text-aot-fog">
              NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-aot-slate bg-aot-iron px-3 py-2 text-aot-bone placeholder-aot-fog outline-none focus:border-aot-gold"
              placeholder="Eren Yeager"
            />
          </div>

          <div>
            <label className="mb-1 block font-military text-xs tracking-widest text-aot-fog">
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-aot-slate bg-aot-iron px-3 py-2 text-aot-bone placeholder-aot-fog outline-none focus:border-aot-gold"
              placeholder="soldier@walls.mil"
            />
          </div>

          <div>
            <label className="mb-1 block font-military text-xs tracking-widest text-aot-fog">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full border border-aot-slate bg-aot-iron px-3 py-2 text-aot-bone placeholder-aot-fog outline-none focus:border-aot-gold"
              placeholder="Min. 8 characters"
            />
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
            <p className="border border-aot-blood/50 bg-aot-blood/10 px-3 py-2 text-sm text-aot-blood">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={register.isPending}
            className="w-full bg-aot-blood py-2 font-military text-sm tracking-widest text-aot-parchment transition hover:bg-aot-blood/80 disabled:opacity-50"
          >
            {register.isPending ? "ENLISTING..." : "JOIN THE CORPS"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-aot-fog">
          Already a soldier?{" "}
          <Link
            href="/login"
            className="text-aot-gold underline hover:text-aot-parchment"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
