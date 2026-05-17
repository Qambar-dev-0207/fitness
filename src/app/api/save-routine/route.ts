import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession() as any;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clientPromise;
    const db = client.db("svora_db");
    const data = await request.json();

    const routine = {
      ...data,
      userId: session.user.id,
      createdAt: new Date(),
    };

    const result = await db.collection("routines").insertOne(routine);

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save routine' }, { status: 500 });
  }
}
