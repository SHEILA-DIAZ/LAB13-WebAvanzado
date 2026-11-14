import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";

export const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.NEXTAUTH_SECRET);
export const githubConfigured = Boolean(process.env.GITHUB_ID && process.env.GITHUB_SECRET && process.env.NEXTAUTH_SECRET);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Correo y contraseña",
      credentials: {
        email: { label: "Correo electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials || typeof credentials.email !== "string" || typeof credentials.password !== "string" ||
          !credentials.password || Buffer.byteLength(credentials.password, "utf8") > 72) return null;
        // OAuth sessions must not load or depend on the local credentials database.
        const { authenticateUser, normalizeEmail, validEmail } = await import("@/lib/users");
        if (!validEmail(normalizeEmail(credentials.email))) return null;
        return authenticateUser(credentials.email, credentials.password);
      },
    }),
    ...(googleConfigured ? [GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })] : []),
    ...(githubConfigured ? [GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    })] : []),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/signin", error: "/signin" },
  callbacks: {
    async jwt({ token, account }) {
      if (account) token.provider = account.provider;
      return token;
    },
    async session({ session, token }) {
      session.provider = typeof token.provider === "string" ? token.provider : undefined;
      return session;
    },
  },
};
