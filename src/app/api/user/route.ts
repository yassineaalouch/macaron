import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import bcrypt from "bcryptjs"

type RequestBody = {
  username: string
  password: string
}

export async function PUT(req: Request) {
  try {
    await connectToDatabase()

    const { username, password }: RequestBody = await req.json()

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required" },
        { status: 400 }
      )
    }

    // 🔍 Vérifier s’il y a déjà un admin
    const admin = await User.findOne({ role: "admin" })

    const hashedPassword = await bcrypt.hash(password, 10)

    if (admin) {
      // ✅ Mise à jour de l’admin existant
      admin.name = username
      admin.password = hashedPassword
      await admin.save()

      return NextResponse.json(
        { success: true, message: "Admin updated successfully" },
        { status: 200 }
      )
    } else {
      // ✅ Création d’un nouvel admin
      const newAdmin = new User({
        name: username,
        password: hashedPassword,
        role: "admin"
      })
      await newAdmin.save()

      return NextResponse.json(
        { success: true, message: "Admin created successfully" },
        { status: 201 }
      )
    }
  } catch (error: unknown) {
    console.error("❌ Error updating admin credentials:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
