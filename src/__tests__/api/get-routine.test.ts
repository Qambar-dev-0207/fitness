const mockGetSession = jest.fn();
const mockNext = jest.fn();

jest.mock('@/lib/auth', () => ({
  getSession: (...args: any[]) => mockGetSession(...args),
}));

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({
    db: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              next: (...args: any[]) => mockNext(...args),
            }),
          }),
        }),
      }),
    }),
  }),
}));

import { GET } from '@/app/api/get-routine/route';

describe('GET /api/get-routine', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 when no routine found', async () => {
    mockGetSession.mockResolvedValue({ user: { id: '123' } });
    mockNext.mockResolvedValue(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('No routine found');
  });

  it('returns routine when found', async () => {
    mockGetSession.mockResolvedValue({ user: { id: '123' } });
    const routine = { planTitle: 'My Plan', weeklyStructure: [], userId: '123' };
    mockNext.mockResolvedValue(routine);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.planTitle).toBe('My Plan');
  });

  it('falls back to guest userId when no session', async () => {
    mockGetSession.mockResolvedValue(null);
    mockNext.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(404);
  });
});
