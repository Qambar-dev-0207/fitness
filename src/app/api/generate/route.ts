import { OpenRouter } from "@openrouter/sdk";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { validateWorkoutPlan, extractJson, withAIRetry } from "@/lib/ai-validator";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || ""
});

export const dynamic = 'force-dynamic';

// Hard timeout per AI call so a hanging model never causes a 502
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`AI request timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

export async function POST(req: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "API Key Configuration Error" }, { status: 500 });
  }
  try {
    const session = await getSession() as any;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access detected." }, { status: 401 });
    }

    const { age, height, weight, bodyType, goal, trainingLocation, fasting, image } = await req.json();

    const isAIGeneratedBodyType = bodyType === "AI_ANALYSIS_REQUESTED";

    const basePrompt = `
      You are a friendly, expert personal trainer for SVORA Wellness.

      ${isAIGeneratedBodyType && image ? "I have provided an image of my body. Please first analyze my body type (Ectomorph, Mesomorph, Endomorph, Skinny-Fat, or Athletic Lean) based on the visual evidence." : ""}
      Create a simple, encouraging workout plan and nutritional guide for:
      - Age: ${age}
      - Height: ${height}
      - Weight: ${weight}
      - Body Profile: ${isAIGeneratedBodyType ? "Analyze from image" : bodyType}
      - Goal: ${goal}
      - Training Space: ${trainingLocation}
      - Routine: ${fasting ? "Intermittent Fasting (16:8)" : "Standard eating schedule"}

      Use layman terms. Avoid technical jargon.
      Output the plan in STRICT JSON format (no markdown, no extra text):
      {
        "planTitle": "string",
        "summary": "string",
        "detectedBodyType": "string or null",
        "biometricProjections": {
          "muscleMassDelta": "string",
          "bodyFatDelta": "string",
          "timeline": "12 Weeks"
        },
        "weeklyStructure": [
          {
            "day": "string",
            "focus": "string",
            "exercises": [
              {
                "name": "string",
                "sets": number,
                "reps": "string",
                "rpe": number,
                "notes": "string",
                "videoQuery": "string"
              }
            ]
          }
        ],
        "nutrition": {
          "calories": "string",
          "protein": "string",
          "carbs": "string",
          "fats": "string",
          "advice": "string"
        }
      }

      Generate 4 distinct training days. sets must be an integer 1-20. rpe must be 1-10.
    `;

    // Gemini 2.0 Flash is fast, reliable, and handles both text and vision
    const modelId = "google/gemini-2.0-flash-exp:free";

    const messages = (correctionHint: string) => [
      {
        role: "user" as const,
        content: image ? [
          { type: "text" as const, text: basePrompt + correctionHint },
          { type: "image_url" as const, imageUrl: { url: image } }
        ] : basePrompt + correctionHint
      }
    ];

    const { data: planData, validated, attempts, validationErrors } = await withAIRetry({
      callAI: async (correctionHint) => {
        const response = await withTimeout(
          openrouter.chat.send({
            chatGenerationParams: {
              model: modelId,
              messages: messages(correctionHint),
              max_tokens: 2500,
            }
          }),
          22000 // 22s — leaves headroom within Netlify's 26s limit
        );
        const content = response.choices[0]?.message?.content;
        return typeof content === "string" ? content : "";
      },
      parse: (text) => extractJson(text) as Record<string, unknown>,
      validate: validateWorkoutPlan,
      maxRetries: 1, // max 2 total attempts — keeps total time under 26s
    });

    if (!validated) {
      console.warn(`[generate] Plan returned with validation issues after ${attempts} attempt(s):`, validationErrors);
    }

    const client = await clientPromise;
    const db = client.db("svora_db");

    await db.collection("routines").insertOne({
      userId: session.user.id,
      ...(planData as Record<string, unknown>),
      _aiValidated: validated,
      _aiAttempts: attempts,
      createdAt: new Date()
    });

    return NextResponse.json(planData);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("GENERATE_API_ERROR:", errorMessage);
    return NextResponse.json({ error: errorMessage, success: false }, { status: 500 });
  }
}
