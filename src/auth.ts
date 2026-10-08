import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validation";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

const providers: Provider[] = [
  Credentials({
    credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
    async authorize(raw) {
      const parsed = loginSchema.safeParse(raw);
      if (!parsed.success) return null;
      const user = await db.user.findUnique({ where: { email: parsed.data.email } });
      if (!user?.passwordHash) return null;
      const ok = await verifyPassword(parsed.data.password, user.passwordHash);
      return ok ? { id: user.id, name: user.name, email: user.email, image: user.image } : null;
    },
  }),
];

// OAuth providers switch on automatically when their credentials are present.
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) providers.push(Google);
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) providers.push(GitHub);

export const oauthProviders = providers
  .map((p) => (typeof p === "function" ? p() : p))
  .filter((p) => p.type === "oidc" || p.type === "oauth")
  .map((p) => ({ id: p.id, name: p.name }));

const config: NextAuthConfig = {
  adapter: PrismaAdapter(db),
  // JWT sessions are required for the credentials provider and keep page
  // renders free of a session-table lookup.
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  trustHost: true,
  providers,
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
