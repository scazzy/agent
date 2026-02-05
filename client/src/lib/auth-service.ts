/**
 * Authentication Service
 * Handles login API calls and secure session storage
 */

import {
  LoginRequest,
  LoginResponse,
  SessionData,
  AuthError,
  AuthErrorCode,
} from '../types/auth';

// Staging base URL
const STAGING_BASE_URL = 'https://flockmail-backend.flock-staging.com/fa';

// Session storage key
const SESSION_STORAGE_KEY = 'flockmail_session';

/**
 * Generate a unique installation ID
 */
function generateInstallationId(): string {
  const stored = localStorage.getItem('flockmail_iid');
  if (stored) return stored;

  const iid = `web-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  localStorage.setItem('flockmail_iid', iid);
  return iid;
}

/**
 * Authentication Service Class
 */
export class AuthService {
  private baseUrl: string;

  constructor(baseUrl: string = STAGING_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const request: LoginRequest = {
      email,
      password,
      iid: generateInstallationId(),
      device: 'browser',
    };

    try {
      const response = await fetch(`${this.baseUrl}/mail/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.parseError(response.status, errorData);
      }

      const data: LoginResponse = await response.json();

      // Store session securely
      this.storeSession({
        session: data.session,
        aid: data.aid,
        mailId: data.mailId,
        bundleId: data.bundleId,
        clusterId: data.clusterId,
        baseUrl: data.baseUrl,
        email,
        is2FAEnabled: data.is2FAEnabled,
      });

      return data;
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }
      throw new AuthServiceError('NetworkError', 'Failed to connect to server');
    }
  }

  /**
   * Parse error response
   */
  private parseError(status: number, data: AuthError): AuthServiceError {
    const errorCode = data.error as AuthErrorCode || 'Unknown';

    switch (status) {
      case 401:
        return new AuthServiceError('AuthenticationError', 'Invalid email or password');
      case 403:
        return new AuthServiceError(
          'SuspiciousCountryLogin',
          `Suspicious login detected. Verification email sent to ${data.mailSentTo || 'your email'}`
        );
      case 404:
        if (errorCode === 'DomainNotFound') {
          return new AuthServiceError('DomainNotFound', 'Domain not found');
        }
        return new AuthServiceError('AccountNotFound', 'Account not found');
      case 429:
        return new AuthServiceError('TooManyRequests', 'Too many login attempts. Please try again later.');
      default:
        return new AuthServiceError('Unknown', data.message || 'An unexpected error occurred');
    }
  }

  /**
   * Store session data securely
   * Using sessionStorage for security (cleared when browser closes)
   */
  private storeSession(data: SessionData): void {
    // Store in sessionStorage for security
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Get current session
   */
  getSession(): SessionData | null {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored) as SessionData;
    } catch {
      return null;
    }
  }

  /**
   * Get session token for API calls
   */
  getSessionToken(): string | null {
    const session = this.getSession();
    return session?.session || null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getSession() !== null;
  }

  /**
   * Logout - clear session
   */
  logout(): void {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }

  /**
   * Get auth headers for API requests
   */
  getAuthHeaders(): Record<string, string> {
    const token = this.getSessionToken();
    if (!token) return {};

    return {
      'Authorization': `Bearer ${token}`,
      'X-Session-Token': token,
    };
  }
}

/**
 * Custom error class for auth errors
 */
export class AuthServiceError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'AuthServiceError';
  }
}

// Export singleton instance
export const authService = new AuthService();
