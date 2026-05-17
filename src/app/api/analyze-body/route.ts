import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import clientPromise from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { validateBodyAnalysis, extractJson, withAIRetry } from '@/lib/ai-validator';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ""
});

export async function POST(request: Request) {
  try {
    const session = await getSession() as any;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { beforeImage, currentImage } = await request.json();

    if (!beforeImage || !currentImage) {
      return NextResponse.json({ error: "Both images are required" }, { status: 400 });
    }

    const basePrompt = `
      You are an expert biometric analyst for SVORA.
      Compare these two physique photos (Before vs. Current).
      Analyze structural changes, muscle density, body fat percentage, and posture.

      Return a "Monthly Somatic Report" as STRICT JSON only (no markdown, no extra text):
      {
        "muscleMassChange": "Estimated change with a number (e.g. +1.2lbs)",
        "bodyFatChange": "Estimated change with a percentage (e.g. -0.5%)",
        "postureAnalysis": "Notes on alignment",
        "routineAdjustments": "Specific changes needed for the workout plan",
        "motivation": "A brief encouraging message"
      }
    `;

    const { data: analysis, validated, attempts, validationErrors } = await withAIRetry({
      callAI: async (correctionHint) => {
        const stream = await groq.chat.completions.create({
          // Using llama-4-scout for multimodal analysis.
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: basePrompt + correctionHint },
                { type: "image_url", image_url: { url: beforeImage } },
                { type: "image_url", image_url: { url: currentImage } }
              ]
            }
          ],
          stream: true,
          response_format: { type: "json_object" }
        });

        let text = "";
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) text += content;
        }
        return text;
      },
      parse: (text) => extractJson(text) as Record<string, unknown>,
      validate: validateBodyAnalysis,
      maxRetries: 2,
    });

    if (!validated) {
      console.warn(`[analyze-body] Analysis returned with validation issues after ${attempts} attempt(s):`, validationErrors);
    }

    const client = await clientPromise;
    const db = client.db("svora_db");
    await db.collection("body_reports").insertOne({
      userId: session.user.id,
      analysis,
      _aiValidated: validated,
      _aiAttempts: attempts,
      createdAt: new Date()
    });

    return NextResponse.json(analysis);

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("ANALYZE_BODY_ERROR:", errorMessage);
    return NextResponse.json({ error: errorMessage, success: false }, { status: 500 });
  }
}
