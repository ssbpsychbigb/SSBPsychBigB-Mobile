/**
 * Typed navigation param lists for the whole app.
 */

import type { OtpPurpose, RegisterJoinTypeForOtp } from '@/features/auth/types/otp';

export type AuthStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Otp: {
    mobileNumber: string;
    purpose: OtpPurpose;
    joinType?: RegisterJoinTypeForOtp;
    debugOtp?: string;
  };
};

/** Swipe tab keys (react-native-tab-view + pager-view). */
export type AppTabRouteKey =
  | 'homepage'
  | 'bookmark'
  | 'myCourse'
  | 'message'
  | 'profile';

export type AppTabRoute = {
  key: AppTabRouteKey;
  title: string;
};

/** @deprecated Prefer AppTabRouteKey — kept for call-site clarity. */
export type AppTabParamList = Record<AppTabRouteKey, undefined>;

export type AppStackParamList = AppTabParamList;

export type RootStackParamList = {
  Auth: undefined;
  UnderReview: undefined;
  ApplicationRejected: undefined;
  ApplicationResubmit: undefined;
  Restricted: undefined;
  Onboarding: undefined;
  App: undefined;
};
