// Integration smoke test — run with `npm run smoke:ai` before every git push.
// Hits Groq directly with the real API key; exits 1 on any failure.

const fs = require("fs");
const path = require("path");

// Load .env.local so the key is available outside Next.js runtime
const envFile = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, "utf8");
  for (const line of content.split("\n")) {
    const eq = line.indexOf("=");
    if (eq > 0) {
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim();
      if (k) {
        process.env[k] = v;
      }
    }
  }
}

const MODEL = "llama-3.3-70b-versatile";
const API_KEY = process.env.GROQ_API_KEY;

if (!API_KEY) {
  console.error("ERROR: Real GROQ_API_KEY required — set it in .env.local");
  process.exit(1);
}

async function run() {
  console.log(`Smoke test — model: ${MODEL}`);
  console.log(`  Key starts with: ${API_KEY.substring(0, 10)}...`);

  const PROMPT = `You are a fitness coach. Return ONLY valid JSON, no markdown fences.
Create a minimal workout plan:
{
  "planTitle": "string",
  "summary": "string",
  "detectedBodyType": null,
  "biometricProjections": { "muscleMassDelta": "string", "bodyFatDelta": "string", "timeline": "12 Weeks" },
  "weeklyStructure": [
    { "day": "Monday", "focus": "string", "exercises": [{ "name": "string", "sets": 3, "reps": "8-10", "rpe": 7, "notes": "string", "videoQuery": "string" }] }
  ],
  "nutrition": { "calories": "string", "protein": "string", "carbs": "string", "fats": "string", "advice": "string" }
}`;

  console.log("  Calling Groq...");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: PROMPT }],
      max_tokens: 800,
      stream: false,
      response_format: { type: "json_object" }
    }),
  });

  const body = await res.json();

  if (!res.ok) {
    console.error(`  FAILED: HTTP ${res.status}`);
    console.error("  Body:", JSON.stringify(body, null, 2));
    process.exit(1);
  }

  const content = body.choices?.[0]?.message?.content ?? "";
  console.log(`  Raw response (${content.length} chars):\n${content.slice(0, 300)}...`);

  let plan;
  try {
    plan = JSON.parse(content);
  } catch (e) {
    console.error("  FAILED: JSON parse error —", e.message);
    process.exit(1);
  }

  // Validate required fields
  const errors = [];
  if (!plan.planTitle) errors.push("missing planTitle");
  if (!plan.summary) errors.push("missing summary");
  if (!Array.isArray(plan.weeklyStructure) || plan.weeklyStructure.length === 0) errors.push("weeklyStructure empty");
  if (!plan.nutrition?.calories) errors.push("missing nutrition.calories");

  if (errors.length) {
    console.error("  FAILED: Schema validation —", errors.join(", "));
    console.error("  Full plan:", JSON.stringify(plan, null, 2));
    process.exit(1);
  }

  console.log(`  planTitle: "${plan.planTitle}"`);
  console.log(`  Days: ${plan.weeklyStructure.length}`);
  console.log("  PASSED: Model is live and schema-valid");
}

run().catch((e) => {
  console.error("  FAILED:", e.message);
  process.exit(1);
});

