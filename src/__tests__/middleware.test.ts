const mockDecrypt = jest.fn();
const mockUpdateSession = jest.fn();

jest.mock('@/lib/auth', () => ({
  decrypt: (...args: any[]) => mockDecrypt(...args),
  updateSession: (...args: any[]) => mockUpdateSession(...args),
}));

import { NextRequest, NextResponse } from 'next/server';
import middleware from '@/middleware';

function makeRequest(path: string, sessionCookie?: string): NextRequest {
  const url = `http://localhost${path}`;
  const headers = new Headers();
  const req = new NextRequest(url, { method: 'GET', headers });
  if (sessionCookie) {
    Object.defineProperty(req.cookies, 'get', {
      value: (name: string) => (name === 'session' ? { value: sessionCookie } : undefined),
      writable: true,
    });
  }
  return req;
}

describe('middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('protected routes', () => {
    it('redirects unauthenticated user from /protocol to /login', async () => {
      const req = makeRequest('/protocol');
      const res = await middleware(req);

      expect(res?.status).toBe(307);
      expect(res?.headers.get('location')).toContain('/login');
    });

    it('redirects unauthenticated user from /uplink to /login', async () => {
      const req = makeRequest('/uplink');
      const res = await middleware(req);

      expect(res?.status).toBe(307);
      expect(res?.headers.get('location')).toContain('/login');
    });

    it('redirects unauthenticated user from /journal to /login', async () => {
      const req = makeRequest('/journal');
      const res = await middleware(req);

      expect(res?.status).toBe(307);
      expect(res?.headers.get('location')).toContain('/login');
    });

    it('allows authenticated user through protected routes', async () => {
      mockDecrypt.mockResolvedValue({ user: { id: '123' } });
      mockUpdateSession.mockResolvedValue(NextResponse.next());

      const req = makeRequest('/protocol', 'valid-session-token');
      const res = await middleware(req);

      expect(res?.status).not.toBe(307);
    });
  });

  describe('public routes', () => {
    it('allows unauthenticated user on /login', async () => {
      const req = makeRequest('/login');
      const res = await middleware(req);

      expect(res?.status).not.toBe(307);
    });

    it('redirects authenticated user away from /login to /protocol', async () => {
      mockDecrypt.mockResolvedValue({ user: { id: '123' } });
      mockUpdateSession.mockResolvedValue(null);

      const req = makeRequest('/login', 'valid-session-token');
      const res = await middleware(req);

      expect(res?.status).toBe(307);
      expect(res?.headers.get('location')).toContain('/protocol');
    });

    it('allows authenticated user to stay on /', async () => {
      mockDecrypt.mockResolvedValue({ user: { id: '123' } });
      mockUpdateSession.mockResolvedValue(NextResponse.next());

      const req = makeRequest('/', 'valid-session-token');
      const res = await middleware(req);

      expect(res?.status).not.toBe(307);
    });
  });

  describe('session handling', () => {
    it('ignores invalid session cookie gracefully', async () => {
      mockDecrypt.mockRejectedValue(new Error('JWT expired'));

      const req = makeRequest('/protocol', 'bad-token');
      const res = await middleware(req);

      expect(res?.status).toBe(307);
      expect(res?.headers.get('location')).toContain('/login');
    });

    it('calls updateSession for authenticated requests', async () => {
      mockDecrypt.mockResolvedValue({ user: { id: '123' } });
      mockUpdateSession.mockResolvedValue(NextResponse.next());

      const req = makeRequest('/protocol', 'valid-token');
      await middleware(req);

      expect(mockUpdateSession).toHaveBeenCalled();
    });
  });
});
