// ---------------------------------------------------------------------------
// Provider Types
// ---------------------------------------------------------------------------

/** Supported wearable provider identifiers */
export type ProviderName = "garmin" | "fitbit";

/** Provider configuration passed at SDK init */
export interface ProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: string[];
}

/** Per-provider SDK init options */
export type ProvidersConfig = Partial<Record<ProviderName, ProviderConfig>>;

// ---------------------------------------------------------------------------
// OAuth Types
// ---------------------------------------------------------------------------

/** OAuth 2.0 token set stored per user+provider */
export interface OAuthTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  scope: string | null;
  tokenType: string;
}

/** The result returned from generating an authorization URL */
export interface AuthUrlResult {
  /** The URL to redirect the user to */
  url: string;
  /** Opaque state parameter (store it — you'll need it in the callback) */
  state: string;
}

/** Raw token endpoint response before normalization */
export interface RawTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

/** The result after processing an OAuth callback */
export interface CallbackResult {
  userId: string;
  provider: ProviderName;
  tokens: OAuthTokens;
  providerUserId: string | null;
}

/** PKCE pair */
export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

/** OAuth state stored while the user is on the provider's consent page */
export interface OAuthPendingState {
  userId: string;
  provider: ProviderName;
  codeVerifier: string | null;
  createdAt: number;
  redirectUri: string;
}

// ---------------------------------------------------------------------------
// Data Types — Normalized (Lightweight)
// ---------------------------------------------------------------------------

/** Normalized activity / workout */
export interface NormalizedActivity {
  id: string;
  provider: ProviderName;
  type: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  durationSeconds: number;
  calories?: number;
  distanceMeters?: number;
  steps?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  source?: string;
  /** Original provider payload — always preserved */
  raw: unknown;
}

/** Normalized sleep session */
export interface NormalizedSleep {
  id: string;
  provider: ProviderName;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  durationSeconds: number;
  deepSleepSeconds?: number;
  lightSleepSeconds?: number;
  remSleepSeconds?: number;
  awakeSeconds?: number;
  sleepScore?: number;
  stages?: SleepStage[];
  raw: unknown;
}

export interface SleepStage {
  stage: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  durationSeconds: number;
}

/** Normalized daily summary */
export interface NormalizedDaily {
  id: string;
  provider: ProviderName;
  date: string; // YYYY-MM-DD
  steps?: number;
  calories?: number;
  distanceMeters?: number;
  activeMinutes?: number;
  restingHeartRate?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  stressLevel?: number;
  floorsClimbed?: number;
  raw: unknown;
}

/** Normalized heart-rate sample */
export interface HeartRateSample {
  timestamp: string; // ISO 8601
  bpm: number;
}

// ---------------------------------------------------------------------------
// Sync Types
// ---------------------------------------------------------------------------

export interface SyncOptions {
  userId: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export interface BackfillOptions {
  userId: string;
  startDate?: string;
  endDate?: string;
  daysBack?: number;
  dataTypes?: Array<"activities" | "sleep" | "dailies">;
}

// ---------------------------------------------------------------------------
// Connection Health
// ---------------------------------------------------------------------------

export type ConnectionStatus =
  | "active"
  | "expired"
  | "revoked"
  | "error"
  | "disconnected";

export interface ConnectionHealth {
  provider: ProviderName;
  userId: string;
  status: ConnectionStatus;
  tokenExpiresAt: Date | null;
  lastSyncAt: Date | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Webhook Types
// ---------------------------------------------------------------------------

export interface WebhookEvent<T = unknown> {
  id: string;
  provider: ProviderName;
  type: string;
  userId: string | null;
  timestamp: Date;
  payload: T;
  raw: unknown;
}

// ---------------------------------------------------------------------------
// SDK Config
// ---------------------------------------------------------------------------

export interface WearableSDKConfig {
  providers: ProvidersConfig;
  /**
   * Token store for persisting OAuth tokens.
   *
   * **Recommended:** Pass your PrismaClient directly via `prisma` option,
   * or wrap it in `new PrismaTokenStore(prisma)` if you prefer explicit control.
   *
   * Defaults to in-memory (dev only — tokens lost on restart).
   */
  tokenStore?: import("../core/token-store").TokenStore;
  /**
   * Shorthand: pass your PrismaClient directly.
   * Equivalent to `tokenStore: new PrismaTokenStore(prisma)`.
   * Requires a `WearableToken` model in your Prisma schema.
   */
  prisma?: import("../stores/prisma-store").PrismaClientLike;
  /** Optional logger */
  logger?: SDKLogger;
  /** Enable debug logging via console */
  debug?: boolean;
  /** State TTL in seconds (default 900 = 15 minutes) */
  stateTTL?: number;
}

export interface SDKLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}
