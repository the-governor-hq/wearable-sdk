import type { ProviderName, ConnectionStatus } from "../types/index.js";

// ---------------------------------------------------------------------------
// Base Error
// ---------------------------------------------------------------------------

export class WearableSDKError extends Error {
  public readonly code: string;
  public readonly provider: ProviderName | null;
  public readonly meta: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    options?: {
      provider?: ProviderName;
      meta?: Record<string, unknown>;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "WearableSDKError";
    this.code = code;
    this.provider = options?.provider ?? null;
    this.meta = options?.meta ?? {};
  }
}

// ---------------------------------------------------------------------------
// Auth Errors
// ---------------------------------------------------------------------------

export class OAuthError extends WearableSDKError {
  constructor(
    message: string,
    options?: {
      provider?: ProviderName;
      meta?: Record<string, unknown>;
      cause?: unknown;
    },
  ) {
    super("OAUTH_ERROR", message, options);
    this.name = "OAuthError";
  }
}

export class TokenExpiredError extends WearableSDKError {
  public readonly connectionStatus: ConnectionStatus;

  constructor(
    provider: ProviderName,
    userId: string,
    options?: { cause?: unknown },
  ) {
    super(
      "TOKEN_EXPIRED",
      `Access token expired for ${provider} (user: ${userId}). Attempting refresh…`,
      { provider, meta: { userId }, cause: options?.cause },
    );
    this.name = "TokenExpiredError";
    this.connectionStatus = "expired";
  }
}

export class TokenRefreshError extends WearableSDKError {
  constructor(
    provider: ProviderName,
    userId: string,
    options?: { cause?: unknown },
  ) {
    super(
      "TOKEN_REFRESH_FAILED",
      `Failed to refresh token for ${provider} (user: ${userId}). User needs to reconnect.`,
      { provider, meta: { userId }, cause: options?.cause },
    );
    this.name = "TokenRefreshError";
  }
}

export class InvalidStateError extends WearableSDKError {
  constructor(options?: { cause?: unknown }) {
    super(
      "INVALID_STATE",
      "OAuth state parameter is invalid or expired. The user may need to restart the auth flow.",
      { cause: options?.cause },
    );
    this.name = "InvalidStateError";
  }
}

// ---------------------------------------------------------------------------
// API Errors
// ---------------------------------------------------------------------------

export class ProviderAPIError extends WearableSDKError {
  public readonly statusCode: number;
  public readonly responseBody: unknown;

  constructor(
    provider: string,
    statusCode: number,
    responseBody: unknown,
    options?: { cause?: unknown },
  ) {
    const msg =
      statusCode === 429
        ? `Rate limited by ${provider}. Retry after backoff.`
        : `${provider} API returned HTTP ${statusCode}.`;

    super("PROVIDER_API_ERROR", msg, {
      provider: provider as ProviderName,
      meta: { statusCode, responseBody },
      cause: options?.cause,
    });
    this.name = "ProviderAPIError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

export class RateLimitError extends ProviderAPIError {
  public readonly retryAfterSeconds: number | null;

  constructor(
    provider: string,
    retryAfterSeconds: number | null,
    responseBody?: unknown,
  ) {
    super(provider, 429, responseBody ?? null);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

// ---------------------------------------------------------------------------
// Config Errors
// ---------------------------------------------------------------------------

export class ProviderNotConfiguredError extends WearableSDKError {
  constructor(provider: ProviderName) {
    super(
      "PROVIDER_NOT_CONFIGURED",
      `Provider "${provider}" is not configured. Pass its config in WearableSDK({ providers: { ${provider}: { … } } }).`,
      { provider },
    );
    this.name = "ProviderNotConfiguredError";
  }
}

export class MissingTokenError extends WearableSDKError {
  constructor(provider: ProviderName, userId: string) {
    super(
      "MISSING_TOKEN",
      `No tokens found for ${provider} (user: ${userId}). Has the user connected?`,
      { provider, meta: { userId } },
    );
    this.name = "MissingTokenError";
  }
}
