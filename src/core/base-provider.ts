import type {
  ProviderName,
  ProviderConfig,
  OAuthTokens,
  AuthUrlResult,
  CallbackResult,
  RawTokenResponse,
  OAuthPendingState,
  NormalizedActivity,
  NormalizedSleep,
  NormalizedDaily,
  SyncOptions,
  ConnectionHealth,
  SDKLogger,
} from "../types/index.js";
import type { TokenStore } from "./token-store.js";
import { getConnectionHealth } from "./token-store.js";
import { HttpClient } from "./http-client.js";
import {
  MissingTokenError,
  TokenRefreshError,
  InvalidStateError,
} from "./errors.js";
import { generatePKCE, generateState } from "../utils/pkce.js";

// ---------------------------------------------------------------------------
// Abstract Base Provider — every provider (Garmin, Fitbit, …) extends this
// ---------------------------------------------------------------------------

export interface OAuthEndpoints {
  authorizeUrl: string;
  tokenUrl: string;
}

export type AuthMethod = "body" | "basic";

/**
 * Abstract base class for wearable providers.
 *
 * Handles:
 *  - OAuth authorization URL generation (with optional PKCE)
 *  - Token exchange + refresh
 *  - Token persistence via the pluggable TokenStore
 *  - Authenticated requests with auto-refresh
 *
 * Subclasses implement the abstract members for each specific provider.
 */
export abstract class BaseProvider {
  protected readonly config: ProviderConfig;
  protected readonly tokenStore: TokenStore;
  protected readonly http: HttpClient;
  protected readonly logger: SDKLogger;

  /** State map — key = state string, value = pending state */
  private pendingStates = new Map<string, OAuthPendingState>();
  private stateTTL: number;

  constructor(
    config: ProviderConfig,
    tokenStore: TokenStore,
    logger: SDKLogger,
    stateTTL = 900,
  ) {
    this.config = config;
    this.tokenStore = tokenStore;
    this.logger = logger;
    this.stateTTL = stateTTL;
    // Note: HttpClient is created lazily or on first use via getter
    this.http = new HttpClient("sdk", logger);
  }

  // ---------------------------------------------------------------------------
  // Abstract — provider-specific
  // ---------------------------------------------------------------------------

  abstract readonly name: ProviderName;
  abstract readonly endpoints: OAuthEndpoints;

  /** Whether this provider requires PKCE (e.g. Garmin = true) */
  abstract readonly usePKCE: boolean;

  /** How client credentials are sent in the token request */
  abstract readonly authMethod: AuthMethod;

  /** Additional default scopes for this provider */
  abstract readonly defaultScopes: string[];

  /** Fetch the provider-specific user ID from an access token */
  abstract fetchProviderUserId(accessToken: string): Promise<string | null>;

  /** Fetch activities from this provider */
  abstract fetchActivities(
    accessToken: string,
    options: SyncOptions,
  ): Promise<NormalizedActivity[]>;

  /** Fetch sleep data */
  abstract fetchSleep(
    accessToken: string,
    options: SyncOptions,
  ): Promise<NormalizedSleep[]>;

  /** Fetch daily summaries */
  abstract fetchDailies(
    accessToken: string,
    options: SyncOptions,
  ): Promise<NormalizedDaily[]>;

  // ---------------------------------------------------------------------------
  // OAuth — authorization URL
  // ---------------------------------------------------------------------------

  /**
   * Generate an OAuth authorization URL for the user.
   *
   * Redirect the user to `url`. After consent, they'll be redirected back to
   * your `redirectUri` with `code` and `state` query params.
   */
  getAuthUrl(userId: string): AuthUrlResult {
    const state = generateState();

    const scopes = this.config.scopes ?? this.defaultScopes;

    let codeVerifier: string | null = null;
    let pkceParams = "";

    if (this.usePKCE) {
      const pkce = generatePKCE();
      codeVerifier = pkce.codeVerifier;
      pkceParams = `&code_challenge=${pkce.codeChallenge}&code_challenge_method=S256`;
    }

    // Store pending state
    this.pendingStates.set(state, {
      userId,
      provider: this.name,
      codeVerifier,
      createdAt: Date.now(),
      redirectUri: this.config.redirectUri,
    });

    // Cleanup expired states
    this.pruneStates();

    const url =
      `${this.endpoints.authorizeUrl}?` +
      `response_type=code` +
      `&client_id=${encodeURIComponent(this.config.clientId)}` +
      `&redirect_uri=${encodeURIComponent(this.config.redirectUri)}` +
      `&state=${state}` +
      `&scope=${encodeURIComponent(scopes.join(" "))}` +
      pkceParams;

    return { url, state };
  }

  // ---------------------------------------------------------------------------
  // OAuth — handle callback (exchange code for tokens)
  // ---------------------------------------------------------------------------

  async handleCallback(code: string, state: string): Promise<CallbackResult> {
    // Validate state
    const pending = this.pendingStates.get(state);
    if (!pending) {
      throw new InvalidStateError();
    }
    this.pendingStates.delete(state);

    // Exchange code for tokens
    const tokens = await this.exchangeCode(code, pending.codeVerifier);

    // Save tokens
    await this.tokenStore.save(pending.userId, this.name, tokens);

    // Fetch provider user ID
    let providerUserId: string | null = null;
    try {
      providerUserId = await this.fetchProviderUserId(tokens.accessToken);
    } catch (err) {
      this.logger.warn("Failed to fetch provider user ID", {
        provider: this.name,
        error: String(err),
      });
    }

    this.logger.info(`User ${pending.userId} connected to ${this.name}`, {
      providerUserId,
    });

    return {
      userId: pending.userId,
      provider: this.name,
      tokens,
      providerUserId,
    };
  }

  // ---------------------------------------------------------------------------
  // Token exchange + refresh
  // ---------------------------------------------------------------------------

  private async exchangeCode(
    code: string,
    codeVerifier: string | null,
  ): Promise<OAuthTokens> {
    const body: Record<string, string> = {
      grant_type: "authorization_code",
      code,
      redirect_uri: this.config.redirectUri,
    };

    if (this.usePKCE && codeVerifier) {
      body.code_verifier = codeVerifier;
    }

    if (this.authMethod === "body") {
      body.client_id = this.config.clientId;
      body.client_secret = this.config.clientSecret;
    }

    const headers: Record<string, string> = {};
    if (this.authMethod === "basic") {
      headers.Authorization = `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`;
    }

    const { data } = await this.http.post<RawTokenResponse>(
      this.endpoints.tokenUrl,
      body,
      { headers, contentType: "form" },
    );

    return this.normalizeTokenResponse(data);
  }

  async refreshTokens(userId: string): Promise<OAuthTokens> {
    const current = await this.tokenStore.get(userId, this.name);
    if (!current?.refreshToken) {
      throw new TokenRefreshError(this.name, userId);
    }

    const body: Record<string, string> = {
      grant_type: "refresh_token",
      refresh_token: current.refreshToken,
    };

    if (this.authMethod === "body") {
      body.client_id = this.config.clientId;
      body.client_secret = this.config.clientSecret;
    }

    const headers: Record<string, string> = {};
    if (this.authMethod === "basic") {
      headers.Authorization = `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`;
    }

    try {
      const { data } = await this.http.post<RawTokenResponse>(
        this.endpoints.tokenUrl,
        body,
        { headers, contentType: "form" },
      );

      const tokens = this.normalizeTokenResponse(data);

      // Keep old refresh token if provider didn't issue a new one
      if (!tokens.refreshToken && current.refreshToken) {
        tokens.refreshToken = current.refreshToken;
      }

      await this.tokenStore.save(userId, this.name, tokens);
      this.logger.info(`Refreshed tokens for ${this.name} (user: ${userId})`);
      return tokens;
    } catch (err) {
      throw new TokenRefreshError(this.name, userId, { cause: err });
    }
  }

  // ---------------------------------------------------------------------------
  // Authenticated request helper — auto-refreshes expired tokens
  // ---------------------------------------------------------------------------

  /**
   * Get a valid access token for this user, refreshing if expired.
   */
  async getValidAccessToken(userId: string): Promise<string> {
    const tokens = await this.tokenStore.get(userId, this.name);
    if (!tokens) {
      throw new MissingTokenError(this.name, userId);
    }

    // If token expires within 5 minutes, refresh proactively
    const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000);
    if (tokens.expiresAt < fiveMinFromNow) {
      this.logger.debug(`Token expiring soon for ${this.name} (user: ${userId}), refreshing…`);
      const refreshed = await this.refreshTokens(userId);
      return refreshed.accessToken;
    }

    return tokens.accessToken;
  }

  // ---------------------------------------------------------------------------
  // Public API — data fetching (uses auto-refresh)
  // ---------------------------------------------------------------------------

  async getActivities(options: SyncOptions): Promise<NormalizedActivity[]> {
    const token = await this.getValidAccessToken(options.userId);
    return this.fetchActivities(token, options);
  }

  async getSleep(options: SyncOptions): Promise<NormalizedSleep[]> {
    const token = await this.getValidAccessToken(options.userId);
    return this.fetchSleep(token, options);
  }

  async getDailies(options: SyncOptions): Promise<NormalizedDaily[]> {
    const token = await this.getValidAccessToken(options.userId);
    return this.fetchDailies(token, options);
  }

  // ---------------------------------------------------------------------------
  // Connection management
  // ---------------------------------------------------------------------------

  async getConnectionHealth(userId: string): Promise<ConnectionHealth> {
    const tokens = await this.tokenStore.get(userId, this.name);
    return getConnectionHealth(tokens, this.name, userId);
  }

  async disconnect(userId: string): Promise<void> {
    await this.tokenStore.delete(userId, this.name);
    this.logger.info(`Disconnected ${this.name} for user ${userId}`);
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private normalizeTokenResponse(raw: RawTokenResponse): OAuthTokens {
    return {
      accessToken: raw.access_token,
      refreshToken: raw.refresh_token ?? null,
      expiresAt: new Date(Date.now() + raw.expires_in * 1000),
      scope: raw.scope ?? null,
      tokenType: raw.token_type,
    };
  }

  /** Remove states older than TTL */
  private pruneStates(): void {
    const cutoff = Date.now() - this.stateTTL * 1000;
    for (const [key, val] of this.pendingStates) {
      if (val.createdAt < cutoff) {
        this.pendingStates.delete(key);
      }
    }
  }
}
