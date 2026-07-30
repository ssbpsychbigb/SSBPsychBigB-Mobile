/**
 * Auth domain types for the mobile app portal.
 */

export type AuthRole =
  | 'aspirant'
  | 'institute'
  | 'institute_admin'
  | 'educator'
  | 'defence_officer';

export type AccountStatus =
  | 'active'
  | 'pending_verification'
  | 'rejected'
  | 'invited'
  | 'restricted'
  | 'suspended'
  | 'banned'
  | 'deleted';

export type LeaveRequestSummary = {
  id: string;
  reason?: string;
  startsAt?: string;
  endsAt?: string;
  requestedAt?: string;
  decidedAt?: string;
  decisionNote?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | string;
};

export type EducatorProfileSummary = {
  id: string;
  type: 'freelancer' | 'institute';
  status: string;
  instituteId?: string;
  instituteName?: string;
  instituteLogoPath?: string;
  instituteCode?: string;
  permissions?: string[];
  displayName?: string;
  examGoals?: string[];
  profilePhotoPath?: string;
  joinSource?: 'institute_hire' | 'educator_request' | 'legacy_invite' | '';
  invitedByUserId?: string;
  createdAt?: string;
  activatedAt?: string;
  leaveReason?: string;
  leaveStartsAt?: string;
  leaveEndsAt?: string;
  leaveRequestedAt?: string;
  leaveRequests?: LeaveRequestSummary[];
  resignReason?: string;
  resignRequestedAt?: string;
  noticeStartedAt?: string;
  noticeEndsAt?: string;
  noticeDays?: number;
  exitReason?: string;
  endedAt?: string;
  endedBy?: string;
};

export type AuthUser = {
  id: string;
  mobileNumber: string;
  email: string;
  fullName: string;
  role: AuthRole;
  accountStatus: AccountStatus;
  isMobileVerified: boolean;
  portal: 'app' | 'admin';
  verificationLevel: number;
  examGoal?: string;
  examGoals?: string[];
  profilePhotoPath?: string;
  instituteName?: string;
  instituteLogoPath?: string;
  officerPhotoPath?: string;
  officerIdDocumentPath?: string;
  idDocumentPath?: string;
  rejectionReason?: string;
  rejectedFields?: string[];
  previousRejectionReason?: string;
  previousRejectedFields?: string[];
  resubmittedAt?: string;
  resubmissionCount?: number;
  instituteId?: string;
  invitedByUserId?: string;
  instituteCode?: string;
  activeProfileId?: string;
  activeProfile?: EducatorProfileSummary | null;
  profiles?: EducatorProfileSummary[];
  permissions: string[];
  createdAt?: string;
  lastLoginAt?: string;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};
