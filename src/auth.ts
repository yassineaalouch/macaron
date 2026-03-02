import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) {
            return null
          }

          await connectToDatabase()

          // 🔍 Vérifie s'il y a un utilisateur admin
          const admin = await User.findOne({ role: "admin" })

          // 🟢 Aucun admin => autoriser login direct ET créer le premier admin
          if (!admin) {
            const hashedPassword = await bcrypt.hash(
              credentials.password as string,
              10
            )
            const newAdmin = new User({
              name: credentials.username as string,
              password: hashedPassword,
              role: "admin"
            })
            await newAdmin.save()
            return {
              id: newAdmin._id.toString(),
              name: newAdmin.name,
              role: newAdmin.role
            }
          }
          
          const isUsernameMatch = admin.name === credentials.username
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            admin.password
          )

          if (isUsernameMatch && isPasswordValid) {
            return {
              id: admin._id.toString(),
              name: admin.name,
              role: admin.role
            }
          }
          
          return null
        } catch (error) {
          console.error("Authorize error:", error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 jours
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    }
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        ;(session.user as any).id = token.id as string
        ;(session.user as any).name = token.name as string
        ;(session.user as any).role = token.role as string
      }
      return session
    }
  },
  trustHost: true
})

