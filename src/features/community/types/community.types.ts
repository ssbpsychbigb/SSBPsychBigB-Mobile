/**
 * Community domain — same envelope as web Module 5.
 */

export type CommunityVisibility = 'public' | 'private';

export type CommunityScope = 'platform' | 'institute';

export type CommunityStatus =
  | 'pending_approval'
  | 'active'
  | 'pending_archive'
  | 'archived'
  | 'pending_delete'
  | 'deleted';

export type CommunityMembershipRole =
  | 'owner'
  | 'moderator'
  | 'member'
  | 'primary_admin'
  | 'co_admin';

export type CommunityMembershipStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'removed';

export type CommunityDestructiveType = 'archive' | 'delete' | 'unarchive';

export type Community = {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverPhotoPath: string;
  avatarPath: string;
  examGoals: string[];
  visibility: CommunityVisibility;
  scope: CommunityScope;
  instituteId: string | null;
  ownerId: string;
  primaryAdminId: string;
  coAdminId: string | null;
  createdById: string;
  ownerRole: string;
  memberCount: number;
  rulesText: string;
  status: CommunityStatus;
  createdAt: string;
  updatedAt: string;
  isMember: boolean;
  membershipRole: CommunityMembershipRole | null;
  membershipStatus: CommunityMembershipStatus | null;
  canModerate: boolean;
  canManageMembers?: boolean;
  canAppointAdmins?: boolean;
  canChangeVisibility?: boolean;
  canProposeArchive?: boolean;
  canProposeDelete?: boolean;
  canDecideDestructive?: boolean;
  canEditSettings?: boolean;
  pendingDestructive?: {
    id: string;
    type: CommunityDestructiveType;
    requestedById: string;
    expiresAt: string;
    status: string;
  } | null;
  inviteToken?: string;
  needsRulesAccept?: boolean;
  primaryAdminName?: string;
  coAdminName?: string;
};

export type CommunityPage = {
  items: Community[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type CommunityMember = {
  userId: string;
  role: CommunityMembershipRole;
  status?: CommunityMembershipStatus;
  rights?: Record<string, boolean>;
  joinedAt: string;
  mutedUntil: string | null;
  isMuted: boolean;
  user: {
    id: string;
    fullName: string;
    username: string;
    role: string;
    preparationStage: string;
    examGoal: string;
    profilePhotoPath: string;
    verificationLevel: number;
  };
};

export type CommunityMembersPage = {
  items: CommunityMember[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type CommunityInvite = {
  inviteToken: string;
  path: string;
  visibility: CommunityVisibility;
};

export type InstituteCommunityQuota = {
  applicable: boolean;
  instituteId: string | null;
  instituteName: string;
  communityQuota: number | null;
  used: number;
  remaining: number | null;
};

export type CreateCommunityInput = {
  name: string;
  description?: string;
  slug?: string;
  examGoals?: string[];
  visibility?: CommunityVisibility;
  coverPhotoPath?: string;
  avatarPath?: string;
  coAdminUsername?: string;
};

export type CommunityBrandUpload = {
  kind: 'cover' | 'avatar';
  path: string;
};

export type CommunityResourceKind = 'link' | 'pdf' | 'doc';

export type CommunityResource = {
  id: string;
  communityId: string;
  kind: CommunityResourceKind;
  title: string;
  description: string;
  url: string;
  filePath: string;
  fileName: string;
  mime: string;
  size: number;
  pinnedAt: string | null;
  createdBy: {
    id: string;
    fullName: string;
    username: string;
  };
  createdAt: string;
};

export type CommunityResourcesPage = {
  items: CommunityResource[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type CreateCommunityResourceInput = {
  kind: CommunityResourceKind;
  title: string;
  description?: string;
  url?: string;
  filePath?: string;
  fileName?: string;
  mime?: string;
  size?: number;
};

export type CommunityResourceUpload = {
  url: string;
  fileName: string;
  mime: string;
  size: number;
  sizeLabel: string;
  kind: Exclude<CommunityResourceKind, 'link'>;
};

export type CommunityEventLocationType = 'online' | 'in_person' | 'tbd';

export type CommunityEventRsvpStatus = 'going' | 'interested';

export type CommunityEvent = {
  id: string;
  communityId: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string | null;
  locationType: CommunityEventLocationType;
  locationText: string;
  meetingUrl: string;
  status: 'scheduled' | 'cancelled';
  goingCount: number;
  interestedCount: number;
  myRsvp: CommunityEventRsvpStatus | null;
  createdBy: {
    id: string;
    fullName: string;
    username: string;
  };
  createdAt: string;
};

export type CommunityEventsPage = {
  items: CommunityEvent[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type CreateCommunityEventInput = {
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string | null;
  locationType?: CommunityEventLocationType;
  locationText?: string;
  meetingUrl?: string;
};

export type DiscoverFilter = 'public' | 'institute' | 'official';
