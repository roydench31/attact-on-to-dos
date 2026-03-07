"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format, isPast, isToday } from "date-fns";
import type { RouterOutputs } from "~/trpc/react";

type Todo = RouterOutputs["todo"]["getAll"][number];

const priorityBorderColor: Record<string, string> = {
  HIGH: "#8b1a1a",
  MEDIUM: "#c0622a",
  LOW: "#6b7c42",
};

interface TodoCardProps {
  todo: Todo;
  onClick: () => void;
}

export function TodoCard({ todo, onClick }: TodoCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const dueDateColor = () => {
    if (!todo.dueDate) return "text-aot-fog";
    const d = new Date(todo.dueDate);
    if (isPast(d) && !isToday(d)) return "text-aot-blood";
    if (isToday(d)) return "text-aot-gold";
    return "text-aot-fog";
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        borderLeft: `3px solid ${priorityBorderColor[todo.priority] ?? "#6b6b6b"}`,
      }}
      {...attributes}
      {...listeners}
      onClick={isDragging ? undefined : onClick}
      className="cursor-pointer border border-aot-slate bg-aot-iron p-3 shadow-md transition-colors hover:border-aot-fog"
    >
      <p className="text-sm font-medium leading-snug text-aot-bone">
        {todo.title}
      </p>

      {todo.description && (
        <p className="mt-1 line-clamp-2 text-xs text-aot-fog">
          {todo.description}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
        <div className="flex flex-wrap gap-1">
          {todo.tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-sm px-1.5 py-0.5 text-xs"
              style={{
                backgroundColor: tag.color + "22",
                color: tag.color,
                border: `1px solid ${tag.color}55`,
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>

        {todo.dueDate && (
          <span className={`text-xs ${dueDateColor()}`}>
            {format(new Date(todo.dueDate), "MMM d")}
          </span>
        )}
      </div>
    </div>
  );
}
