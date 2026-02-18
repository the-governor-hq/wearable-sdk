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
  GARMIN_AUTHORIZE_URL,
  GARMIN_TOKEN_URL,
  GARMIN_API_BASE,
  GARMIN_DEFAULT_SCOPES,
  GARMIN_ENDPOINTS,
} from "./constants.js";
import type {
  GarminRawActivity,
  GarminRawSleep,
  GarminRawDaily,
  GarminUserProfile,
} from "./types.js";

// ---------------------------------------------------------------------------
// Garmin Provider — OAuth 2.0 + PKCE, Wellness API
// ---------------------------------------------------------------------------

export class GarminProvider extends BaseProvider {
  readonly name: ProviderName = "garmin";

  readonly endpoints: OAuthEndpoints = {
    authorizeUrl: GARMIN_AUTHORIZE_URL,
    tokenUrl: GARMIN_TOKEN_URL,
  };

  readonly usePKCE = true;
  readonly authMethod: AuthMethod = "body";
  readonly defaultScopes = [...GARMIN_DEFAULT_SCOPES];

  constructor(config: ProviderConfig, tokenStore: TokenStore, logger: SDKLogger) {
    super(config, tokenStore, logger);
  }

  // ---------------------------------------------------------------------------
  // User identity
  // ---------------------------------------------------------------------------

  async fetchProviderUserId(accessToken: string): Promise<string | null> {
    try {
      const { data } = await this.http.get<GarminUserProfile>(
        `${GARMIN_API_BASE}${GARMIN_ENDPOINTS.userProfile}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      return data.userId ?? null;
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
    const params = this.buildTimeParams(options);
    const url = `${GARMIN_API_BASE}${GARMIN_ENDPOINTS.activities}?${params}`;

    const { data } = await this.http.get<GarminRawActivity[]>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return (data ?? []).map((a) => this.normalizeActivity(a));
  }

  private normalizeActivity(raw: GarminRawActivity): NormalizedActivity {
    return {
      id: String(raw.activityId),
      provider: "garmin",
      type: this.mapActivityType(raw.activityType),
      startTime: new Date(raw.startTimeInSeconds * 1000).toISOString(),
      endTime: new Date(
        (raw.startTimeInSeconds + raw.durationInSeconds) * 1000,
      ).toISOString(),
      durationSeconds: raw.durationInSeconds,
      calories: raw.activeKilocalories ?? undefined,
      distanceMeters: raw.distanceInMeters ?? undefined,
      steps: raw.steps ?? undefined,
      averageHeartRate: raw.averageHeartRateInBeatsPerMinute ?? undefined,
      maxHeartRate: raw.maxHeartRateInBeatsPerMinute ?? undefined,
      source: raw.deviceName ?? "garmin",
      raw,
    };
  }

  private mapActivityType(garminType: string): string {
    const map: Record<string, string> = {
      RUNNING: "run",
      CYCLING: "bike",
      SWIMMING: "swim",
      WALKING: "walk",
      HIKING: "hike",
      STRENGTH_TRAINING: "strength",
      YOGA: "yoga",
      INDOOR_CYCLING: "bike_indoor",
      TREADMILL_RUNNING: "run_indoor",
      ELLIPTICAL: "elliptical",
    };
    return map[garminType] ?? garminType.toLowerCase();
  }

  // ---------------------------------------------------------------------------
  // Sleep
  // ---------------------------------------------------------------------------

  async fetchSleep(
    accessToken: string,
    options: SyncOptions,
  ): Promise<NormalizedSleep[]> {
    const params = this.buildTimeParams(options);
    const url = `${GARMIN_API_BASE}${GARMIN_ENDPOINTS.sleeps}?${params}`;

    const { data } = await this.http.get<GarminRawSleep[]>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return (data ?? []).map((s) => this.normalizeSleep(s));
  }

  private normalizeSleep(raw: GarminRawSleep): NormalizedSleep {
    const stages: SleepStage[] = [];
    if (raw.sleepLevelsMap) {
      for (const [level, periods] of Object.entries(raw.sleepLevelsMap)) {
        for (const p of periods) {
          stages.push({
            stage: this.mapSleepStage(level),
            startTime: new Date(p.startTimeInSeconds * 1000).toISOString(),
            endTime: new Date(p.endTimeInSeconds * 1000).toISOString(),
            durationSeconds: p.endTimeInSeconds - p.startTimeInSeconds,
          });
        }
      }
      stages.sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
    }

    return {
      id: raw.summaryId ?? raw.calendarDate,
      provider: "garmin",
      date: raw.calendarDate,
      startTime: new Date(raw.startTimeInSeconds * 1000).toISOString(),
      endTime: new Date(
        (raw.startTimeInSeconds + raw.durationInSeconds) * 1000,
      ).toISOString(),
      durationSeconds: raw.durationInSeconds,
      deepSleepSeconds: raw.deepSleepDurationInSeconds ?? undefined,
      lightSleepSeconds: raw.lightSleepDurationInSeconds ?? undefined,
      remSleepSeconds: raw.remSleepInSeconds ?? undefined,
      awakeSeconds: raw.awakeDurationInSeconds ?? undefined,
      sleepScore: raw.overallSleepScore?.value ?? undefined,
      stages: stages.length > 0 ? stages : undefined,
      raw,
    };
  }

  private mapSleepStage(garminStage: string): string {
    const map: Record<string, string> = {
      deep: "deep",
      light: "light",
      rem: "rem",
      awake: "awake",
    };
    return map[garminStage.toLowerCase()] ?? garminStage.toLowerCase();
  }

  // ---------------------------------------------------------------------------
  // Dailies
  // ---------------------------------------------------------------------------

  async fetchDailies(
    accessToken: string,
    options: SyncOptions,
  ): Promise<NormalizedDaily[]> {
    const params = this.buildTimeParams(options);
    const url = `${GARMIN_API_BASE}${GARMIN_ENDPOINTS.dailies}?${params}`;

    const { data } = await this.http.get<GarminRawDaily[]>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return (data ?? []).map((d) => this.normalizeDaily(d));
  }

  private normalizeDaily(raw: GarminRawDaily): NormalizedDaily {
    return {
      id: raw.summaryId ?? raw.calendarDate,
      provider: "garmin",
      date: raw.calendarDate,
      steps: raw.steps ?? undefined,
      distanceMeters: raw.distanceInMeters ?? undefined,
      calories: raw.activeKilocalories ?? undefined,
      activeMinutes:
        raw.activeTimeInSeconds != null
          ? Math.round(raw.activeTimeInSeconds / 60)
          : undefined,
      restingHeartRate: raw.restingHeartRateInBeatsPerMinute ?? undefined,
      averageHeartRate: raw.averageHeartRateInBeatsPerMinute ?? undefined,
      maxHeartRate: raw.maxHeartRateInBeatsPerMinute ?? undefined,
      stressLevel: raw.averageStressLevel ?? undefined,
      floorsClimbed: raw.floorsClimbed ?? undefined,
      raw,
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Build Garmin upload time params.
   * Garmin uses uploadStartTimeInSeconds / uploadEndTimeInSeconds (Unix epoch).
   */
  private buildTimeParams(options: SyncOptions): URLSearchParams {
    const params = new URLSearchParams();

    const start = options.startDate
      ? Math.floor(new Date(options.startDate).getTime() / 1000)
      : Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000); // default: 24h ago

    const end = options.endDate
      ? Math.floor(new Date(options.endDate).getTime() / 1000)
      : Math.floor(Date.now() / 1000);

    params.set("uploadStartTimeInSeconds", String(start));
    params.set("uploadEndTimeInSeconds", String(end));

    return params;
  }
}

// Re-export types for convenience
export * from "./types.js";
export * from "./constants.js";
