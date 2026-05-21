import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession() as any;
    const userId = session?.user?.id || "guest";

    const client = await clientPromise;
    const db = client.db("svora_db");

    // Get the most recent routine for this user
    const routine = await db.collection("routines")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(1)
      .next();

    if (!routine) {
      return NextResponse.json({ routine: null });
    }

    return NextResponse.json({ routine });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch routine' }, { status: 500 });
  }
}
