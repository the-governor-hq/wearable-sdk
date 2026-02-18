import type {
  ProviderName,
  WearableSDKConfig,
  AuthUrlResult,
  CallbackResult,
  NormalizedActivity,
  NormalizedSleep,
  NormalizedDaily,
  SyncOptions,
  BackfillOptions,
  ConnectionHealth,
  SDKLogger,
} from "./types/index.js";
import type { TokenStore } from "./core/token-store.js";
import { BaseProvider } from "./core/base-provider.js";
import { GarminProvider } from "./providers/garmin/index.js";
import { FitbitProvider } from "./providers/fitbit/index.js";
import { MemoryTokenStore } from "./stores/memory-store.js";
import { PrismaTokenStore } from "./stores/prisma-store.js";
import { ProviderNotConfiguredError } from "./core/errors.js";
import { noopLogger, consoleLogger } from "./utils/logger.js";

// ---------------------------------------------------------------------------
// WearableSDK — the main entry point
// ---------------------------------------------------------------------------

/**
 * The Wearable SDK.
 *
 * ```ts
 * import { PrismaClient } from "@prisma/client";
 * import { WearableSDK } from "@the-governor-hq/wearable-sdk";
 *
 * const prisma = new PrismaClient();
 *
 * const sdk = new WearableSDK({
 *   prisma, // Tokens stored in your database via Prisma
 *   providers: {
 *     garmin: {
 *       clientId: process.env.GARMIN_CLIENT_ID!,
 *       clientSecret: process.env.GARMIN_CLIENT_SECRET!,
 *       redirectUri: "https://myapp.com/auth/garmin/callback",
 *     },
 *     fitbit: {
 *       clientId: process.env.FITBIT_CLIENT_ID!,
 *       clientSecret: process.env.FITBIT_CLIENT_SECRET!,
 *       redirectUri: "https://myapp.com/auth/fitbit/callback",
 *     },
 *   },
 * });
 *
 * // 1. Generate auth URL → redirect user
 * const { url, state } = sdk.getAuthUrl("garmin", "user-123");
 *
 * // 2. Handle callback → tokens saved automatically
 * const result = await sdk.handleCallback("garmin", code, state);
 *
 * // 3. Fetch data — tokens refresh automatically
 * const activities = await sdk.getActivities("garmin", {
 *   userId: "user-123",
 *   startDate: "2024-01-01",
 *   endDate: "2024-01-31",
 * });
 * ```
 */
export class WearableSDK {
  private providers = new Map<ProviderName, BaseProvider>();
  private tokenStore: TokenStore;
  private logger: SDKLogger;

  constructor(config: WearableSDKConfig) {
    // Resolve token store: explicit > prisma shorthand > memory fallback
    if (config.tokenStore) {
      this.tokenStore = config.tokenStore;
    } else if (config.prisma) {
      this.tokenStore = new PrismaTokenStore(config.prisma);
    } else {
      this.tokenStore = new MemoryTokenStore();
      // Warn in non-test environments
      if (typeof process !== "undefined" && process.env.NODE_ENV !== "test") {
        console.warn(
          "[@the-governor-hq/wearable-sdk] Using in-memory token store — tokens will be lost on restart.\n" +
          "For production, pass your PrismaClient: new WearableSDK({ prisma, providers: { ... } })",
        );
      }
    }
    this.logger = config.debug ? consoleLogger : (config.logger ?? noopLogger);

    // Register configured providers
    if (config.providers.garmin) {
      this.providers.set(
        "garmin",
        new GarminProvider(config.providers.garmin, this.tokenStore, this.logger),
      );
    }

    if (config.providers.fitbit) {
      this.providers.set(
        "fitbit",
        new FitbitProvider(config.providers.fitbit, this.tokenStore, this.logger),
      );
    }

    this.logger.info("WearableSDK initialized", {
      providers: [...this.providers.keys()],
    });
  }

  // ---------------------------------------------------------------------------
  // Provider access
  // ---------------------------------------------------------------------------

  /**
   * Get a specific provider instance.
   * Throws if the provider is not configured.
   */
  provider(name: ProviderName): BaseProvider {
    const p = this.providers.get(name);
    if (!p) throw new ProviderNotConfiguredError(name);
    return p;
  }

  /** List all configured provider names */
  get configuredProviders(): ProviderName[] {
    return [...this.providers.keys()];
  }

  // ---------------------------------------------------------------------------
  // OAuth — auth URL & callback
  // ---------------------------------------------------------------------------

  /**
   * Generate an OAuth authorization URL for the given provider.
   *
   * Redirect the user to the returned `url`. After consent, they'll be
   * redirected back with `code` and `state` query params.
   */
  getAuthUrl(provider: ProviderName, userId: string): AuthUrlResult {
    return this.provider(provider).getAuthUrl(userId);
  }

  /**
   * Exchange an OAuth authorization code for tokens.
   *
   * Call this in your callback route after the user returns from the
   * provider's consent screen.
   */
  async handleCallback(
    provider: ProviderName,
    code: string,
    state: string,
  ): Promise<CallbackResult> {
    return this.provider(provider).handleCallback(code, state);
  }

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  /**
   * Fetch activities from a specific provider.
   * Tokens are refreshed automatically if expired.
   */
  async getActivities(
    provider: ProviderName,
    options: SyncOptions,
  ): Promise<NormalizedActivity[]> {
    return this.provider(provider).getActivities(options);
  }

  /** Fetch sleep data */
  async getSleep(
    provider: ProviderName,
    options: SyncOptions,
  ): Promise<NormalizedSleep[]> {
    return this.provider(provider).getSleep(options);
  }

  /** Fetch daily summaries */
  async getDailies(
    provider: ProviderName,
    options: SyncOptions,
  ): Promise<NormalizedDaily[]> {
    return this.provider(provider).getDailies(options);
  }

  // ---------------------------------------------------------------------------
  // Backfill — fetch historical data
  // ---------------------------------------------------------------------------

  /**
   * Backfill historical data from a provider.
   *
   * Fetches activities, sleep, and dailies for the given date range
   * (default: last 60 days = ~2 months).
   */
  async backfill(
    provider: ProviderName,
    options: BackfillOptions,
  ): Promise<{
    activities: NormalizedActivity[];
    sleep: NormalizedSleep[];
    dailies: NormalizedDaily[];
  }> {
    const daysBack = options.daysBack ?? 60;
    const endDate = options.endDate ?? new Date().toISOString().split("T")[0];
    const startDate =
      options.startDate ??
      (() => {
        const d = new Date();
        d.setDate(d.getDate() - daysBack);
        return d.toISOString().split("T")[0];
      })();

    const syncOptions: SyncOptions = {
      userId: options.userId,
      startDate,
      endDate,
    };

    this.logger.info(`Backfilling ${provider} for user ${options.userId}`, {
      startDate,
      endDate,
      daysBack,
    });

    const dataTypes = options.dataTypes ?? ["activities", "sleep", "dailies"];

    const [activities, sleep, dailies] = await Promise.all([
      dataTypes.includes("activities")
        ? this.getActivities(provider, syncOptions)
        : Promise.resolve([]),
      dataTypes.includes("sleep")
        ? this.getSleep(provider, syncOptions)
        : Promise.resolve([]),
      dataTypes.includes("dailies")
        ? this.getDailies(provider, syncOptions)
        : Promise.resolve([]),
    ]);

    this.logger.info(`Backfill complete for ${provider}`, {
      activities: activities.length,
      sleep: sleep.length,
      dailies: dailies.length,
    });

    return { activities, sleep, dailies };
  }

  // ---------------------------------------------------------------------------
  // Connection management
  // ---------------------------------------------------------------------------

  /**
   * Get the connection health for a provider.
   * Returns status, token expiry info, and whether a refresh is needed.
   */
  async getConnectionHealth(
    provider: ProviderName,
    userId: string,
  ): Promise<ConnectionHealth> {
    return this.provider(provider).getConnectionHealth(userId);
  }

  /**
   * Check connection health for ALL configured providers for a user.
   */
  async getConnectionHealthAll(
    userId: string,
  ): Promise<Record<ProviderName, ConnectionHealth>> {
    const result = {} as Record<ProviderName, ConnectionHealth>;

    for (const [name, p] of this.providers) {
      result[name] = await p.getConnectionHealth(userId);
    }

    return result;
  }

  /**
   * Disconnect a user from a provider (removes stored tokens).
   */
  async disconnect(provider: ProviderName, userId: string): Promise<void> {
    return this.provider(provider).disconnect(userId);
  }

  /**
   * Disconnect a user from ALL configured providers.
   */
  async disconnectAll(userId: string): Promise<void> {
    for (const [, p] of this.providers) {
      await p.disconnect(userId);
    }
  }

  /**
   * Manually refresh tokens for a provider.
   */
  async refreshTokens(provider: ProviderName, userId: string) {
    return this.provider(provider).refreshTokens(userId);
  }
}
