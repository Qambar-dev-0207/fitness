import { encrypt, decrypt } from '@/lib/auth';

const mockCookieSet = jest.fn();
const mockCookieGet = jest.fn();

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: (...args: any[]) => mockCookieGet(...args),
    set: (...args: any[]) => mockCookieSet(...args),
  }),
}));

describe('auth - encrypt / decrypt', () => {
  const payload = { user: { id: '123', name: 'Test User', email: 'test@example.com' } };

  it('returns a JWT string', async () => {
    const token = await encrypt(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('roundtrips payload correctly', async () => {
    const token = await encrypt(payload);
    const decoded = await decrypt(token);
    expect((decoded.user as any).id).toBe('123');
    expect((decoded.user as any).email).toBe('test@example.com');
  });

  it('throws on invalid token', async () => {
    await expect(decrypt('invalid.jwt.token')).rejects.toThrow();
  });

  it('throws on tampered token', async () => {
    const token = await encrypt(payload);
    const parts = token.split('.');
    parts[1] = Buffer.from(JSON.stringify({ user: { id: 'hacker' } })).toString('base64url');
    await expect(decrypt(parts.join('.'))).rejects.toThrow();
  });
});

describe('auth - login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sets session cookie with correct options', async () => {
    const { login } = await import('@/lib/auth');
    await login({ id: '123', name: 'Test', email: 'test@example.com' });

    expect(mockCookieSet).toHaveBeenCalledWith(
      'session',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
      })
    );
  });
});

describe('auth - logout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('clears session cookie', async () => {
    const { logout } = await import('@/lib/auth');
    await logout();

    expect(mockCookieSet).toHaveBeenCalledWith(
      'session',
      '',
      expect.objectContaining({ expires: new Date(0), path: '/' })
    );
  });
});

describe('auth - getSession', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null when no cookie', async () => {
    mockCookieGet.mockReturnValue(undefined);
    const { getSession } = await import('@/lib/auth');
    const session = await getSession();
    expect(session).toBeNull();
  });

  it('returns decoded session when valid cookie present', async () => {
    const payload = { user: { id: '123', name: 'Test', email: 'test@example.com' } };
    const token = await encrypt(payload);
    mockCookieGet.mockReturnValue({ value: token });

    const { getSession } = await import('@/lib/auth');
    const session = await getSession();
    expect(session).not.toBeNull();
    expect((session as any).user.id).toBe('123');
  });

  it('returns null on invalid cookie', async () => {
    mockCookieGet.mockReturnValue({ value: 'bad.token.here' });
    const { getSession } = await import('@/lib/auth');
    const session = await getSession();
    expect(session).toBeNull();
  });
});
