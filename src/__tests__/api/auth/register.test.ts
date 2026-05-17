const mockFindOne = jest.fn();
const mockInsertOne = jest.fn();
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
        insertOne: (...args: any[]) => mockInsertOne(...args),
      }),
    }),
  }),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

import { POST } from '@/app/api/auth/register/route';
import bcrypt from 'bcryptjs';

function makeRequest(body: object) {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when email already exists', async () => {
    mockFindOne.mockResolvedValue({ email: 'exists@example.com' });

    const res = await POST(makeRequest({ name: 'User', email: 'exists@example.com', password: 'pass' }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('User already exists');
  });

  it('creates user and returns 200 for new email', async () => {
    mockFindOne.mockResolvedValue(null);
    mockInsertOne.mockResolvedValue({ insertedId: { toString: () => 'newid' } });

    const res = await POST(makeRequest({ name: 'New User', email: 'new@example.com', password: 'pass123' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.email).toBe('new@example.com');
    expect(data.user.name).toBe('New User');
  });

  it('hashes password before storing', async () => {
    mockFindOne.mockResolvedValue(null);
    mockInsertOne.mockResolvedValue({ insertedId: { toString: () => 'id' } });

    await POST(makeRequest({ name: 'User', email: 'test@example.com', password: 'plaintext' }));

    expect(bcrypt.hash).toHaveBeenCalledWith('plaintext', 10);
    expect(mockInsertOne).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'hashed_password' })
    );
  });

  it('does not include password in response', async () => {
    mockFindOne.mockResolvedValue(null);
    mockInsertOne.mockResolvedValue({ insertedId: { toString: () => 'id' } });

    const res = await POST(makeRequest({ name: 'User', email: 'test@example.com', password: 'secret' }));
    const data = await res.json();

    expect(data.user.password).toBeUndefined();
  });

  it('sets session cookie after registration', async () => {
    mockFindOne.mockResolvedValue(null);
    mockInsertOne.mockResolvedValue({ insertedId: { toString: () => 'id' } });

    await POST(makeRequest({ name: 'User', email: 'new@example.com', password: 'pass' }));

    expect(mockCookieSet).toHaveBeenCalledWith('session', expect.any(String), expect.any(Object));
  });

  it('normalizes email to lowercase', async () => {
    mockFindOne.mockResolvedValue(null);
    mockInsertOne.mockResolvedValue({ insertedId: { toString: () => 'id' } });

    await POST(makeRequest({ name: 'User', email: 'UPPER@EXAMPLE.COM', password: 'pass' }));

    expect(mockFindOne).toHaveBeenCalledWith({ email: 'upper@example.com' });
    expect(mockInsertOne).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'upper@example.com' })
    );
  });
});
