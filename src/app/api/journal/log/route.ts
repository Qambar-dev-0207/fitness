import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();
    const client = await clientPromise;
    const db = client.db("fitai_db");

    const entry = {
      userId: session.user.id,
      ...data,
      createdAt: new Date(),
    };

    const result = await db.collection("journal_entries").insertOne(entry);
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Logging failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clientPromise;
    const db = client.db("fitai_db");

    const entries = await db.collection("journal_entries")
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(entries);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
