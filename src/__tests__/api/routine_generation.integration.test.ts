const mockChatCompletionsCreate = jest.fn();

jest.mock('groq-sdk', () => ({
  Groq: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: (...args: any[]) => mockChatCompletionsCreate(...args),
      }
    },
  })),
}));

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({
    db: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
      }),
    }),
  }),
}));

import { POST } from '@/app/api/generate/route';
import { getSession } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

jest.mock('@/lib/auth');

const mockGetSession = getSession as jest.Mock;

describe('Routine Generation Integration (Groq)', () => {
  let mockInsertOne: jest.Mock;

  beforeAll(() => {
    process.env.GROQ_API_KEY = 'test-key';
  });

  afterAll(() => {
    delete process.env.GROQ_API_KEY;
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const client = await clientPromise;
    const db = client.db('svora_db');
    mockInsertOne = db.collection('routines').insertOne as jest.Mock;
  });

  it('generates a routine successfully with fake human stats using Groq', async () => {
    // Fake human stats
    const fakeStats = {
      age: 30,
      height: '185cm',
      weight: '90kg',
      bodyType: 'Endomorph',
      goal: 'Fat Loss',
      trainingLocation: 'Home',
      fasting: true,
      image: null,
    };

    const mockApiResponse = {
      planTitle: "Home Fat Loss Protocol",
      summary: "A high-intensity home-based protocol designed for fat loss and metabolic efficiency.",
      detectedBodyType: null,
      biometricProjections: {
        muscleMassDelta: "+1lb",
        bodyFatDelta: "-4%",
        timeline: "12 Weeks"
      },
      weeklyStructure: [
        {
          day: "Monday",
          focus: "Full Body HIIT",
          exercises: [
            { name: "Burpees", sets: 4, reps: "15", rpe: 9, notes: "Explosive movement", videoQuery: "burpee form" },
            { name: "Pushups", sets: 3, reps: "20", rpe: 7, notes: "Chest focus", videoQuery: "pushup form" },
            { name: "Mountain Climbers", sets: 3, reps: "45s", rpe: 8, notes: "Core and cardio", videoQuery: "mountain climber form" },
            { name: "Lunges", sets: 3, reps: "12 per leg", rpe: 7, notes: "Leg focus", videoQuery: "lunge form" },
            { name: "Plank Jacks", sets: 3, reps: "30s", rpe: 8, notes: "Core stability", videoQuery: "plank jack form" }
          ]
        },
        {
          day: "Wednesday",
          focus: "Core & Stability",
          exercises: [
            { name: "Plank", sets: 3, reps: "60s", rpe: 7, notes: "Keep back flat", videoQuery: "plank form" },
            { name: "Leg Raises", sets: 3, reps: "15", rpe: 8, notes: "Lower abs", videoQuery: "leg raise form" },
            { name: "Russian Twists", sets: 3, reps: "20 per side", rpe: 7, notes: "Obliques", videoQuery: "russian twist form" },
            { name: "Bicycle Crunches", sets: 3, reps: "20", rpe: 8, notes: "Full core", videoQuery: "bicycle crunch form" },
            { name: "Deadbugs", sets: 3, reps: "10 per side", rpe: 6, notes: "Stability", videoQuery: "deadbug form" }
          ]
        },
        {
          day: "Friday",
          focus: "Lower Body Burn",
          exercises: [
            { name: "Bodyweight Squats", sets: 4, reps: "20", rpe: 8, notes: "Focus on depth", videoQuery: "squat form" },
            { name: "Glute Bridges", sets: 3, reps: "15", rpe: 7, notes: "Squeeze glutes", videoQuery: "glute bridge form" },
            { name: "Walking Lunges", sets: 3, reps: "20 steps", rpe: 8, notes: "Quads and glutes", videoQuery: "walking lunge form" },
            { name: "Calf Raises", sets: 3, reps: "20", rpe: 6, notes: "Slow and controlled", videoQuery: "calf raise form" },
            { name: "Wall Sit", sets: 3, reps: "45s", rpe: 9, notes: "Hold steady", videoQuery: "wall sit form" }
          ]
        },
        {
          day: "Saturday",
          focus: "Active Recovery",
          exercises: [
            { name: "Long Walk", sets: 1, reps: "45 min", rpe: 4, notes: "Steady pace", videoQuery: "walking benefits" },
            { name: "Yoga Flow", sets: 1, reps: "20 min", rpe: 3, notes: "Gentle stretching", videoQuery: "yoga for recovery" },
            { name: "Foam Rolling", sets: 1, reps: "10 min", rpe: 5, notes: "Muscle release", videoQuery: "foam rolling basics" },
            { name: "Static Stretching", sets: 1, reps: "10 min", rpe: 2, notes: "Hold 30s each", videoQuery: "static stretching routine" },
            { name: "Deep Breathing", sets: 1, reps: "5 min", rpe: 1, notes: "Relaxation", videoQuery: "diaphragmatic breathing" }
          ]
        }
      ],
      nutrition: {
        calories: "2200",
        protein: "180g",
        carbs: "150g",
        fats: "70g",
        advice: "Focus on high protein intake to preserve muscle mass during caloric deficit."
      }
    };

    mockGetSession.mockResolvedValue({ user: { id: 'user-999' } });
    
    // Mock the stream response for Groq
    mockChatCompletionsCreate.mockResolvedValue((async function* () {
      yield { choices: [{ delta: { content: JSON.stringify(mockApiResponse) } }] };
    })());

    const req = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fakeStats),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.planTitle).toBe("Home Fat Loss Protocol");
    expect(data.weeklyStructure).toHaveLength(4);
    expect(mockInsertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-999',
        planTitle: "Home Fat Loss Protocol",
      })
    );
  });
});

