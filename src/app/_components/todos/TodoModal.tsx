"use client";

import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { api, type RouterOutputs } from "~/trpc/react";
import { TagSelector } from "./TagSelector";
import type { Priority } from "../../../../generated/prisma";

type Todo = RouterOutputs["todo"]["getAll"][number];

interface TodoModalProps {
  todo?: Todo;
  onClose: () => void;
}

export function TodoModal({ todo, onClose }: TodoModalProps) {
  const utils = api.useUtils();
  const isEdit = !!todo;

  const [title, setTitle] = useState(todo?.title ?? "");
  const [description, setDescription] = useState(todo?.description ?? "");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    todo?.dueDate ? new Date(todo.dueDate) : undefined,
  );
  const [priority, setPriority] = useState<Priority>(
    todo?.priority ?? "MEDIUM",
  );
  const [tagIds, setTagIds] = useState<string[]>(
    todo?.tags.map((t) => t.id) ?? [],
  );
  const [showCalendar, setShowCalendar] = useState(false);

  const create = api.todo.create.useMutation({
    onSuccess: async () => { await utils.todo.getAll.invalidate(); onClose(); },
  });
  const update = api.todo.update.useMutation({
    onSuccess: async () => { await utils.todo.getAll.invalidate(); onClose(); },
  });
  const del = api.todo.delete.useMutation({
    onSuccess: async () => { await utils.todo.getAll.invalidate(); onClose(); },
  });

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEdit) {
      update.mutate({
        id: todo.id,
        title,
        description: description || null,
        dueDate: dueDate ?? null,
        priority,
        tagIds,
      });
    } else {
      create.mutate({ title, description, dueDate, priority, tagIds });
    }
  }

  const priorityOptions: Priority[] = ["LOW", "MEDIUM", "HIGH"];
  const priorityColors: Record<Priority, string> = {
    LOW: "#6b7c42",
    MEDIUM: "#c0622a",
    HIGH: "#8b1a1a",
  };

  const isPending = create.isPending || update.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg border border-aot-slate bg-aot-obsidian shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-aot-slate px-6 py-4">
          <h2 className="font-military text-lg tracking-widest text-aot-parchment">
            {isEdit ? "EDIT MISSION" : "NEW MISSION"}
          </h2>
          <button
            onClick={onClose}
            className="text-aot-fog hover:text-aot-parchment"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block font-military text-xs tracking-widest text-aot-fog">
              TITLE *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-aot-slate bg-aot-iron px-3 py-2 text-aot-bone outline-none focus:border-aot-gold"
              placeholder="Mission objective..."
            />
          </div>

          <div>
            <label className="mb-1 block font-military text-xs tracking-widest text-aot-fog">
              DESCRIPTION
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-aot-slate bg-aot-iron px-3 py-2 text-aot-bone outline-none focus:border-aot-gold"
              placeholder="Details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="mb-1 block font-military text-xs tracking-widest text-aot-fog">
                PRIORITY
              </label>
              <div className="flex gap-2">
                {priorityOptions.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className="flex-1 py-1 font-military text-xs tracking-wider transition"
                    style={{
                      border: `1px solid ${priorityColors[p]}`,
                      backgroundColor:
                        priority === p ? priorityColors[p] + "33" : "transparent",
                      color: priority === p ? priorityColors[p] : "#6b6b6b",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div className="relative">
              <label className="mb-1 block font-military text-xs tracking-widest text-aot-fog">
                DUE DATE
              </label>
              <button
                type="button"
                onClick={() => setShowCalendar((v) => !v)}
                className="w-full border border-aot-slate bg-aot-iron px-3 py-2 text-left text-sm text-aot-bone hover:border-aot-gold"
              >
                {dueDate ? format(dueDate, "MMM d, yyyy") : "No date"}
              </button>
              {showCalendar && (
                <div className="absolute right-0 top-full z-10 mt-1 border border-aot-slate bg-aot-obsidian shadow-xl">
                  <DayPicker
                    mode="single"
                    selected={dueDate}
                    onSelect={(d) => { setDueDate(d); setShowCalendar(false); }}
                    classNames={{
                      root: "p-3 text-aot-bone",
                      month_caption: "font-military text-xs tracking-widest text-aot-parchment mb-2 text-center",
                      nav: "flex justify-between mb-1",
                      button_previous: "text-aot-fog hover:text-aot-gold px-1",
                      button_next: "text-aot-fog hover:text-aot-gold px-1",
                      weekdays: "flex",
                      weekday: "w-8 text-center text-xs text-aot-fog",
                      weeks: "space-y-1",
                      week: "flex",
                      day: "w-8 h-8 text-center text-sm",
                      day_button: "w-8 h-8 hover:bg-aot-slate rounded",
                      selected: "bg-aot-gold/20 rounded text-aot-gold",
                      today: "text-aot-gold font-bold",
                      outside: "opacity-30",
                    }}
                  />
                  {dueDate && (
                    <button
                      type="button"
                      onClick={() => { setDueDate(undefined); setShowCalendar(false); }}
                      className="w-full border-t border-aot-slate px-3 py-2 text-xs text-aot-fog hover:text-aot-blood"
                    >
                      Clear date
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <TagSelector selectedIds={tagIds} onChange={setTagIds} />

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-aot-blood py-2 font-military text-sm tracking-widest text-aot-parchment transition hover:bg-aot-blood/80 disabled:opacity-50"
            >
              {isPending ? "SAVING..." : isEdit ? "UPDATE" : "DEPLOY"}
            </button>

            {isEdit && (
              <button
                type="button"
                onClick={() => del.mutate({ id: todo.id })}
                disabled={del.isPending}
                className="border border-aot-blood px-4 py-2 font-military text-sm tracking-widest text-aot-blood transition hover:bg-aot-blood/10 disabled:opacity-50"
              >
                {del.isPending ? "..." : "DELETE"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
