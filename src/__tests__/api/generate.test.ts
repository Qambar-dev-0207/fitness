const mockGetSession = jest.fn();
const mockInsertOne = jest.fn();
const mockChatSend = jest.fn();

jest.mock('@/lib/auth', () => ({
  getSession: (...args: any[]) => mockGetSession(...args),
}));

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({
    db: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        insertOne: (...args: any[]) => mockInsertOne(...args),
      }),
    }),
  }),
}));

jest.mock('@openrouter/sdk', () => ({
  OpenRouter: jest.fn().mockImplementation(() => ({
    chat: { send: (...args: any[]) => mockChatSend(...args) },
  })),
}));

import { POST } from '@/app/api/generate/route';

const validBody = {
  age: '25',
  height: '180cm',
  weight: '75kg',
  bodyType: 'Athletic',
  goal: 'Build Muscle',
  trainingLocation: 'Commercial Gym',
  fasting: false,
  image: null,
};

const mockPlan = {
  planTitle: 'Strength Plan',
  summary: 'A great plan',
  detectedBodyType: null,
  biometricProjections: { muscleMassDelta: '+2lbs', bodyFatDelta: '-1%', timeline: '12 Weeks' },
  weeklyStructure: [],
  nutrition: { calories: '2500', protein: '180g', carbs: '300g', fats: '80g', advice: 'Eat well' },
};

function makeRequest(body: object) {
  return new Request('http://localhost/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/generate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await POST(makeRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(mockChatSend).not.toHaveBeenCalled();
  });

  it('returns 500 when OPENROUTER_API_KEY missing', async () => {
    const original = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    mockGetSession.mockResolvedValue({ user: { id: '123' } });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);

    process.env.OPENROUTER_API_KEY = original;
  });

  it('returns plan data on successful generation', async () => {
    mockGetSession.mockResolvedValue({ user: { id: '123' } });
    mockChatSend.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(mockPlan) } }],
    });
    mockInsertOne.mockResolvedValue({ insertedId: 'routine-id' });

    const res = await POST(makeRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.planTitle).toBe('Strength Plan');
  });

  it('saves plan to DB with userId', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-123' } });
    mockChatSend.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(mockPlan) } }],
    });
    mockInsertOne.mockResolvedValue({ insertedId: 'id' });

    await POST(makeRequest(validBody));

    expect(mockInsertOne).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-123', planTitle: 'Strength Plan' })
    );
  });

  it('handles malformed AI JSON response gracefully', async () => {
    mockGetSession.mockResolvedValue({ user: { id: '123' } });
    mockChatSend.mockResolvedValue({
      choices: [{ message: { content: 'not json at all' } }],
    });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
  });
});
