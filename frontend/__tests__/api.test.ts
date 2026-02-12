/**
 * Frontend API client tests (mocked fetch and AsyncStorage).
 */
const mockFetch = jest.fn();
const mockGetItem = jest.fn();

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock global fetch
global.fetch = mockFetch as unknown as typeof fetch;
(global as any).__DEV__ = true;

beforeEach(() => {
  mockFetch.mockReset();
  mockGetItem.mockReset();
});

describe('API client', () => {
  it('should build correct URL and return JSON on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'OK' }),
    });
    const { apiRequest } = require('../utils/api');
    const result = await apiRequest('/api/health');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/health$/),
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    );
    expect(result).toEqual({ status: 'OK' });
  });

  it('should throw with message and status when response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Invalid credentials' }),
    });
    const { apiRequest } = require('../utils/api');
    await expect(
      apiRequest('/api/auth/login', { method: 'POST', body: '{}' })
    ).rejects.toMatchObject({
      message: 'Invalid credentials',
      status: 401,
    });
  });

  it('should add Bearer token when skipAuth is false and JWT in storage', async () => {
    mockGetItem.mockResolvedValueOnce(
      JSON.stringify({ token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx' })
    );
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: {} }),
    });
    const { apiRequest } = require('../utils/api');
    await apiRequest('/api/auth/me');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx',
        }),
      })
    );
  });

  it('should not add Authorization when skipAuth is true', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'jwt', user: {} }),
    });
    const { apiRequest } = require('../utils/api');
    await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', password: 'p' }),
      skipAuth: true,
    });
    const call = mockFetch.mock.calls[0][1];
    expect(call.headers).not.toHaveProperty('Authorization');
  });
});
