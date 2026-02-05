/**
 * Authentication Types
 */

export interface LoginRequest {
  email: string;
  password: string;
  iid: string;
  device: 'android' | 'ios' | 'browser';
  rp?: Record<string, unknown>;
}

export interface OrderInfo {
  orderId: number;
  planId: number;
  status: number;
}

export interface MailProperties {
  [key: string]: unknown;
}

export interface LoginResponse {
  session: string;
  is2FAEnabled: boolean;
  aid: number;
  mailId: number;
  bundleId: number;
  clusterId: number;
  baseUrl: string;
  latestTxnId: number;
  mailProperties: MailProperties;
  firstLogin: boolean;
  firstLoginOnTitan: number;
  orders: Record<string, OrderInfo>;
}

export interface AuthError {
  error: string;
  mailSentTo?: string;
  message?: string;
}

export interface SessionData {
  session: string;
  aid: number;
  mailId: number;
  bundleId: number;
  clusterId: number;
  baseUrl: string;
  email: string;
  is2FAEnabled: boolean;
}

export type AuthErrorCode = 
  | 'AccountNotFound'
  | 'DomainNotFound'
  | 'AuthenticationError'
  | 'SuspiciousCountryLogin'
  | 'TooManyRequests'
  | 'NetworkError'
  | 'Unknown';
