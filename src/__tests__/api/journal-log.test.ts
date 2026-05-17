const mockGetSession = jest.fn();
const mockInsertOne = jest.fn();
const mockToArray = jest.fn();

jest.mock('@/lib/auth', () => ({
  getSession: (...args: any[]) => mockGetSession(...args),
}));

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({
    db: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        insertOne: (...args: any[]) => mockInsertOne(...args),
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            toArray: (...args: any[]) => mockToArray(...args),
          }),
        }),
      }),
    }),
  }),
}));

import { POST, GET } from '@/app/api/journal/log/route';

function makePostRequest(body: object) {
  return new Request('http://localhost/api/journal/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const logEntry = { type: 'calorie', cal: '2000', pro: '150' };

describe('POST /api/journal/log', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await POST(makePostRequest(logEntry));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(mockInsertOne).not.toHaveBeenCalled();
  });

  it('creates entry and returns insertedId', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockInsertOne.mockResolvedValue({ insertedId: 'entry-id' });

    const res = await POST(makePostRequest(logEntry));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('attaches userId and createdAt to entry', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockInsertOne.mockResolvedValue({ insertedId: 'id' });

    await POST(makePostRequest(logEntry));

    expect(mockInsertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        type: 'calorie',
        createdAt: expect.any(Date),
      })
    );
  });
});

describe('GET /api/journal/log', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(401);
  });

  it('returns entries for authenticated user', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    const entries = [
      { type: 'calorie', cal: '2000', userId: 'user-1', createdAt: new Date() },
      { type: 'calorie', cal: '1800', userId: 'user-1', createdAt: new Date() },
    ];
    mockToArray.mockResolvedValue(entries);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);
  });
});
