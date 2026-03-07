"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import { api, type RouterOutputs } from "~/trpc/react";
import { UserModal } from "./UserModal";

type UserRow = RouterOutputs["admin"]["listUsers"]["users"][number];

interface UserTableProps {
  currentUserId: string;
}

export function UserTable({ currentUserId }: UserTableProps) {
  const utils = api.useUtils();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const { data } = api.admin.listUsers.useQuery({
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const deleteUser = api.admin.deleteUser.useMutation({
    onSuccess: () => void utils.admin.listUsers.invalidate(),
  });

  const [modal, setModal] = useState<{
    mode: "create" | "edit" | "resetPassword";
    user?: UserRow;
  } | null>(null);

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handleDelete(user: UserRow) {
    if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    deleteUser.mutate({ id: user.id });
  }

  return (
    <div className="min-h-screen bg-aot-void">
      {/* Navbar */}
      <nav className="border-b border-aot-slate bg-aot-obsidian px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-military text-xl font-bold tracking-widest text-aot-parchment">
            COMMAND CENTER
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/todos"
              className="font-military text-xs tracking-widest text-aot-fog hover:text-aot-gold"
            >
              BOARD
            </Link>
            <button
              onClick={() => void signOut({ callbackUrl: "/login" })}
              className="font-military text-xs tracking-widest text-aot-fog hover:text-aot-blood"
            >
              RETREAT
            </button>
          </div>
        </div>
      </nav>

      <div className="p-6">
        {/* Controls */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search soldiers..."
            className="w-72 border border-aot-slate bg-aot-iron px-3 py-2 text-sm text-aot-bone placeholder-aot-fog outline-none focus:border-aot-gold"
          />
          <button
            onClick={() => setModal({ mode: "create" })}
            className="bg-aot-wings px-4 py-2 font-military text-sm tracking-widest text-aot-parchment transition hover:bg-aot-wings/80"
          >
            + ADD SOLDIER
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-aot-slate">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-aot-slate bg-aot-obsidian">
                {["NAME", "EMAIL", "ROLE", "TODOS", "JOINED", "ACTIONS"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-military text-xs tracking-widest text-aot-fog"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-aot-slate/50 bg-aot-obsidian/50 transition hover:bg-aot-iron"
                >
                  <td className="px-4 py-3 text-aot-bone">{user.name ?? "—"}</td>
                  <td className="px-4 py-3 text-aot-bone">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className="font-military text-xs tracking-wider"
                      style={{ color: user.role === "ADMIN" ? "#c9a227" : "#6b7c42" }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-aot-fog">{user._count.todos}</td>
                  <td className="px-4 py-3 text-aot-fog">
                    {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setModal({ mode: "edit", user })}
                        className="font-military text-xs tracking-wider text-aot-gold hover:underline"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => setModal({ mode: "resetPassword", user })}
                        className="font-military text-xs tracking-wider text-aot-fog hover:text-aot-gold"
                      >
                        PWD
                      </button>
                      {user.id !== currentUserId && (
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={deleteUser.isPending}
                          className="font-military text-xs tracking-wider text-aot-blood hover:underline disabled:opacity-50"
                        >
                          DELETE
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center font-military text-xs tracking-widest text-aot-fog"
                  >
                    NO SOLDIERS FOUND
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-aot-fog">
              {total} soldiers total
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="border border-aot-slate px-3 py-1 font-military text-xs text-aot-fog disabled:opacity-30 hover:border-aot-gold hover:text-aot-gold"
              >
                ← PREV
              </button>
              <span className="px-3 py-1 font-military text-xs text-aot-fog">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="border border-aot-slate px-3 py-1 font-military text-xs text-aot-fog disabled:opacity-30 hover:border-aot-gold hover:text-aot-gold"
              >
                NEXT →
              </button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <UserModal
          mode={modal.mode}
          user={modal.user}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
