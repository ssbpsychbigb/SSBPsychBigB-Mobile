export { useAuthStore } from './store/auth.store';
export { usePermissionsStore } from './store/permissions.store';
export { useAuthHydrated } from './hooks/useAuthHydrated';
export { useAuthSessionReady } from './hooks/useAuthSessionReady';
export { useLogout } from './hooks/useLogout';
export { useRefreshAuthSession } from './hooks/useRefreshAuthSession';
export { useSwitchEducatorProfile } from './hooks/useSwitchEducatorProfile';
export { SplashScreen } from './screens/SplashScreen';
export { WelcomeScreen } from './screens/WelcomeScreen';
export { LoginScreen } from './screens/LoginScreen';
export { RegisterScreen } from './screens/RegisterScreen';
export { OtpScreen } from './screens/OtpScreen';
export { UnderReviewScreen } from './screens/UnderReviewScreen';
export { ApplicationRejectedScreen } from './screens/ApplicationRejectedScreen';
export { ApplicationResubmitScreen } from './screens/ApplicationResubmitScreen';
export { RestrictedAccessScreen } from './screens/RestrictedAccessScreen';
export { OnboardingScreen } from './screens/OnboardingScreen';
export type {
  AuthUser,
  AuthSession,
  AuthRole,
  AccountStatus,
  EducatorProfileSummary,
} from './types/auth.types';
export { authApi } from './api/auth.api';
export {
  getPostAuthDestination,
  getActiveInstituteProfile,
  getFreelancerProfileId,
  isAppAccountBlocked,
  canResubmitApplication,
  isEducatorInInstituteContext,
  isFreelancerEducator,
  isInstituteOwnerUser,
  isInstitutePanelUser,
  needsAspirantOnboarding,
} from './lib/auth-routing';
