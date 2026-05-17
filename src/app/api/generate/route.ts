import { OpenRouter } from "@openrouter/sdk";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || ""
});

export const dynamic = 'force-dynamic';

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

    const prompt = `
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
      Output the plan in STRICT JSON format:
      {
        "planTitle": "string",
        "summary": "string",
        "detectedBodyType": "string (only if image was provided, else null)",
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

      Generate 4 distinct training days. Focus on clarity and motivation.
    `;

    // Use Trinity Large for text generation primarily, fallback to Gemini 2.0 Flash for vision
    const modelId = image ? "google/gemini-2.0-flash-exp:free" : "arcee-ai/trinity-large-preview:free";

    const messages = [
      {
        role: "user" as const,
        content: image ? [
          { type: "text" as const, text: prompt },
          { type: "image_url" as const, imageUrl: { url: image } }
        ] : prompt
      }
    ];

    const response = await openrouter.chat.send({
      chatGenerationParams: {
        model: modelId,
        messages: messages,
      }
    });

    const content = response.choices[0]?.message?.content;
    const fullResponse = typeof content === "string" ? content : "";
    
    // Attempt to extract JSON from the response
    let planData;
    try {
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      planData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(fullResponse);
    } catch (parseError: unknown) {
      const error = parseError as Error;
      console.error("JSON Parse Error. Raw Response:", fullResponse, "Error:", error.message);
      throw new Error(`AI Response Parsing Failed: ${error.message}`);
    }

    // Persist to database
    const client = await clientPromise;
    const db = client.db("svora_db");
    
    await db.collection("routines").insertOne({
      userId: session.user.id,
      ...planData,
      createdAt: new Date()
    });

    return NextResponse.json(planData);
  } catch (e: unknown) {
    let errorMessage = "Failed to generate wellness protocol";
    let errorStack = "";
    let errorDetails: unknown = null;

    if (e instanceof Error) {
      errorMessage = e.message;
      errorStack = e.stack || "";
      errorDetails = (e as Record<string, any>).response?.data || null;
    } else {
      errorMessage = String(e);
    }

    console.error("GENERATE_API_CRITICAL_ERROR:", {
      message: errorMessage,
      stack: errorStack,
      details: errorDetails
    });

    return new NextResponse(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        success: false
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
