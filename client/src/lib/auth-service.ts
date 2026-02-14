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

// Environment URLs
const STAGING_LOGIN_URL = 'https://flockmail-backend.flock-staging.com/fa';
const PRODUCTION_LOGIN_URL = 'https://api.titan.email/fa';

// Determine environment (can be overridden via localStorage for testing)
const getEnvironment = (): 'staging' | 'production' => {
  const override = localStorage.getItem('titan_env');
  if (override === 'production' || override === 'staging') return override;
  
  // Default to staging for now (change to 'production' when ready)
  return 'staging';
};

const getLoginBaseUrl = (): string => {
  return getEnvironment() === 'production' ? PRODUCTION_LOGIN_URL : STAGING_LOGIN_URL;
};

// Session storage key
const SESSION_STORAGE_KEY = 'flockmail_session';

/**
 * Generate a unique installation ID (format: Chrome-browser-timestamp)
 */
function generateInstallationId(): string {
  const stored = localStorage.getItem('titan_iid');
  if (stored) return stored;

  const browserName = getBrowserName();
  const iid = `${browserName}-browser-${Date.now()}`;
  localStorage.setItem('titan_iid', iid);
  return iid;
}

/**
 * Generate a client request ID
 */
function generateCrid(): string {
  const now = new Date();
  const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const random = Math.random().toString(36).substring(2, 6);
  return `w_${dateStr}_MAR_9_123_${random}`;
}

/**
 * Get browser name
 */
function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Browser';
}

/**
 * Get browser version
 */
function getBrowserVersion(): string {
  const ua = navigator.userAgent;
  const match = ua.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
  return match ? match[2] : '100';
}

/**
 * Build x-user-agent header
 */
function buildXUserAgent(): string {
  const browserName = getBrowserName();
  const browserVersion = getBrowserVersion();
  return `os=MacOS;os-version=10_15_7;app-version=5.56.0;locale=${navigator.language || 'en-US'};browser-version=${browserVersion};browser-name=${browserName};tp=titan;client=web_mail`;
}

/**
 * Authentication Service Class
 */
export class AuthService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getLoginBaseUrl();
  }

  /**
   * Get current environment
   */
  getEnvironment(): 'staging' | 'production' {
    return getEnvironment();
  }

  /**
   * Set environment (for testing)
   */
  static setEnvironment(env: 'staging' | 'production'): void {
    localStorage.setItem('titan_env', env);
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
      crid: generateCrid(),
      rp: { brand: 'Titan' },
    };

    try {
      const response = await fetch(`${this.baseUrl}/mail/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'x-tth': '0:1',
          'x-user-agent': buildXUserAgent(),
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
