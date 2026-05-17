const mockGetSession = jest.fn();

jest.mock('@/lib/auth', () => ({
  getSession: (...args: any[]) => mockGetSession(...args),
}));

import { GET } from '@/app/api/auth/me/route';

describe('GET /api/auth/me', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Not authenticated');
  });

  it('returns user data when authenticated', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: '123', name: 'Test User', email: 'test@example.com' },
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe('123');
    expect(data.name).toBe('Test User');
    expect(data.email).toBe('test@example.com');
  });
});
