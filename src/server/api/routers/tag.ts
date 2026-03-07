import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const tagRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.tag.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { name: "asc" },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6b7c42"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tag.upsert({
        where: {
          name_userId: { name: input.name, userId: ctx.session.user.id },
        },
        update: { color: input.color },
        create: {
          name: input.name,
          color: input.color,
          userId: ctx.session.user.id,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tag = await ctx.db.tag.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!tag) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.tag.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
