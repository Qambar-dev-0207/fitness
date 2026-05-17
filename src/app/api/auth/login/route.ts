import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { login } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const normalizedEmail = email.toLowerCase().trim();
    const client = await clientPromise;
    const db = client.db("svora_db");

    const user = await db.collection("users").findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const userWithoutPassword = { id: user._id.toString(), name: user.name, email: user.email };
    await login(userWithoutPassword);

    return NextResponse.json({ success: true, user: userWithoutPassword });
  } catch (e: unknown) {
    const error = e as Error;
    console.error("LOGIN_ERROR:", error.message || error);
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 });
  }
}
