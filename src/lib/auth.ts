import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { sendAuthWelcomeEmail } from "./email";
import { prisma } from "./prisma";
import { ensureDefaultWorkspaceForUser } from "./workspaces";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;
      const email = credentials.email.trim().toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user?.passwordHash) return null;
      const ok = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!ok) return null;
      return { id: user.id, email: user.email, name: user.name, plan: user.plan };
    },
  }),
];

export const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);
export const githubEnabled = Boolean(
  process.env.GITHUB_ID && process.env.GITHUB_SECRET,
);

// Account linking is intentionally OFF: enabling it would let an attacker
// who registers Google/GitHub with a victim's email take over an existing
// credentials-based account silently. Users who want to link providers must
// log in with their original method first and connect the second from
// settings (TODO: build that flow). Email-collision errors surface as the
// `OAuthAccountNotLinked` error on the sign-in page.
if (googleEnabled) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  );
}

if (githubEnabled) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  events: {
    async createUser({ user }) {
      if (!user.email) return;
      if (user.id) {
        await ensureDefaultWorkspaceForUser(user.id);
      }
      await sendAuthWelcomeEmail({
        to: user.email,
        name: user.name,
        provider: "social",
      });
    },
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.plan = user.plan;
        token.planUpdatedAt = Date.now();
        return token;
      }
      // Refresh plan from DB every 5 min so Stripe webhooks take effect
      // without requiring the user to log out.
      const fiveMin = 5 * 60 * 1000;
      const stale =
        !token.planUpdatedAt || Date.now() - token.planUpdatedAt > fiveMin;
      if (token.id && (stale || trigger === "update")) {
        const db = await prisma.user.findUnique({
          where: { id: token.id },
          select: { plan: true },
        });
        if (db) {
          token.plan = db.plan;
          token.planUpdatedAt = Date.now();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.plan = token.plan;
      }
      return session;
    },
  },
};

export function getSession() {
  return getServerSession(authOptions);
}
