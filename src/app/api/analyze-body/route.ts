import { NextResponse } from 'next/server';
import { OpenRouter } from '@openrouter/sdk';
import clientPromise from '@/lib/mongodb';
import { getSession } from '@/lib/auth';

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || ""
});

export async function POST(request: Request) {
  try {
    const session = await getSession() as any;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { beforeImage, currentImage } = await request.json();
    
    if (!beforeImage || !currentImage) {
      return NextResponse.json({ error: "Both images are required" }, { status: 400 });
    }

    const prompt = `
      You are an expert biometric analyst for SVORA. 
      Compare these two physique photos (Before vs. Current).
      Analyze structural changes, muscle density, body fat percentage, and posture.
      
      Provide a "Monthly Somatic Report" in JSON format:
      {
        "muscleMassChange": "Estimated change (e.g. +1.2lbs)",
        "bodyFatChange": "Estimated change (e.g. -0.5%)",
        "postureAnalysis": "Notes on alignment",
        "routineAdjustments": "Specific changes needed for the workout plan (e.g. Increase volume on deltoids)",
        "motivation": "A brief, high-level encouragement"
      }
    `;

    const response = await openrouter.chat.send({
      chatGenerationParams: {
        model: "google/gemini-2.0-flash-exp:free",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", imageUrl: { url: beforeImage } },
              { type: "image_url", imageUrl: { url: currentImage } }
            ]
          }
        ]
      }
    });

    const content = response.choices[0]?.message?.content;
    const text = typeof content === "string" ? content : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Failed to parse analysis" };

    // Store in DB
    const client = await clientPromise;
    const db = client.db("svora_db");
    await db.collection("body_reports").insertOne({
      beforeImage, // In real app, store URL, not base64
      currentImage,
      analysis,
      createdAt: new Date()
    });

    return NextResponse.json(analysis);

  } catch (e: unknown) {
    let errorMessage = "Analysis failed";
    if (e instanceof Error) errorMessage = e.message;
    console.error("ANALYZE_BODY_ERROR:", e);
    return new NextResponse(
      JSON.stringify({ error: errorMessage, success: false }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
