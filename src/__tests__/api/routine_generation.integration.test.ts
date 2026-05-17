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
            { name: "Burpees", sets: 4, reps: "15", rpe: 9, notes: "Explosive movement", videoQuery: "burpee form" }
          ]
        },
        {
          day: "Wednesday",
          focus: "Core & Stability",
          exercises: [
            { name: "Plank", sets: 3, reps: "60s", rpe: 7, notes: "Keep back flat", videoQuery: "plank form" }
          ]
        },
        {
          day: "Friday",
          focus: "Lower Body Burn",
          exercises: [
            { name: "Bodyweight Squats", sets: 4, reps: "20", rpe: 8, notes: "Focus on depth", videoQuery: "squat form" }
          ]
        },
        {
          day: "Saturday",
          focus: "Active Recovery",
          exercises: [
            { name: "Long Walk", sets: 1, reps: "45 min", rpe: 4, notes: "Steady pace", videoQuery: "walking benefits" }
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

