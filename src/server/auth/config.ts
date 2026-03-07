import { type DefaultSession, type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { db } from "~/server/db";
import { env } from "~/env";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "USER" | "ADMIN";
    } & DefaultSession["user"];
  }
}

export const authConfig = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        recaptchaToken: { label: "reCAPTCHA Token", type: "text" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(1),
            recaptchaToken: z.string().optional().default(""),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const { email, password, recaptchaToken } = parsed.data;

        // Verify reCAPTCHA (skipped for post-registration auto-login where token was already verified)
        if (recaptchaToken) {
          const recaptchaRes = await fetch(
            "https://www.google.com/recaptcha/api/siteverify",
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                secret: env.RECAPTCHA_SECRET_KEY,
                response: recaptchaToken,
              }),
            },
          );
          const recaptchaData = (await recaptchaRes.json()) as {
            success: boolean;
          };
          if (!recaptchaData.success) return null;
        }

        const user = await db.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as "USER" | "ADMIN",
        },
      };
    },
  },
  pages: { signIn: "/login" },
} satisfies NextAuthConfig;
