import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const MAX_ATTEMPTS = 10;
const LOCK_MINUTES = 15;
const ROLE_RECHECK_MS = 60_000; // re-fetch role from DB at most once per 60 s

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        if (!creds?.email || !creds?.password) return null;
        await connectDB();

        const user = await User.findOne({
          email: (creds.email as string).toLowerCase(),
        }).select("+passwordHash +loginAttempts +lockedUntil");

        if (!user) return null;

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return null;
        }

        const valid = await bcrypt.compare(
          creds.password as string,
          user.passwordHash
        );

        if (!valid) {
          const newAttempts = (user.loginAttempts || 0) + 1;
          const update: any = { loginAttempts: newAttempts };
          if (newAttempts >= MAX_ATTEMPTS) {
            update.lockedUntil = new Date(
              Date.now() + LOCK_MINUTES * 60 * 1000
            );
          }
          await User.findByIdAndUpdate(user._id, update);
          return null;
        }

        // Successful login — reset counters
        await User.findByIdAndUpdate(user._id, {
          loginAttempts: 0,
          lockedUntil: null,
        });

        return {
          id: user._id.toString(),
          name: user.nickname,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        // ── Initial sign-in: seed token from authorize() return value ──
        token.id = user.id;
        token.role = (user as any).role;
        token.name = user.name;
        token.roleCheckedAt = Date.now();
      } else if (token.id) {
        // ── Subsequent requests: re-sync role from DB every 60 s ──
        // This ensures role changes (e.g. admin grants admin to another user)
        // propagate automatically without requiring a logout/login cycle.
        const lastChecked = (token.roleCheckedAt as number) ?? 0;
        if (Date.now() - lastChecked > ROLE_RECHECK_MS) {
          try {
            await connectDB();
            const dbUser = await User.findById(token.id)
              .select("role")
              .lean() as { role?: string } | null;
            if (dbUser) {
              token.role = dbUser.role;
            }
          } catch {
            // DB unreachable — keep the cached role, try again next cycle
          }
          token.roleCheckedAt = Date.now();
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        session.user.name = token.name;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
});
