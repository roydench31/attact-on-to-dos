import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { env } from "~/env";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        email: z.string().email(),
        password: z.string().min(8),
        recaptchaToken: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify reCAPTCHA
      const recaptchaRes = await fetch(
        "https://www.google.com/recaptcha/api/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            secret: env.RECAPTCHA_SECRET_KEY,
            response: input.recaptchaToken,
          }),
        },
      );
      const recaptchaData = (await recaptchaRes.json()) as { success: boolean };
      if (!recaptchaData.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "reCAPTCHA verification failed",
        });
      }

      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

      await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: passwordHash,
        },
      });

      return { success: true };
    }),
});
