/**
 * Raw response types from the Fitbit Web API.
 */

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export interface FitbitUserProfile {
  user: {
    encodedId: string;
    displayName: string;
    fullName: string;
    avatar: string;
    memberSince: string;
    timezone: string;
  };
}

// ---------------------------------------------------------------------------
// Activity Log List
// ---------------------------------------------------------------------------

export interface FitbitActivityLogList {
  activities: FitbitRawActivity[];
  pagination: {
    afterDate: string;
    limit: number;
    next: string;
    offset: number;
    previous: string;
    sort: string;
  };
}

export interface FitbitRawActivity {
  logId: number;
  activityName: string;
  activityTypeId: number;
  startTime: string; // "2024-01-15T08:30:00.000-05:00"
  duration: number; // milliseconds
  activeDuration: number;
  calories: number;
  distance?: number;
  distanceUnit?: string;
  steps?: number;
  averageHeartRate?: number;
  heartRateZones?: FitbitHeartRateZone[];
  source?: {
    id: string;
    name: string;
    type: string;
  };
  speed?: number;
  pace?: number;
  elevationGain?: number;
  hasActiveZoneMinutes: boolean;
  logType: string;
}

export interface FitbitHeartRateZone {
  caloriesOut: number;
  max: number;
  min: number;
  minutes: number;
  name: string;
}

// ---------------------------------------------------------------------------
// Sleep
// ---------------------------------------------------------------------------

export interface FitbitSleepResponse {
  sleep: FitbitRawSleep[];
  summary?: {
    totalMinutesAsleep: number;
    totalSleepRecords: number;
    totalTimeInBed: number;
  };
}

export interface FitbitRawSleep {
  logId: number;
  dateOfSleep: string;
  startTime: string;
  endTime: string;
  duration: number; // milliseconds
  minutesAsleep: number;
  minutesAwake: number;
  timeInBed: number;
  efficiency: number;
  type: "classic" | "stages";
  levels?: {
    summary: {
      deep?: { count: number; minutes: number; thirtyDayAvgMinutes: number };
      light?: { count: number; minutes: number; thirtyDayAvgMinutes: number };
      rem?: { count: number; minutes: number; thirtyDayAvgMinutes: number };
      wake?: { count: number; minutes: number; thirtyDayAvgMinutes: number };
    };
    data: Array<{
      dateTime: string;
      level: string;
      seconds: number;
    }>;
  };
  isMainSleep: boolean;
}

// ---------------------------------------------------------------------------
// Heart Rate
// ---------------------------------------------------------------------------

export interface FitbitHeartRateResponse {
  "activities-heart": Array<{
    dateTime: string;
    value: {
      customHeartRateZones: FitbitHeartRateZone[];
      heartRateZones: FitbitHeartRateZone[];
      restingHeartRate?: number;
    };
  }>;
}

// ---------------------------------------------------------------------------
// Daily Activity Summary
// ---------------------------------------------------------------------------

export interface FitbitDailySummary {
  activities: FitbitRawActivity[];
  goals: {
    activeMinutes: number;
    caloriesOut: number;
    distance: number;
    floors: number;
    steps: number;
  };
  summary: {
    activeScore: number;
    activityCalories: number;
    caloriesBMR: number;
    caloriesOut: number;
    distances: Array<{ activity: string; distance: number }>;
    fairlyActiveMinutes: number;
    floors: number;
    lightlyActiveMinutes: number;
    marginalCalories: number;
    restingHeartRate?: number;
    sedentaryMinutes: number;
    steps: number;
    veryActiveMinutes: number;
  };
}

// ---------------------------------------------------------------------------
// Time Series
// ---------------------------------------------------------------------------

export interface FitbitTimeSeriesEntry {
  dateTime: string;
  value: string;
}

export interface FitbitStepsResponse {
  "activities-steps": FitbitTimeSeriesEntry[];
}

export interface FitbitCaloriesResponse {
  "activities-calories": FitbitTimeSeriesEntry[];
}

export interface FitbitDistanceResponse {
  "activities-distance": FitbitTimeSeriesEntry[];
}
