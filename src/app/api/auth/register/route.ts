import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { login } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    const normalizedEmail = email.toLowerCase().trim();

    const client = await clientPromise;
    const db = client.db("svora_db");

    const existingUser = await db.collection("users").findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await db.collection("users").insertOne(user);
    const userWithoutPassword = { id: result.insertedId.toString(), name, email };

    await login(userWithoutPassword);

    return NextResponse.json({ success: true, user: userWithoutPassword });
  } catch (e: unknown) {
    const error = e as Error;
    console.error("REGISTRATION_ERROR_DETAIL:", {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 });
  }
}
