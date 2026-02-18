import type {
  ProviderConfig,
  ProviderName,
  NormalizedActivity,
  NormalizedSleep,
  NormalizedDaily,
  SyncOptions,
  SDKLogger,
  SleepStage,
} from "../../types/index.js";
import type { TokenStore } from "../../core/token-store.js";
import {
  BaseProvider,
  type OAuthEndpoints,
  type AuthMethod,
} from "../../core/base-provider.js";
import {
  FITBIT_AUTHORIZE_URL,
  FITBIT_TOKEN_URL,
  FITBIT_API_BASE,
  FITBIT_DEFAULT_SCOPES,
  FITBIT_ENDPOINTS,
} from "./constants.js";
import type {
  FitbitUserProfile,
  FitbitActivityLogList,
  FitbitSleepResponse,
  FitbitRawSleep,
  FitbitRawActivity,
  FitbitStepsResponse,
  FitbitCaloriesResponse,
  FitbitDistanceResponse,
  FitbitHeartRateResponse,
} from "./types.js";

// ---------------------------------------------------------------------------
// Fitbit Provider — OAuth 2.0, Web API v1/v1.2
// ---------------------------------------------------------------------------

export class FitbitProvider extends BaseProvider {
  readonly name: ProviderName = "fitbit";

  readonly endpoints: OAuthEndpoints = {
    authorizeUrl: FITBIT_AUTHORIZE_URL,
    tokenUrl: FITBIT_TOKEN_URL,
  };

  // Fitbit supports PKCE but doesn't require it — we use it anyway for security
  readonly usePKCE = true;
  readonly authMethod: AuthMethod = "basic";
  readonly defaultScopes = [...FITBIT_DEFAULT_SCOPES];

  constructor(config: ProviderConfig, tokenStore: TokenStore, logger: SDKLogger) {
    super(config, tokenStore, logger);
  }

  // ---------------------------------------------------------------------------
  // User identity
  // ---------------------------------------------------------------------------

  async fetchProviderUserId(accessToken: string): Promise<string | null> {
    try {
      const { data } = await this.http.get<FitbitUserProfile>(
        `${FITBIT_API_BASE}${FITBIT_ENDPOINTS.profile}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      return data.user?.encodedId ?? null;
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Activities
  // ---------------------------------------------------------------------------

  async fetchActivities(
    accessToken: string,
    options: SyncOptions,
  ): Promise<NormalizedActivity[]> {
    const startDate = options.startDate ?? this.defaultStartDate();
    const endDate = options.endDate ?? this.today();

    // Use activity log list endpoint which supports afterDate
    const params = new URLSearchParams({
      afterDate: startDate,
      sort: "asc",
      offset: "0",
      limit: "100",
    });

    const url = `${FITBIT_API_BASE}${FITBIT_ENDPOINTS.activityLogList}?${params}`;

    const { data } = await this.http.get<FitbitActivityLogList>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return (data.activities ?? [])
      .filter((a) => {
        const d = a.startTime.split("T")[0];
        return d >= startDate && d <= endDate;
      })
      .map((a) => this.normalizeActivity(a));
  }

  private normalizeActivity(raw: FitbitRawActivity): NormalizedActivity {
    const durationMs = raw.activeDuration ?? raw.duration;
    const durationSeconds = Math.round(durationMs / 1000);

    const startMs = new Date(raw.startTime).getTime();
    const endTime = new Date(startMs + durationMs).toISOString();

    return {
      id: String(raw.logId),
      provider: "fitbit",
      type: this.mapActivityType(raw.activityName),
      startTime: new Date(raw.startTime).toISOString(),
      endTime,
      durationSeconds,
      calories: raw.calories ?? undefined,
      distanceMeters: raw.distance
        ? raw.distance * 1000 // Fitbit returns km by default
        : undefined,
      steps: raw.steps ?? undefined,
      averageHeartRate: raw.averageHeartRate ?? undefined,
      source: raw.source?.name ?? "fitbit",
      raw,
    };
  }

  private mapActivityType(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes("run")) return "run";
    if (lower.includes("walk")) return "walk";
    if (lower.includes("bike") || lower.includes("cycl")) return "bike";
    if (lower.includes("swim")) return "swim";
    if (lower.includes("yoga")) return "yoga";
    if (lower.includes("hik")) return "hike";
    if (lower.includes("weight") || lower.includes("strength")) return "strength";
    if (lower.includes("elliptical")) return "elliptical";
    return lower.replace(/\s+/g, "_");
  }

  // ---------------------------------------------------------------------------
  // Sleep
  // ---------------------------------------------------------------------------

  async fetchSleep(
    accessToken: string,
    options: SyncOptions,
  ): Promise<NormalizedSleep[]> {
    const startDate = options.startDate ?? this.defaultStartDate();
    const endDate = options.endDate ?? this.today();

    // Fitbit limits sleep range to max 100 days — chunk if needed
    const chunks = this.chunkDateRange(startDate, endDate, 100);
    const allSleep: NormalizedSleep[] = [];

    for (const [s, e] of chunks) {
      const url = `${FITBIT_API_BASE}${FITBIT_ENDPOINTS.sleepRange(s, e)}`;
      const { data } = await this.http.get<FitbitSleepResponse>(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      for (const sleep of data.sleep ?? []) {
        allSleep.push(this.normalizeSleep(sleep));
      }
    }

    return allSleep;
  }

  private normalizeSleep(raw: FitbitRawSleep): NormalizedSleep {
    const stages: SleepStage[] = [];

    if (raw.levels?.data) {
      for (const entry of raw.levels.data) {
        stages.push({
          stage: this.mapSleepStage(entry.level),
          startTime: new Date(entry.dateTime).toISOString(),
          endTime: new Date(
            new Date(entry.dateTime).getTime() + entry.seconds * 1000,
          ).toISOString(),
          durationSeconds: entry.seconds,
        });
      }
    }

    return {
      id: String(raw.logId),
      provider: "fitbit",
      date: raw.dateOfSleep,
      startTime: new Date(raw.startTime).toISOString(),
      endTime: new Date(raw.endTime).toISOString(),
      durationSeconds: Math.round(raw.duration / 1000),
      deepSleepSeconds: raw.levels?.summary?.deep
        ? raw.levels.summary.deep.minutes * 60
        : undefined,
      lightSleepSeconds: raw.levels?.summary?.light
        ? raw.levels.summary.light.minutes * 60
        : undefined,
      remSleepSeconds: raw.levels?.summary?.rem
        ? raw.levels.summary.rem.minutes * 60
        : undefined,
      awakeSeconds: raw.levels?.summary?.wake
        ? raw.levels.summary.wake.minutes * 60
        : undefined,
      sleepScore: raw.efficiency ?? undefined,
      stages: stages.length > 0 ? stages : undefined,
      raw,
    };
  }

  private mapSleepStage(level: string): string {
    const map: Record<string, string> = {
      deep: "deep",
      light: "light",
      rem: "rem",
      wake: "awake",
      awake: "awake",
      restless: "light",
      asleep: "light",
    };
    return map[level.toLowerCase()] ?? level.toLowerCase();
  }

  // ---------------------------------------------------------------------------
  // Dailies — aggregate from time series
  // ---------------------------------------------------------------------------

  async fetchDailies(
    accessToken: string,
    options: SyncOptions,
  ): Promise<NormalizedDaily[]> {
    const startDate = options.startDate ?? this.defaultStartDate();
    const endDate = options.endDate ?? this.today();
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    // Fetch steps, calories, distance, and heart rate in parallel
    const [stepsRes, caloriesRes, distanceRes, hrRes] = await Promise.all([
      this.http.get<FitbitStepsResponse>(
        `${FITBIT_API_BASE}${FITBIT_ENDPOINTS.stepsRange(startDate, endDate)}`,
        { headers: authHeaders },
      ),
      this.http.get<FitbitCaloriesResponse>(
        `${FITBIT_API_BASE}${FITBIT_ENDPOINTS.caloriesRange(startDate, endDate)}`,
        { headers: authHeaders },
      ),
      this.http.get<FitbitDistanceResponse>(
        `${FITBIT_API_BASE}${FITBIT_ENDPOINTS.distanceRange(startDate, endDate)}`,
        { headers: authHeaders },
      ),
      this.http.get<FitbitHeartRateResponse>(
        `${FITBIT_API_BASE}${FITBIT_ENDPOINTS.heartRateRange(startDate, endDate)}`,
        { headers: authHeaders },
      ),
    ]);

    // Build a map by date
    const dateMap = new Map<string, Partial<NormalizedDaily>>();

    for (const entry of stepsRes.data["activities-steps"] ?? []) {
      const d = dateMap.get(entry.dateTime) ?? {};
      d.steps = parseInt(entry.value, 10) || undefined;
      dateMap.set(entry.dateTime, d);
    }

    for (const entry of caloriesRes.data["activities-calories"] ?? []) {
      const d = dateMap.get(entry.dateTime) ?? {};
      d.calories = parseInt(entry.value, 10) || undefined;
      dateMap.set(entry.dateTime, d);
    }

    for (const entry of distanceRes.data["activities-distance"] ?? []) {
      const d = dateMap.get(entry.dateTime) ?? {};
      const km = parseFloat(entry.value);
      d.distanceMeters = km ? km * 1000 : undefined;
      dateMap.set(entry.dateTime, d);
    }

    for (const entry of hrRes.data["activities-heart"] ?? []) {
      const d = dateMap.get(entry.dateTime) ?? {};
      d.restingHeartRate = entry.value.restingHeartRate ?? undefined;
      dateMap.set(entry.dateTime, d);
    }

    // Convert to NormalizedDaily[]
    return Array.from(dateMap.entries()).map(
      ([date, partial]): NormalizedDaily => ({
        id: `fitbit-daily-${date}`,
        provider: "fitbit",
        date,
        steps: partial.steps,
        distanceMeters: partial.distanceMeters,
        calories: partial.calories,
        restingHeartRate: partial.restingHeartRate,
        raw: partial,
      }),
    );
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private today(): string {
    return new Date().toISOString().split("T")[0];
  }

  private defaultStartDate(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  }

  /**
   * Split a date range into chunks of maxDays.
   * Fitbit has max range limits on some endpoints.
   */
  private chunkDateRange(
    start: string,
    end: string,
    maxDays: number,
  ): Array<[string, string]> {
    const chunks: Array<[string, string]> = [];
    let current = new Date(start);
    const endDate = new Date(end);

    while (current <= endDate) {
      const chunkEnd = new Date(current);
      chunkEnd.setDate(chunkEnd.getDate() + maxDays - 1);

      if (chunkEnd > endDate) {
        chunks.push([this.formatDate(current), this.formatDate(endDate)]);
      } else {
        chunks.push([this.formatDate(current), this.formatDate(chunkEnd)]);
      }

      current = new Date(chunkEnd);
      current.setDate(current.getDate() + 1);
    }

    return chunks;
  }

  private formatDate(d: Date): string {
    return d.toISOString().split("T")[0];
  }
}

// Re-export types and constants
export * from "./types.js";
export * from "./constants.js";
