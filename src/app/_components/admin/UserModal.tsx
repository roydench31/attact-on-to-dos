"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";

type UserRow = RouterOutputs["admin"]["listUsers"]["users"][number];

interface UserModalProps {
  user?: UserRow;
  mode: "create" | "edit" | "resetPassword";
  onClose: () => void;
}

export function UserModal({ user, mode, onClose }: UserModalProps) {
  const utils = api.useUtils();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">(user?.role ?? "USER");
  const [error, setError] = useState("");

  const invalidate = async () => {
    await utils.admin.listUsers.invalidate();
    onClose();
  };

  const create = api.admin.createUser.useMutation({ onSuccess: invalidate, onError: (e) => setError(e.message) });
  const update = api.admin.updateUser.useMutation({ onSuccess: invalidate, onError: (e) => setError(e.message) });
  const resetPwd = api.admin.resetPassword.useMutation({ onSuccess: invalidate, onError: (e) => setError(e.message) });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "create") {
      create.mutate({ name, email, password, role });
    } else if (mode === "edit" && user) {
      update.mutate({ id: user.id, name, email, role });
    } else if (mode === "resetPassword" && user) {
      resetPwd.mutate({ id: user.id, newPassword: password });
    }
  }

  const isPending = create.isPending || update.isPending || resetPwd.isPending;

  const title =
    mode === "create"
      ? "ADD SOLDIER"
      : mode === "edit"
        ? "EDIT SOLDIER"
        : "RESET PASSWORD";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md border border-aot-slate bg-aot-obsidian shadow-2xl">
        <div className="flex items-center justify-between border-b border-aot-slate px-6 py-4">
          <h2 className="font-military text-lg tracking-widest text-aot-parchment">
            {title}
          </h2>
          <button onClick={onClose} className="text-aot-fog hover:text-aot-parchment">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {mode !== "resetPassword" && (
            <>
              <div>
                <label className="mb-1 block font-military text-xs tracking-widest text-aot-fog">NAME</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border border-aot-slate bg-aot-iron px-3 py-2 text-aot-bone outline-none focus:border-aot-gold"
                />
              </div>
              <div>
                <label className="mb-1 block font-military text-xs tracking-widest text-aot-fog">EMAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-aot-slate bg-aot-iron px-3 py-2 text-aot-bone outline-none focus:border-aot-gold"
                />
              </div>
              <div>
                <label className="mb-1 block font-military text-xs tracking-widest text-aot-fog">ROLE</label>
                <div className="flex gap-3">
                  {(["USER", "ADMIN"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className="flex-1 py-2 font-military text-xs tracking-widest transition"
                      style={{
                        border: `1px solid ${role === r ? "#c9a227" : "#2a2a2a"}`,
                        color: role === r ? "#c9a227" : "#6b6b6b",
                        backgroundColor: role === r ? "#c9a22720" : "transparent",
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {(mode === "create" || mode === "resetPassword") && (
            <div>
              <label className="mb-1 block font-military text-xs tracking-widest text-aot-fog">
                {mode === "resetPassword" ? "NEW PASSWORD" : "PASSWORD"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-aot-slate bg-aot-iron px-3 py-2 text-aot-bone outline-none focus:border-aot-gold"
              />
            </div>
          )}

          {error && (
            <p className="border border-aot-blood/50 bg-aot-blood/10 px-3 py-2 text-sm text-aot-blood">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-aot-blood py-2 font-military text-sm tracking-widest text-aot-parchment transition hover:bg-aot-blood/80 disabled:opacity-50"
          >
            {isPending ? "PROCESSING..." : "CONFIRM"}
          </button>
        </form>
      </div>
    </div>
  );
}
