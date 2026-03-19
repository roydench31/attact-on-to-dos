"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format, isPast, isToday } from "date-fns";
import type { RouterOutputs } from "~/trpc/react";

type Todo = RouterOutputs["todo"]["getAll"][number];
type TodoStatus = "PENDING" | "IN_PROGRESS" | "DONE";

const priorityBorderColor: Record<string, string> = {
  HIGH: "#8b1a1a",
  MEDIUM: "#c0622a",
  LOW: "#6b7c42",
};

const statusColors: Record<
  TodoStatus,
  { text: string; hover: string; bg: string }
> = {
  PENDING: {
    text: "text-aot-fog",
    hover: "hover:text-aot-fog",
    bg: "bg-aot-fog/20 border-aot-fog/50",
  },
  IN_PROGRESS: {
    text: "text-aot-gold",
    hover: "hover:text-aot-gold",
    bg: "bg-aot-gold/20 border-aot-gold/50",
  },
  DONE: {
    text: "text-aot-wings",
    hover: "hover:text-aot-wings",
    bg: "bg-aot-wings/20 border-aot-wings/50",
  },
};

interface TodoCardProps {
  todo: Todo;
  onClick: () => void;
  isMobile?: boolean;
  onStatusChange?: (status: TodoStatus) => void;
}

export function TodoCard({
  todo,
  onClick,
  isMobile = false,
  onStatusChange,
}: TodoCardProps) {
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

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(e.target.value as TodoStatus);
    }
  };

  return (
    <div
      ref={setNodeRef}
      data-dnd-sortable-item
      style={{
        touchAction: isMobile ? undefined : "none",
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        borderLeft: `3px solid ${priorityBorderColor[todo.priority] ?? "#6b6b6b"}`,
      }}
      {...(isMobile ? {} : { ...attributes, ...listeners })}
      onClick={isDragging ? undefined : onClick}
      className="border-aot-slate bg-aot-iron hover:border-aot-fog cursor-pointer border p-3 shadow-md transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-aot-bone text-sm leading-snug font-medium">
            {todo.title}
          </p>

          {todo.description && (
            <p className="text-aot-fog mt-1 line-clamp-2 text-xs">
              {todo.description}
            </p>
          )}
        </div>

        {isMobile && onStatusChange && (
          <select
            value={todo.status}
            onChange={handleStatusChange}
            onClick={(e) => e.stopPropagation()}
            className={`bg-aot-iron font-military flex-shrink-0 cursor-pointer rounded-sm border px-2 py-1 text-xs tracking-wide transition-colors ${statusColors[todo.status].text} ${statusColors[todo.status].bg}`}
          >
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        )}
      </div>

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
