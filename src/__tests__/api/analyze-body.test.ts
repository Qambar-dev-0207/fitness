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

import { POST } from '@/app/api/analyze-body/route';

function makeStream(content: string) {
  return (async function* () {
    yield { choices: [{ delta: { content } }] };
  })();
}

const validBody = {
  beforeImage: 'data:image/jpeg;base64,beforedata',
  currentImage: 'data:image/jpeg;base64,currentdata',
};

const mockAnalysis = {
  muscleMassChange: '+1.5lbs',
  bodyFatChange: '-0.8%',
  postureAnalysis: 'Good alignment',
  routineAdjustments: 'Increase shoulder work',
  motivation: 'Keep going!',
};

function makeRequest(body: object) {
  return new Request('http://localhost/api/analyze-body', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/analyze-body', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await POST(makeRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(mockChatSend).not.toHaveBeenCalled();
  });

  it('returns 400 when images missing', async () => {
    mockGetSession.mockResolvedValue({ user: { id: '123' } });

    const res = await POST(makeRequest({ beforeImage: null, currentImage: null }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Both images are required');
  });

  it('returns 400 when only one image provided', async () => {
    mockGetSession.mockResolvedValue({ user: { id: '123' } });

    const res = await POST(makeRequest({ beforeImage: 'data', currentImage: null }));
    expect(res.status).toBe(400);
  });

  it('returns analysis on valid request', async () => {
    mockGetSession.mockResolvedValue({ user: { id: '123' } });
    mockChatSend.mockImplementation(() => Promise.resolve(makeStream(JSON.stringify(mockAnalysis))));
    mockInsertOne.mockResolvedValue({ insertedId: 'report-id' });

    const res = await POST(makeRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.muscleMassChange).toBe('+1.5lbs');
    expect(data.bodyFatChange).toBe('-0.8%');
  });

  it('saves analysis to DB', async () => {
    mockGetSession.mockResolvedValue({ user: { id: '123' } });
    mockChatSend.mockImplementation(() => Promise.resolve(makeStream(JSON.stringify(mockAnalysis))));
    mockInsertOne.mockResolvedValue({ insertedId: 'id' });

    await POST(makeRequest(validBody));

    expect(mockInsertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        analysis: expect.objectContaining({ muscleMassChange: '+1.5lbs' }),
        createdAt: expect.any(Date),
      })
    );
  });
});
