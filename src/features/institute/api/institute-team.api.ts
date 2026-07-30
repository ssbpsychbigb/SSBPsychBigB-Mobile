/**
 * Institute team API — code, join Accept/Reject, freelancer hire list.
 */

import { apiRequest } from '@/shared/api';
import type {
  AuthUser,
  LeaveRequestSummary,
} from '@/features/auth/types/auth.types';

export type InstituteTeamAccountStatus =
  | AuthUser['accountStatus']
  | 'leave_pending'
  | 'on_leave'
  | 'resign_pending'
  | 'notice_period'
  | 'ended';

export type InstituteTeamMember = Omit<AuthUser, 'accountStatus' | 'role'> & {
  accountStatus: InstituteTeamAccountStatus;
  role: AuthUser['role'] | 'institute_admin' | 'educator';
  userId?: string;
  membershipKind?: 'legacy' | 'profile';
  joinSource?: 'institute_hire' | 'educator_request' | 'legacy_invite' | '';
  examGoals?: string[];
  profilePhotoPath?: string;
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

export type InstituteCodeInfo = {
  instituteId: string;
  instituteName: string;
  instituteCode: string;
};

export type FreelancerDirectoryItem = {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  examGoals: string[];
  profilePhotoPath?: string;
  verificationLevel: number;
  collabStatus: string | null;
};

/**
 * True when the row is an educator join request waiting on the institute.
 */
export function isPendingEducatorJoin(
  member: InstituteTeamMember,
): boolean {
  return (
    member.membershipKind === 'profile' &&
    member.joinSource === 'educator_request' &&
    member.accountStatus === 'invited'
  );
}

/**
 * True when an educator leave request awaits institute decision.
 */
export function isPendingLeaveRequest(
  member: InstituteTeamMember,
): boolean {
  if (member.membershipKind !== 'profile') {
    return false;
  }
  const pending = (member.leaveRequests || []).some(
    (row) => row.status === 'pending',
  );
  return pending || member.accountStatus === 'leave_pending';
}

/**
 * True when an educator is currently on approved leave.
 */
export function isEducatorOnLeave(
  member: InstituteTeamMember,
): boolean {
  if (member.membershipKind !== 'profile') {
    return false;
  }
  const approved = (member.leaveRequests || []).some(
    (row) => row.status === 'approved',
  );
  return approved || member.accountStatus === 'on_leave';
}

/**
 * One pending leave row for institute review (supports multiple per educator).
 */
export type PendingLeaveItem = {
  key: string;
  profileId: string;
  leaveRequestId?: string;
  member: InstituteTeamMember;
  reason?: string;
  startsAt?: string;
  endsAt?: string;
};

/**
 * Flattens team members into individual pending leave request cards.
 */
export function listPendingLeaveItems(
  members: InstituteTeamMember[],
): PendingLeaveItem[] {
  const items: PendingLeaveItem[] = [];
  for (const member of members) {
    if (member.membershipKind !== 'profile') {
      continue;
    }
    const pendingRows = (member.leaveRequests || []).filter(
      (row) => row.status === 'pending' && row.id,
    );
    if (pendingRows.length > 0) {
      for (const row of pendingRows) {
        items.push({
          key: `${member.id}-${row.id}`,
          profileId: member.id,
          leaveRequestId: row.id,
          member,
          reason: row.reason,
          startsAt: row.startsAt,
          endsAt: row.endsAt,
        });
      }
      continue;
    }
    if (member.accountStatus === 'leave_pending') {
      items.push({
        key: `${member.id}-legacy`,
        profileId: member.id,
        member,
        reason: member.leaveReason,
        startsAt: member.leaveStartsAt,
        endsAt: member.leaveEndsAt,
      });
    }
  }
  return items;
}

/**
 * Approved leave rows for the faculty-on-leave section.
 */
export type ApprovedLeaveItem = {
  key: string;
  member: InstituteTeamMember;
  reason?: string;
  startsAt?: string;
  endsAt?: string;
};

/**
 * Flattens approved leave requests (one card per leave window).
 */
export function listApprovedLeaveItems(
  members: InstituteTeamMember[],
): ApprovedLeaveItem[] {
  const items: ApprovedLeaveItem[] = [];
  for (const member of members) {
    if (member.membershipKind !== 'profile') {
      continue;
    }
    const approvedRows = (member.leaveRequests || []).filter(
      (row) => row.status === 'approved' && row.id,
    );
    if (approvedRows.length > 0) {
      for (const row of approvedRows) {
        items.push({
          key: `${member.id}-${row.id}`,
          member,
          reason: row.reason,
          startsAt: row.startsAt,
          endsAt: row.endsAt,
        });
      }
      continue;
    }
    if (member.accountStatus === 'on_leave') {
      items.push({
        key: `${member.id}-legacy`,
        member,
        reason: member.leaveReason,
        startsAt: member.leaveStartsAt,
        endsAt: member.leaveEndsAt,
      });
    }
  }
  return items;
}

/**
 * True when an educator resign request awaits institute decision.
 */
export function isPendingResignRequest(
  member: InstituteTeamMember,
): boolean {
  return (
    member.membershipKind === 'profile' &&
    member.accountStatus === 'resign_pending'
  );
}

export type InstituteHrDecision = 'accept' | 'reject';

export const instituteTeamApi = {
  getCode(token: string): Promise<InstituteCodeInfo> {
    return apiRequest<InstituteCodeInfo>('/institute/team/code', {
      method: 'GET',
      token,
    });
  },

  list(token: string): Promise<InstituteTeamMember[]> {
    return apiRequest<InstituteTeamMember[]>('/institute/team', {
      method: 'GET',
      token,
    });
  },

  acceptJoinRequest(
    token: string,
    profileId: string,
  ): Promise<InstituteTeamMember> {
    return apiRequest<InstituteTeamMember>(
      `/institute/team/profiles/${profileId}/accept`,
      {
        method: 'POST',
        token,
      },
    );
  },

  rejectJoinRequest(
    token: string,
    profileId: string,
  ): Promise<{ id: string; deleted: boolean }> {
    return apiRequest<{ id: string; deleted: boolean }>(
      `/institute/team/profiles/${profileId}/reject`,
      {
        method: 'POST',
        token,
      },
    );
  },

  searchFreelancers(
    token: string,
    q = '',
  ): Promise<FreelancerDirectoryItem[]> {
    const params = new URLSearchParams();
    if (q.trim()) {
      params.set('q', q.trim());
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<FreelancerDirectoryItem[]>(
      `/institute/team/freelancers${query}`,
      {
        method: 'GET',
        token,
      },
    );
  },

  hireFreelancer(
    token: string,
    input: {
      userId: string;
      permissions?: string[];
      examGoals?: string[];
    },
  ): Promise<InstituteTeamMember> {
    return apiRequest<InstituteTeamMember>('/institute/team/hire', {
      method: 'POST',
      token,
      body: input,
    });
  },

  decideLeave(
    token: string,
    profileId: string,
    input: {
      decision: InstituteHrDecision;
      note?: string;
      leaveRequestId?: string;
    },
  ): Promise<InstituteTeamMember> {
    return apiRequest<InstituteTeamMember>(
      `/institute/team/profiles/${profileId}/leave/decide`,
      {
        method: 'POST',
        token,
        body: input,
      },
    );
  },

  decideResign(
    token: string,
    profileId: string,
    input: { decision: InstituteHrDecision; note?: string },
  ): Promise<InstituteTeamMember> {
    return apiRequest<InstituteTeamMember>(
      `/institute/team/profiles/${profileId}/resign/decide`,
      {
        method: 'POST',
        token,
        body: input,
      },
    );
  },
};
