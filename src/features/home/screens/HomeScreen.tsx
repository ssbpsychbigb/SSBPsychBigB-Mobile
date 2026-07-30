/**
 * Authenticated home — role-aware surfaces.
 */

import {
  getActiveInstituteProfile,
  isFreelancerEducator,
  isInstituteOwnerUser,
  useAuthStore,
} from '@/features/auth';
import { AspirantHomeScreen } from '@/features/home/screens/AspirantHomeScreen';
import { InstituteHomeScreen } from '@/features/institute/screens/InstituteHomeScreen';
import {
  EducatorCollaborationsScreen,
  EducatorInstituteHomeScreen,
} from '@/features/educator';

/**
 * Picks the correct Phase 2 home surface for the signed-in role.
 */
export function HomeScreen() {
  const user = useAuthStore((state) => state.user);

  // * Institute owner / admin — hire, code, join requests.
  if (isInstituteOwnerUser(user)) {
    return <InstituteHomeScreen />;
  }

  // * Freelancer educator who Enter'd an institute collaboration.
  if (getActiveInstituteProfile(user)) {
    return <EducatorInstituteHomeScreen />;
  }

  // * Freelancer brand — collaborations inbox.
  if (isFreelancerEducator(user)) {
    return <EducatorCollaborationsScreen />;
  }

  // * Legacy faculty educator tied to instituteId (non-owner).
  if (user?.role === 'educator' && user.instituteId) {
    return <EducatorInstituteHomeScreen />;
  }

  return <AspirantHomeScreen />;
}
