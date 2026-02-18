import type { OAuthTokens, ProviderName, ConnectionHealth } from "../types/index.js";

// ---------------------------------------------------------------------------
// Token Store — pluggable persistence for OAuth tokens
// ---------------------------------------------------------------------------

/**
 * Interface every token store must implement.
 *
 * Built-in stores: MemoryTokenStore, RedisTokenStore (optional peer dep).
 * You can also provide your own (Postgres, Drizzle, Prisma, etc.).
 */
export interface TokenStore {
  /** Persist tokens for a user + provider pair. */
  save(userId: string, provider: ProviderName, tokens: OAuthTokens): Promise<void>;

  /** Retrieve tokens. Returns `null` when no tokens exist. */
  get(userId: string, provider: ProviderName): Promise<OAuthTokens | null>;

  /** Remove tokens (disconnect). */
  delete(userId: string, provider: ProviderName): Promise<void>;

  /** Check whether a connection exists at all. */
  has(userId: string, provider: ProviderName): Promise<boolean>;
}

/**
 * Compute a connection-health summary from stored tokens.
 * Usable with any `TokenStore` implementation.
 */
export function getConnectionHealth(
  tokens: OAuthTokens | null,
  provider: ProviderName,
  userId: string,
): ConnectionHealth {
  if (!tokens) {
    return {
      provider,
      userId,
      status: "disconnected",
      tokenExpiresAt: null,
      lastSyncAt: null,
      error: null,
    };
  }

  const now = new Date();
  const expired = tokens.expiresAt < now;

  return {
    provider,
    userId,
    status: expired ? "expired" : "active",
    tokenExpiresAt: tokens.expiresAt,
    lastSyncAt: null, // caller can enrich
    error: expired ? "Access token expired — refresh or reconnect." : null,
  };
}
