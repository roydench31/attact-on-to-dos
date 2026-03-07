"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { RouterOutputs } from "~/trpc/react";
import { TodoCard } from "./TodoCard";

type Todo = RouterOutputs["todo"]["getAll"][number];

const columnConfig = {
  PENDING: {
    label: "PENDING",
    decoration: "border-aot-fog",
    headerColor: "text-aot-bone",
    dotColor: "bg-aot-fog",
  },
  IN_PROGRESS: {
    label: "IN PROGRESS",
    decoration: "border-aot-gold",
    headerColor: "text-aot-gold",
    dotColor: "bg-aot-gold",
  },
  DONE: {
    label: "DONE",
    decoration: "border-aot-wings",
    headerColor: "text-aot-wings",
    dotColor: "bg-aot-wings",
  },
} as const;

interface KanbanColumnProps {
  id: "PENDING" | "IN_PROGRESS" | "DONE";
  todos: Todo[];
  onCardClick: (todo: Todo) => void;
}

export function KanbanColumn({ id, todos, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const config = columnConfig[id];

  return (
    <div className="flex w-80 flex-shrink-0 flex-col">
      {/* Column Header */}
      <div className={`mb-3 border-b pb-2 ${config.decoration}`}>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${config.dotColor}`} />
          <h3 className={`font-military text-sm tracking-widest ${config.headerColor}`}>
            {config.label}
          </h3>
          <span className="ml-auto font-military text-xs text-aot-fog">
            {todos.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 rounded-sm p-1 transition-colors min-h-[200px] ${
          isOver ? "bg-aot-iron/50" : ""
        }`}
      >
        <SortableContext
          items={todos.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {todos.map((todo) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              onClick={() => onCardClick(todo)}
            />
          ))}
        </SortableContext>

        {todos.length === 0 && (
          <div className="flex h-24 items-center justify-center border border-dashed border-aot-slate">
            <p className="font-military text-xs tracking-widest text-aot-fog/40">
              {id === "DONE" ? "NO VICTORIES YET" : "NO MISSIONS"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
