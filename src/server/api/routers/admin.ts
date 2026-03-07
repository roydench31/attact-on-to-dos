import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { Role } from "../../../../generated/prisma";

export const adminRouter = createTRPCRouter({
  listUsers: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = input.search
        ? {
            OR: [
              { name: { contains: input.search } },
              { email: { contains: input.search } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { email: "asc" },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            _count: { select: { todos: true } },
          },
        }),
        ctx.db.user.count({ where }),
      ]);

      return { users, total, page: input.page, pageSize: input.pageSize };
    }),

  getUser: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: { id: true, name: true, email: true, role: true },
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return user;
    }),

  createUser: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        email: z.string().email(),
        password: z.string().min(8),
        role: z.nativeEnum(Role).default(Role.USER),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      if (existing)
        throw new TRPCError({ code: "CONFLICT", message: "Email already in use" });

      const passwordHash = await bcrypt.hash(input.password, 12);

      return ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: passwordHash,
          role: input.role,
        },
        select: { id: true, name: true, email: true, role: true },
      });
    }),

  updateUser: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        email: z.string().email().optional(),
        role: z.nativeEnum(Role).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const data: {
        name?: string;
        email?: string;
        role?: Role;
      } = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.email !== undefined) data.email = input.email;
      if (input.role !== undefined) data.role = input.role;

      return ctx.db.user.update({
        where: { id: input.id },
        data,
        select: { id: true, name: true, email: true, role: true },
      });
    }),

  resetPassword: adminProcedure
    .input(
      z.object({
        id: z.string(),
        newPassword: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await ctx.db.user.update({
        where: { id: input.id },
        data: { password: passwordHash },
      });
      return { success: true };
    }),

  deleteUser: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot delete your own account",
        });
      }

      const target = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: { role: true },
      });
      if (target?.role === Role.ADMIN) {
        const adminCount = await ctx.db.user.count({
          where: { role: Role.ADMIN },
        });
        if (adminCount <= 1) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cannot delete the last admin",
          });
        }
      }

      await ctx.db.user.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
