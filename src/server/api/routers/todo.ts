import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { Priority, TodoStatus } from "../../../../generated/prisma";

export const todoRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.todo.findMany({
      where: { userId: ctx.session.user.id },
      include: { tags: true },
      orderBy: [{ status: "asc" }, { order: "asc" }],
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        dueDate: z.date().optional(),
        priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
        tagIds: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const maxOrder = await ctx.db.todo.aggregate({
        where: { userId: ctx.session.user.id, status: TodoStatus.PENDING },
        _max: { order: true },
      });

      return ctx.db.todo.create({
        data: {
          title: input.title,
          description: input.description,
          dueDate: input.dueDate,
          priority: input.priority,
          status: TodoStatus.PENDING,
          order: (maxOrder._max.order ?? 0) + 10,
          userId: ctx.session.user.id,
          tags: { connect: input.tagIds.map((id) => ({ id })) },
        },
        include: { tags: true },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().nullable().optional(),
        dueDate: z.date().nullable().optional(),
        priority: z.nativeEnum(Priority).optional(),
        status: z.nativeEnum(TodoStatus).optional(),
        tagIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const todo = await ctx.db.todo.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!todo) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.todo.update({
        where: { id: input.id },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
          ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
          ...(input.priority !== undefined && { priority: input.priority }),
          ...(input.status !== undefined && { status: input.status }),
          ...(input.tagIds !== undefined && {
            tags: { set: input.tagIds.map((tid) => ({ id: tid })) },
          }),
        },
        include: { tags: true },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const todo = await ctx.db.todo.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!todo) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.todo.delete({ where: { id: input.id } });
      return { success: true };
    }),

  reorder: protectedProcedure
    .input(
      z.array(
        z.object({
          id: z.string(),
          status: z.nativeEnum(TodoStatus),
          order: z.number(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const ids = input.map((item) => item.id);
      const count = await ctx.db.todo.count({
        where: { id: { in: ids }, userId: ctx.session.user.id },
      });
      if (count !== ids.length) throw new TRPCError({ code: "FORBIDDEN" });

      await ctx.db.$transaction(
        input.map((item) =>
          ctx.db.todo.update({
            where: { id: item.id },
            data: { status: item.status, order: item.order },
          }),
        ),
      );

      return { success: true };
    }),
});
