/**
 * AI Evaluation Layer
 *
 * Provides schema validation, hallucination guards, and retry logic for all
 * AI-generated responses. Routes call withAIRetry so the system self-corrects
 * before returning bad data to the client.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ── Type definitions ─────────────────────────────────────────────────────────

export interface WorkoutPlan {
  planTitle: string;
  summary: string;
  detectedBodyType: string | null;
  biometricProjections: {
    muscleMassDelta: string;
    bodyFatDelta: string;
    timeline: string;
  };
  weeklyStructure: Array<{
    day: string;
    focus: string;
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      rpe: number;
      notes: string;
      videoQuery: string;
    }>;
  }>;
  nutrition: {
    calories: string;
    protein: string;
    carbs: string;
    fats: string;
    advice: string;
  };
}

export interface BodyAnalysis {
  muscleMassChange: string;
  bodyFatChange: string;
  postureAnalysis: string;
  routineAdjustments: string;
  motivation: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function str(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

function posInt(val: unknown): boolean {
  return typeof val === 'number' && Number.isInteger(val) && val >= 1;
}

// ── Schema validators ─────────────────────────────────────────────────────────

export function validateWorkoutPlan(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Response is not a JSON object'] };
  }

  const d = data as Record<string, unknown>;

  if (!str(d.planTitle)) errors.push('planTitle is missing or empty');
  if (!str(d.summary)) errors.push('summary is missing or empty');

  // biometricProjections
  if (!d.biometricProjections || typeof d.biometricProjections !== 'object') {
    errors.push('biometricProjections block is missing');
  } else {
    const bp = d.biometricProjections as Record<string, unknown>;
    if (!str(bp.muscleMassDelta)) errors.push('biometricProjections.muscleMassDelta is missing');
    if (!str(bp.bodyFatDelta)) errors.push('biometricProjections.bodyFatDelta is missing');
    if (!str(bp.timeline)) errors.push('biometricProjections.timeline is missing');
  }

  // weeklyStructure
  if (!Array.isArray(d.weeklyStructure) || d.weeklyStructure.length === 0) {
    errors.push('weeklyStructure must be a non-empty array');
  } else {
    for (const [i, day] of (d.weeklyStructure as unknown[]).entries()) {
      const dayObj = day as Record<string, unknown>;
      if (!str(dayObj.day)) errors.push(`weeklyStructure[${i}].day is missing`);
      if (!str(dayObj.focus)) errors.push(`weeklyStructure[${i}].focus is missing`);
      if (!Array.isArray(dayObj.exercises) || dayObj.exercises.length === 0) {
        errors.push(`weeklyStructure[${i}].exercises must be a non-empty array`);
      } else {
        for (const [j, ex] of (dayObj.exercises as unknown[]).entries()) {
          const e = ex as Record<string, unknown>;
          if (!str(e.name)) errors.push(`exercise[${i}][${j}].name is missing`);
          if (!posInt(e.sets) || (e.sets as number) > 20) {
            errors.push(`exercise[${i}][${j}].sets must be an integer 1-20 (got ${e.sets})`);
          }
          if (typeof e.rpe === 'number' && (e.rpe < 1 || e.rpe > 10)) {
            errors.push(`exercise[${i}][${j}].rpe must be 1-10 (got ${e.rpe})`);
          }
        }
      }
    }
  }

  // nutrition
  if (!d.nutrition || typeof d.nutrition !== 'object') {
    errors.push('nutrition block is missing');
  } else {
    const n = d.nutrition as Record<string, unknown>;
    if (!str(n.calories)) errors.push('nutrition.calories is missing');
    if (!str(n.protein)) errors.push('nutrition.protein is missing');
    if (!str(n.carbs)) errors.push('nutrition.carbs is missing');
    if (!str(n.fats)) errors.push('nutrition.fats is missing');
    if (!str(n.advice)) errors.push('nutrition.advice is missing');
  }

  return { valid: errors.length === 0, errors };
}

export function validateBodyAnalysis(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Response is not a JSON object'] };
  }

  const d = data as Record<string, unknown>;

  if (!str(d.muscleMassChange)) errors.push('muscleMassChange is missing or empty');
  if (!str(d.bodyFatChange)) errors.push('bodyFatChange is missing or empty');
  if (!str(d.postureAnalysis)) errors.push('postureAnalysis is missing or empty');
  if (!str(d.routineAdjustments)) errors.push('routineAdjustments is missing or empty');
  if (!str(d.motivation)) errors.push('motivation is missing or empty');

  // Hallucination guards: these fields should contain numeric evidence
  if (str(d.muscleMassChange) && !/[\d.]/.test(d.muscleMassChange as string)) {
    errors.push('muscleMassChange lacks numeric data — possible hallucination');
  }
  if (str(d.bodyFatChange) && !/[\d.%]/.test(d.bodyFatChange as string)) {
    errors.push('bodyFatChange lacks numeric or percentage data — possible hallucination');
  }

  return { valid: errors.length === 0, errors };
}

// ── JSON extractor ────────────────────────────────────────────────────────────

export function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object found in AI response');
  return JSON.parse(match[0]);
}

// ── Corrective prompt suffix ───────────────────────────────────────────────────

export function correctionSuffix(errors: string[]): string {
  return (
    '\n\nYour previous response had validation errors:\n' +
    errors.map(e => `  - ${e}`).join('\n') +
    '\n\nPlease correct all issues and return ONLY the valid JSON object — no extra text.'
  );
}

// ── Retry orchestrator ────────────────────────────────────────────────────────

export interface AIRetryResult<T> {
  data: T;
  validated: boolean;
  attempts: number;
  validationErrors: string[];
}

/**
 * Calls `callAI` up to `maxRetries + 1` times. On each failed validation it
 * appends a corrective suffix to the prompt before retrying. Returns the last
 * result even if validation never fully passes (with `validated: false`).
 */
export async function withAIRetry<T>(options: {
  callAI: (correctionHint: string) => Promise<string>;
  parse: (text: string) => T;
  validate: (data: T) => ValidationResult;
  maxRetries?: number;
}): Promise<AIRetryResult<T>> {
  const { callAI, parse, validate, maxRetries = 2 } = options;
  let lastErrors: string[] = [];
  let lastData: T | undefined;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const hint = attempt > 1 ? correctionSuffix(lastErrors) : '';

    let rawText: string;
    try {
      rawText = await callAI(hint);
    } catch (err) {
      if (attempt > maxRetries) throw err;
      lastErrors = [`AI call failed: ${(err as Error).message}`];
      continue;
    }

    let parsed: T;
    try {
      parsed = parse(rawText);
    } catch {
      lastErrors = ['AI response did not contain parseable JSON'];
      if (attempt > maxRetries) {
        throw new Error(`Failed to parse AI response after ${attempt} attempt(s): ${lastErrors[0]}`);
      }
      continue;
    }

    const result = validate(parsed);
    lastData = parsed;

    if (result.valid) {
      return { data: parsed, validated: true, attempts: attempt, validationErrors: [] };
    }

    lastErrors = result.errors;
    if (attempt > maxRetries) {
      console.warn(`[AI Evaluator] Returning best-effort data after ${attempt} attempt(s). Unresolved issues:`, lastErrors);
      return { data: parsed, validated: false, attempts: attempt, validationErrors: lastErrors };
    }
  }

  throw new Error('AI retry loop exhausted');
}
