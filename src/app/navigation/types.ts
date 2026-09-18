/**
 * Typed navigation param lists for the whole app.
 */

import type { NavigatorScreenParams } from '@react-navigation/native';

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

/** Bottom tab keys. */
export type AppTabRouteKey =
  | 'homepage'
  | 'reels'
  | 'myCourse'
  | 'communities'
  | 'profile';

export type AppTabRoute = {
  key: AppTabRouteKey;
  title: string;
};

/** @deprecated Prefer AppTabRouteKey — kept for call-site clarity. */
export type AppTabParamList = Record<AppTabRouteKey, undefined>;

export type AppStackParamList = AppTabParamList;

export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  UnderReview: undefined;
  ApplicationRejected: undefined;
  ApplicationResubmit: undefined;
  Restricted: undefined;
  Onboarding: undefined;
  App: undefined;
  Workspace: undefined;
  Bookmarks: undefined;
  Network: undefined;
  Messages: undefined;
  ChatThread: { conversationId: string; name?: string; username?: string };
  MemberProfile: { username: string; name?: string };
  MemberNetwork: {
    username: string;
    name?: string;
    kind: 'followers' | 'following' | 'mutual';
  };
  Notifications: undefined;
};
