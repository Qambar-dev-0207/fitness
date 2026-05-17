const mockFindOne = jest.fn();
const mockCookieSet = jest.fn();

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn(),
    set: (...args: any[]) => mockCookieSet(...args),
  }),
}));

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({
    db: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        findOne: (...args: any[]) => mockFindOne(...args),
      }),
    }),
  }),
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

import { POST } from '@/app/api/auth/login/route';
import bcrypt from 'bcryptjs';

function makeRequest(body: object) {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when user not found', async () => {
    mockFindOne.mockResolvedValue(null);

    const res = await POST(makeRequest({ email: 'noone@example.com', password: 'pass' }));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Invalid credentials');
  });

  it('returns 401 when password incorrect', async () => {
    mockFindOne.mockResolvedValue({ _id: 'id1', email: 'user@example.com', password: 'hashed', name: 'User' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const res = await POST(makeRequest({ email: 'user@example.com', password: 'wrong' }));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Invalid credentials');
  });

  it('returns 200 and sets cookie on valid credentials', async () => {
    mockFindOne.mockResolvedValue({
      _id: { toString: () => 'id1' },
      email: 'user@example.com',
      password: 'hashed',
      name: 'User',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const res = await POST(makeRequest({ email: 'user@example.com', password: 'correct' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.email).toBe('user@example.com');
    expect(mockCookieSet).toHaveBeenCalledWith('session', expect.any(String), expect.any(Object));
  });

  it('normalizes email to lowercase', async () => {
    mockFindOne.mockResolvedValue(null);

    await POST(makeRequest({ email: 'USER@EXAMPLE.COM', password: 'pass' }));

    expect(mockFindOne).toHaveBeenCalledWith({ email: 'user@example.com' });
  });

  it('returns 500 on unexpected error', async () => {
    mockFindOne.mockRejectedValue(new Error('DB connection failed'));

    const res = await POST(makeRequest({ email: 'user@example.com', password: 'pass' }));

    expect(res.status).toBe(500);
  });
});
