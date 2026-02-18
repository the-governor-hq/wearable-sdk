/** Fitbit OAuth 2.0 constants */

export const FITBIT_AUTHORIZE_URL = "https://www.fitbit.com/oauth2/authorize";
export const FITBIT_TOKEN_URL = "https://api.fitbit.com/oauth2/token";

/** Fitbit Web API base */
export const FITBIT_API_BASE = "https://api.fitbit.com";

/** Default scopes for Fitbit */
export const FITBIT_DEFAULT_SCOPES = [
  "activity",
  "heartrate",
  "sleep",
  "profile",
] as const;

/** Rate limit: 150 requests/hour for personal apps */
export const FITBIT_RATE_LIMIT_REQUESTS = 150;
export const FITBIT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/** Fitbit data endpoints (using user "-" = current user) */
export const FITBIT_ENDPOINTS = {
  /** User profile — GET */
  profile: "/1/user/-/profile.json",

  /** Activities on a date — GET /1/user/-/activities/date/{date}.json */
  activitiesDate: (date: string) =>
    `/1/user/-/activities/date/${date}.json`,

  /** Activity log list — GET /1/user/-/activities/list.json?... */
  activityLogList: "/1/user/-/activities/list.json",

  /** Sleep log by date range — GET /1.2/user/-/sleep/date/{start}/{end}.json */
  sleepRange: (start: string, end: string) =>
    `/1.2/user/-/sleep/date/${start}/${end}.json`,

  /** Heart rate time series — GET /1/user/-/activities/heart/date/{start}/{end}.json */
  heartRateRange: (start: string, end: string) =>
    `/1/user/-/activities/heart/date/${start}/${end}.json`,

  /** Daily activity summary — GET /1/user/-/activities/date/{date}.json */
  dailySummary: (date: string) =>
    `/1/user/-/activities/date/${date}.json`,

  /** Steps time series — GET /1/user/-/activities/steps/date/{start}/{end}.json */
  stepsRange: (start: string, end: string) =>
    `/1/user/-/activities/steps/date/${start}/${end}.json`,

  /** Calories time series */
  caloriesRange: (start: string, end: string) =>
    `/1/user/-/activities/calories/date/${start}/${end}.json`,

  /** Distance time series */
  distanceRange: (start: string, end: string) =>
    `/1/user/-/activities/distance/date/${start}/${end}.json`,
} as const;
