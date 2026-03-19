"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
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

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [breakpoint]);

  return isMobile;
}

export function KanbanBoard({ user }: KanbanBoardProps) {
  const { data: todos = [] } = api.todo.getAll.useQuery();
  const reorder = api.todo.reorder.useMutation();
  const utils = api.useUtils();

  const [modalTodo, setModalTodo] = useState<Todo | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TodoStatus>("PENDING");

  const isMobile = useIsMobile();

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

  const handleStatusChange = useCallback(
    (todoId: string, newStatus: TodoStatus) => {
      const todo = activeTodos.find((t) => t.id === todoId);
      if (!todo || todo.status === newStatus) return;

      const destTodos = [...grouped[newStatus]];
      const updatedTodo = { ...todo, status: newStatus };
      destTodos.push(updatedTodo);

      const reorderedDest = destTodos.map((t, i) => ({ ...t, order: i * 10 }));

      const newTodos = activeTodos.map((t) => {
        if (t.id === todoId) return updatedTodo;
        const destItem = reorderedDest.find((r) => r.id === t.id);
        return destItem ?? t;
      });

      setLocalTodos(newTodos);

      reorder.mutate(
        [{ id: todoId, status: newStatus, order: (destTodos.length - 1) * 10 }],
        {
          onSuccess: () => {
            void utils.todo.getAll.invalidate();
            setLocalTodos(null);
          },
          onError: () => setLocalTodos(null),
        },
      );
    },
    [activeTodos, grouped, reorder, utils],
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const sourceCol = findColumnOfId(activeId);
      const destCol: TodoStatus = (
        COLUMNS.includes(overId as TodoStatus) ? overId : findColumnOfId(overId)
      ) as TodoStatus;

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
        .map((t) => ({
          id: t.id,
          status: t.status as TodoStatus,
          order: t.order,
        }));

      if (payload.length === 0) {
        setLocalTodos(null);
        return;
      }

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
    <div className="bg-aot-void flex min-h-screen flex-col">
      {/* Navbar */}
      <nav className="border-aot-slate bg-aot-obsidian border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-military text-aot-parchment text-xl font-bold tracking-widest">
            ATTACK ON TO-DO&apos;S
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-aot-fog text-sm">
              {user.name || user.email}
            </span>
            <Link
              href="/admin"
              className="font-military text-aot-fog hover:text-aot-gold text-xs tracking-widest"
            >
              ADMIN
            </Link>
            <button
              onClick={() => void signOut({ callbackUrl: "/login" })}
              className="font-military text-aot-fog hover:text-aot-blood text-xs tracking-widest"
            >
              RETREAT
            </button>
          </div>
        </div>
      </nav>

      {/* Board */}
      <div className="flex flex-1 gap-6 overflow-x-auto p-6">
        {isMobile ? (
          <KanbanColumn
            id={activeTab}
            todos={grouped[activeTab]}
            isMobile={true}
            onStatusChange={handleStatusChange}
            onCardClick={(todo) => {
              setModalTodo(todo);
              setShowModal(true);
            }}
          />
        ) : (
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
        )}

        {/* New Todo button */}
        {!isMobile && (
          <div className="flex w-80 flex-shrink-0 flex-col">
            <button
              onClick={() => {
                setModalTodo(undefined);
                setShowModal(true);
              }}
              className="border-aot-slate font-military text-aot-fog hover:border-aot-gold hover:text-aot-gold border border-dashed py-4 text-sm tracking-widest transition"
            >
              + NEW MISSION
            </button>
          </div>
        )}
      </div>

      {/* Mobile Tab Switcher */}
      {isMobile && (
        <div className="border-aot-slate bg-aot-obsidian border-t px-4 py-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("PENDING")}
              className={`font-military flex-1 rounded-sm px-3 py-2 text-xs tracking-wider transition-colors ${
                activeTab === "PENDING"
                  ? "bg-aot-fog/20 text-aot-fog border-aot-fog/50 border"
                  : "bg-aot-iron text-aot-fog border-aot-slate hover:border-aot-fog border"
              }`}
            >
              PENDING
              <span className="ml-1 opacity-60">
                ({grouped.PENDING.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab("IN_PROGRESS")}
              className={`font-military flex-1 rounded-sm px-3 py-2 text-xs tracking-wider transition-colors ${
                activeTab === "IN_PROGRESS"
                  ? "bg-aot-gold/20 text-aot-gold border-aot-gold/50 border"
                  : "bg-aot-iron text-aot-fog border-aot-slate hover:border-aot-gold border"
              }`}
            >
              IN PROGRESS
              <span className="ml-1 opacity-60">
                ({grouped.IN_PROGRESS.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab("DONE")}
              className={`font-military flex-1 rounded-sm px-3 py-2 text-xs tracking-wider transition-colors ${
                activeTab === "DONE"
                  ? "bg-aot-wings/20 text-aot-wings border-aot-wings/50 border"
                  : "bg-aot-iron text-aot-fog border-aot-slate hover:border-aot-wings border"
              }`}
            >
              DONE
              <span className="ml-1 opacity-60">({grouped.DONE.length})</span>
            </button>
          </div>
          <button
            onClick={() => {
              setModalTodo(undefined);
              setShowModal(true);
            }}
            className="border-aot-slate font-military text-aot-fog hover:border-aot-gold hover:text-aot-gold mt-3 w-full border border-dashed py-3 text-sm tracking-widest transition"
          >
            + NEW MISSION
          </button>
        </div>
      )}

      {showModal && (
        <TodoModal
          todo={modalTodo}
          onClose={() => {
            setShowModal(false);
            setModalTodo(undefined);
          }}
        />
      )}
    </div>
  );
}
