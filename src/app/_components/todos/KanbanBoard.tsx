"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { api, type RouterOutputs } from "~/trpc/react";
import { KanbanColumn } from "./KanbanColumn";
import { TodoModal } from "./TodoModal";

type Todo = RouterOutputs["todo"]["getAll"][number];
type TodoStatus = "PENDING" | "IN_PROGRESS" | "DONE";

const COLUMNS: TodoStatus[] = ["PENDING", "IN_PROGRESS", "DONE"];

interface KanbanBoardProps {
  user: { name: string; email: string };
}

export function KanbanBoard({ user }: KanbanBoardProps) {
  const { data: todos = [] } = api.todo.getAll.useQuery();
  const reorder = api.todo.reorder.useMutation();
  const utils = api.useUtils();

  const [modalTodo, setModalTodo] = useState<Todo | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);

  // Local ordering state (optimistic)
  const [localTodos, setLocalTodos] = useState<Todo[] | null>(null);
  const activeTodos = localTodos ?? todos;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Custom collision detection: filter out the active (dragged) item.
  // closestCorners penalizes tall column droppables (far bottom corners),
  // causing it to resolve `over` to the card's own compact droppable
  // instead of the destination column for adjacent-column drags.
  const collisionDetection: CollisionDetection = useCallback(
    (args) => closestCorners(args).filter((c) => c.id !== args.active.id),
    [],
  );

  const grouped = useMemo(() => {
    const map: Record<TodoStatus, Todo[]> = {
      PENDING: [],
      IN_PROGRESS: [],
      DONE: [],
    };
    for (const todo of activeTodos) {
      map[todo.status as TodoStatus]?.push(todo);
    }
    // Sort by order within each column
    for (const col of COLUMNS) {
      map[col].sort((a, b) => a.order - b.order);
    }
    return map;
  }, [activeTodos]);

  function findColumnOfId(id: string): TodoStatus | undefined {
    for (const col of COLUMNS) {
      if (grouped[col].some((t) => t.id === id)) return col;
    }
    return undefined;
  }

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const sourceCol = findColumnOfId(activeId);
      const destCol: TodoStatus = (COLUMNS.includes(overId as TodoStatus)
        ? overId
        : findColumnOfId(overId)) as TodoStatus;

      if (!sourceCol || !destCol) return;
      if (activeId === overId && sourceCol === destCol) return;

      let newTodos: Todo[];

      if (sourceCol === destCol) {
        // Same column reorder
        const items = grouped[sourceCol];
        const oldIdx = items.findIndex((t) => t.id === activeId);
        const newIdx = COLUMNS.includes(overId as TodoStatus)
          ? items.length - 1
          : items.findIndex((t) => t.id === overId);
        if (oldIdx === newIdx) return;
        const reordered = arrayMove(items, oldIdx, newIdx).map((t, i) => ({
          ...t,
          order: i * 10,
        }));
        newTodos = activeTodos.map(
          (t) => reordered.find((r) => r.id === t.id) ?? t,
        );
      } else {
        // Cross-column move
        const srcItems = [...grouped[sourceCol]];
        const dstItems = [...grouped[destCol]];

        const srcIdx = srcItems.findIndex((t) => t.id === activeId);
        const [moved] = srcItems.splice(srcIdx, 1);
        if (!moved) return;

        const updatedMoved = { ...moved, status: destCol };

        const dstIdx = COLUMNS.includes(overId as TodoStatus)
          ? dstItems.length
          : dstItems.findIndex((t) => t.id === overId);

        dstItems.splice(dstIdx < 0 ? dstItems.length : dstIdx, 0, updatedMoved);

        const reorderedSrc = srcItems.map((t, i) => ({ ...t, order: i * 10 }));
        const reorderedDst = dstItems.map((t, i) => ({ ...t, order: i * 10 }));

        const changed = new Map<string, Todo>();
        [...reorderedSrc, ...reorderedDst].forEach((t) => changed.set(t.id, t));

        newTodos = activeTodos.map((t) => changed.get(t.id) ?? t);
      }

      // Optimistic update
      setLocalTodos(newTodos);

      const payload = newTodos
        .filter((t) => {
          const orig = todos.find((o) => o.id === t.id);
          return orig?.status !== t.status || orig?.order !== t.order;
        })
        .map((t) => ({ id: t.id, status: t.status as TodoStatus, order: t.order }));

      if (payload.length === 0) { setLocalTodos(null); return; }

      reorder.mutate(payload, {
        onSuccess: () => {
          void utils.todo.getAll.invalidate();
          setLocalTodos(null);
        },
        onError: () => setLocalTodos(null),
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [grouped, activeTodos, todos],
  );

  return (
    <div className="flex min-h-screen flex-col bg-aot-void">
      {/* Navbar */}
      <nav className="border-b border-aot-slate bg-aot-obsidian px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-military text-xl font-bold tracking-widest text-aot-parchment">
            ATTACK ON TO-DO'S
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-aot-fog">
              {user.name || user.email}
            </span>
            <Link
              href="/admin"
              className="font-military text-xs tracking-widest text-aot-fog hover:text-aot-gold"
            >
              ADMIN
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

      {/* Board */}
      <div className="flex flex-1 gap-6 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragEnd={onDragEnd}
        >
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col}
              id={col}
              todos={grouped[col]}
              onCardClick={(todo) => {
                setModalTodo(todo);
                setShowModal(true);
              }}
            />
          ))}
        </DndContext>

        {/* New Todo button */}
        <div className="flex w-80 flex-shrink-0 flex-col">
          <button
            onClick={() => { setModalTodo(undefined); setShowModal(true); }}
            className="border border-dashed border-aot-slate py-4 font-military text-sm tracking-widest text-aot-fog transition hover:border-aot-gold hover:text-aot-gold"
          >
            + NEW MISSION
          </button>
        </div>
      </div>

      {showModal && (
        <TodoModal
          todo={modalTodo}
          onClose={() => { setShowModal(false); setModalTodo(undefined); }}
        />
      )}
    </div>
  );
}
