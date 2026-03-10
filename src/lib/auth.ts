import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { verify } from "@node-rs/argon2";
import { prisma } from "./prisma";
import { loginSchema } from "./validations";
import { authConfig } from "../../auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate shape with Zod before touching the DB
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            hashedPassword: true,
            role: true,
            twoFactorEnabled: true,
          },
        });

        // Guard: user must exist and have a password (not OAuth-only)
        if (!user?.hashedPassword) return null;

        const isValid = await verify(user.hashedPassword, password, {
          memoryCost: 19456,
          timeCost: 2,
          outputLen: 32,
          parallelism: 1,
        });

        if (!isValid) return null;

        // NOTE: If twoFactorEnabled is true, full TOTP verification at login-time
        // is a Phase 1.5 enhancement. The settings page (/settings) handles
        // enabling and disabling 2FA. The twoFactorEnabled flag is available
        // here to support future enforcement in the credentials flow.

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  // Prevent sensitive data from leaking into logs
  logger: {
    error(error) {
      // Strip potential credential fields before logging
      console.error("[Auth] Error:", error.name);
    },
    warn(code) {
      console.warn("[Auth] Warning:", code);
    },
  },
});
