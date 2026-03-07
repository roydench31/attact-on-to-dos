import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "~/server/api/routers/auth";
import { todoRouter } from "~/server/api/routers/todo";
import { tagRouter } from "~/server/api/routers/tag";
import { adminRouter } from "~/server/api/routers/admin";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  todo: todoRouter,
  tag: tagRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
