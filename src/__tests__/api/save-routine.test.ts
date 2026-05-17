const mockGetSession = jest.fn();
const mockInsertOne = jest.fn();

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

import { POST } from '@/app/api/save-routine/route';

const routinePayload = {
  planTitle: 'Test Plan',
  weeklyStructure: [],
  nutrition: {},
};

function makeRequest(body: object) {
  return new Request('http://localhost/api/save-routine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/save-routine', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await POST(makeRequest(routinePayload));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(mockInsertOne).not.toHaveBeenCalled();
  });

  it('saves routine and returns id when authenticated', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-abc' } });
    mockInsertOne.mockResolvedValue({ insertedId: 'routine-xyz' });

    const res = await POST(makeRequest(routinePayload));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('attaches userId to saved routine', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-abc' } });
    mockInsertOne.mockResolvedValue({ insertedId: 'id' });

    await POST(makeRequest(routinePayload));

    expect(mockInsertOne).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-abc', planTitle: 'Test Plan' })
    );
  });

  it('adds createdAt timestamp', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-abc' } });
    mockInsertOne.mockResolvedValue({ insertedId: 'id' });

    await POST(makeRequest(routinePayload));

    expect(mockInsertOne).toHaveBeenCalledWith(
      expect.objectContaining({ createdAt: expect.any(Date) })
    );
  });
});
