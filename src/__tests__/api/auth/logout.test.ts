const mockCookieSet = jest.fn();

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn(),
    set: (...args: any[]) => mockCookieSet(...args),
  }),
}));

import { POST } from '@/app/api/auth/logout/route';

describe('POST /api/auth/logout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns success', async () => {
    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('clears the session cookie', async () => {
    await POST();

    expect(mockCookieSet).toHaveBeenCalledWith(
      'session',
      '',
      expect.objectContaining({ expires: new Date(0), path: '/' })
    );
  });
});
