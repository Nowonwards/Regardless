import { getAppUrl } from '@/lib/url';

describe('getAppUrl utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.APP_URL;
    delete process.env.VERCEL;
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_ENV;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses NEXT_PUBLIC_APP_URL when defined in environment', () => {
    // Arrange
    process.env.NEXT_PUBLIC_APP_URL = 'https://regardless-three.vercel.app';

    // Act
    const url = getAppUrl();

    // Assert
    expect(url).toBe('https://regardless-three.vercel.app');
  });

  it('strips trailing slashes from environment URL', () => {
    // Arrange
    process.env.NEXT_PUBLIC_APP_URL = 'https://regardless-three.vercel.app/';

    // Act
    const url = getAppUrl();

    // Assert
    expect(url).toBe('https://regardless-three.vercel.app');
  });

  it('falls back to request origin if localhost is present in Vercel environment', () => {
    // Arrange
    process.env.VERCEL = '1';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    const mockRequest = {
      headers: {
        get: (header: string) => {
          if (header === 'origin') {
            return 'https://regardless-preview-branch.vercel.app';
          }
          return null;
        },
      },
    };

    // Act
    const url = getAppUrl(mockRequest as unknown as Request);

    // Assert
    expect(url).toBe('https://regardless-preview-branch.vercel.app');
  });

  it('resolves host from request headers when origin is missing', () => {
    // Arrange
    const mockRequest = {
      headers: {
        get: (header: string) => {
          if (header === 'x-forwarded-host') {
            return 'regardless-custom.vercel.app';
          }
          if (header === 'x-forwarded-proto') {
            return 'https';
          }
          return null;
        },
      },
    };

    // Act
    const url = getAppUrl(mockRequest as unknown as Request);

    // Assert
    expect(url).toBe('https://regardless-custom.vercel.app');
  });

  it('falls back to VERCEL_URL if no request or custom env is set', () => {
    // Arrange
    process.env.VERCEL_URL = 'regardless-git-develop.vercel.app';

    // Act
    const url = getAppUrl();

    // Assert
    expect(url).toBe('https://regardless-git-develop.vercel.app');
  });

  it('defaults to http://localhost:3000 in local development without environment variables', () => {
    // Arrange & Act
    const url = getAppUrl();

    // Assert
    expect(url).toBe('http://localhost:3000');
  });
});
