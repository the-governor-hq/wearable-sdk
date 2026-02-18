/**
 * Raw response types from the Garmin Wellness API.
 *
 * These mirror the JSON objects Garmin returns. The provider normalizes them
 * into the SDK's standard NormalizedActivity / NormalizedSleep / NormalizedDaily.
 */

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

export interface GarminRawActivity {
  activityId: number;
  activityName: string | null;
  activityType: string;
  startTimeInSeconds: number;
  startTimeOffsetInSeconds: number;
  durationInSeconds: number;
  distanceInMeters: number | null;
  activeKilocalories: number | null;
  averageHeartRateInBeatsPerMinute: number | null;
  maxHeartRateInBeatsPerMinute: number | null;
  steps: number | null;
  averageSpeedInMetersPerSecond: number | null;
  maxSpeedInMetersPerSecond: number | null;
  deviceName: string | null;
  manual: boolean;
}

// ---------------------------------------------------------------------------
// Daily summaries
// ---------------------------------------------------------------------------

export interface GarminRawDaily {
  summaryId: string;
  calendarDate: string; // "YYYY-MM-DD"
  startTimeInSeconds: number;
  startTimeOffsetInSeconds: number;
  durationInSeconds: number;
  steps: number | null;
  distanceInMeters: number | null;
  activeTimeInSeconds: number | null;
  activeKilocalories: number | null;
  restingHeartRateInBeatsPerMinute: number | null;
  maxHeartRateInBeatsPerMinute: number | null;
  minHeartRateInBeatsPerMinute: number | null;
  averageHeartRateInBeatsPerMinute: number | null;
  averageStressLevel: number | null;
  maxStressLevel: number | null;
  stressDurationInSeconds: number | null;
  bodyBatteryChargedValue: number | null;
  bodyBatteryDrainedValue: number | null;
  floorsClimbed: number | null;
  moderateIntensityDurationInSeconds: number | null;
  vigorousIntensityDurationInSeconds: number | null;
}

// ---------------------------------------------------------------------------
// Sleep
// ---------------------------------------------------------------------------

export interface GarminRawSleep {
  summaryId: string;
  calendarDate: string;
  startTimeInSeconds: number;
  startTimeOffsetInSeconds: number;
  durationInSeconds: number;
  deepSleepDurationInSeconds: number | null;
  lightSleepDurationInSeconds: number | null;
  remSleepInSeconds: number | null;
  awakeDurationInSeconds: number | null;
  validation: string;
  sleepLevelsMap?: Record<string, Array<{ startTimeInSeconds: number; endTimeInSeconds: number }>>;
  overallSleepScore?: {
    value: number;
    qualifierKey: string;
  };
}

// ---------------------------------------------------------------------------
// Heart Rate
// ---------------------------------------------------------------------------

export interface GarminRawHeartRate {
  summaryId: string;
  calendarDate: string;
  startTimeInSeconds: number;
  durationInSeconds: number;
  startTimeOffsetInSeconds: number;
  restingHeartRateInBeatsPerMinute: number | null;
  maxHeartRateInBeatsPerMinute: number | null;
  timeOffsetHeartRateSamples?: Record<string, number>;
}

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------

export interface GarminUserProfile {
  userId: string;
  displayName: string | null;
  emailAddress: string | null;
}
