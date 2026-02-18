// ---------------------------------------------------------------------------
// @the-governor-hq/wearable-sdk — main entry point
// ---------------------------------------------------------------------------

// SDK
export { WearableSDK } from "./sdk.js";

// Types
export type {
  ProviderName,
  ProviderConfig,
  WearableSDKConfig,
  OAuthTokens,
  AuthUrlResult,
  CallbackResult,
  RawTokenResponse,
  NormalizedActivity,
  NormalizedSleep,
  NormalizedDaily,
  HeartRateSample,
  SleepStage,
  SyncOptions,
  BackfillOptions,
  ConnectionStatus,
  ConnectionHealth,
  WebhookEvent,
  SDKLogger,
} from "./types/index.js";

// Core
export { BaseProvider } from "./core/base-provider.js";
export type { OAuthEndpoints, AuthMethod } from "./core/base-provider.js";
export type { TokenStore } from "./core/token-store.js";
export { getConnectionHealth } from "./core/token-store.js";
export { HttpClient } from "./core/http-client.js";

// Errors
export {
  WearableSDKError,
  OAuthError,
  TokenExpiredError,
  TokenRefreshError,
  InvalidStateError,
  ProviderAPIError,
  RateLimitError,
  ProviderNotConfiguredError,
  MissingTokenError,
} from "./core/errors.js";

// Providers
export { GarminProvider } from "./providers/garmin/index.js";
export { FitbitProvider } from "./providers/fitbit/index.js";

// Stores
export { PrismaTokenStore } from "./stores/prisma-store.js";
export { MemoryTokenStore } from "./stores/memory-store.js";
export type { PrismaClientLike } from "./stores/prisma-store.js";

// Utils
export { generatePKCE, generateState } from "./utils/pkce.js";
export { noopLogger, consoleLogger } from "./utils/logger.js";
