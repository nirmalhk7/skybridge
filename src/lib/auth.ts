import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodbClientPromise";

function persistedRole(role: unknown): "fundraiser" | "sponsorer" | null {
  if (typeof role !== "string") return null;
  const normalized = role.toLowerCase();
  if (normalized === "sponsor") return "sponsorer";
  if (normalized === "fundraiser" || normalized === "sponsorer") {
    return normalized;
  }
  return null;
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const client = await clientPromise;
        const user = await client
          .db("skybridge-cluster")
          .collection("users")
          .findOne(
            { email: credentials.email.trim().toLowerCase() },
            { projection: { _id: 1, email: 1, name: 1, password: 1, role: 1 } },
          );
        const role = persistedRole(user?.role);
        if (!user?.password || !role) return null;
        if (!(await compare(credentials.password, user.password))) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = persistedRole(user.role);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = persistedRole(token.role) ?? "fundraiser";
      }
      return session;
    },
  },
  pages: { signIn: "/signin" },
};
