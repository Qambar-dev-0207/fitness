import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("svora_db");
    const data = await request.json();

    // Add timestamp
    const routine = {
      ...data,
      createdAt: new Date(),
    };

    // Save to 'routines' collection
    // In a real app, we'd link this to a userId. For now, we'll just insert.
    const result = await db.collection("routines").insertOne(routine);

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save routine' }, { status: 500 });
  }
}
