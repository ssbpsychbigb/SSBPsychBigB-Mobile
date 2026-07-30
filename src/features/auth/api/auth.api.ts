/**
 * Auth API contracts and endpoints (shared BIGB backend).
 */

import { apiRequest } from '@/shared/api';
import { normalizeMobileNumber } from '@/features/auth/lib/format-mobile';
import { toMultipartFilePart } from '@/features/auth/lib/upload-asset';
import type { RegisterFormValues, PickedAsset } from '@/features/auth/types/register-form';
import type { OtpPurpose } from '@/features/auth/types/otp';
import type { AuthUser, EducatorProfileSummary } from '@/features/auth/types/auth.types';

export type OtpChallengeResult = {
  mobileNumber: string;
  purpose: OtpPurpose;
  expiresIn: number;
  joinType?: string;
  message?: string;
  /** True when transactional email with OTP was delivered. */
  emailSent?: boolean;
  /** Present only when backend exposes OTP (dev). */
  debugOtp?: string;
};

export type AuthSessionResult = {
  accessToken: string;
  user: AuthUser;
};

function appendAsset(
  formData: FormData,
  field: string,
  asset: PickedAsset | null,
): void {
  if (!asset?.uri) {
    return;
  }

  const part = toMultipartFilePart(asset, field);
  formData.append(field, part as unknown as Blob);
}

/**
 * Builds multipart form data for public registration.
 */
export function buildRegisterFormData(values: RegisterFormValues): FormData {
  const formData = new FormData();
  formData.append('joinType', values.joinType);
  formData.append('email', values.email.trim());
  formData.append(
    'mobileNumber',
    normalizeMobileNumber(values.mobileNumber),
  );

  if (values.joinType === 'aspirant') {
    formData.append('fullName', values.fullName.trim());
    formData.append('examGoal', values.examGoal);
  }

  if (values.joinType === 'institute') {
    formData.append('instituteName', values.instituteName.trim());
    appendAsset(formData, 'instituteLogo', values.instituteLogo);
  }

  if (values.joinType === 'defence_officer') {
    formData.append('fullName', values.fullName.trim());
    appendAsset(formData, 'officerPhoto', values.officerPhoto);
    appendAsset(formData, 'officerIdDocument', values.officerIdDocument);
  }

  if (values.joinType === 'educator') {
    formData.append('fullName', values.fullName.trim());
    formData.append('examGoals', JSON.stringify(values.examGoals));
    appendAsset(formData, 'profilePhoto', values.profilePhoto);
    appendAsset(formData, 'idDocument', values.idDocument);
  }

  return formData;
}

export const authApi = {
  register(values: RegisterFormValues): Promise<OtpChallengeResult> {
    return apiRequest<OtpChallengeResult>('/auth/register', {
      method: 'POST',
      formData: buildRegisterFormData(values),
    });
  },

  sendOtp(input: {
    mobileNumber: string;
    purpose: OtpPurpose;
  }): Promise<OtpChallengeResult> {
    return apiRequest<OtpChallengeResult>('/auth/otp/send', {
      method: 'POST',
      body: {
        mobileNumber: normalizeMobileNumber(input.mobileNumber),
        purpose: input.purpose,
      },
    });
  },

  verifyOtp(input: {
    mobileNumber: string;
    otp: string;
    purpose: OtpPurpose;
  }): Promise<AuthSessionResult> {
    return apiRequest<AuthSessionResult>('/auth/otp/verify', {
      method: 'POST',
      body: {
        mobileNumber: normalizeMobileNumber(input.mobileNumber),
        otp: input.otp,
        purpose: input.purpose,
      },
    });
  },

  me(token: string): Promise<AuthUser> {
    return apiRequest<AuthUser>('/auth/me', {
      method: 'GET',
      token,
    });
  },

  resubmitApplication(token: string, formData: FormData): Promise<AuthUser> {
    return apiRequest<AuthUser>('/auth/application/resubmit', {
      method: 'POST',
      token,
      formData,
    });
  },

  requestJoin(
    token: string,
    input: { instituteCode?: string; instituteId?: string },
  ): Promise<EducatorProfileSummary> {
    return apiRequest<EducatorProfileSummary>('/auth/educator/join-requests', {
      method: 'POST',
      token,
      body: input,
    });
  },

  listInstitutes(
    token: string,
    q = '',
  ): Promise<
    Array<{
      id: string;
      instituteName: string;
      instituteLogoPath?: string;
      instituteCode?: string;
      collabStatus: string | null;
    }>
  > {
    const params = new URLSearchParams();
    if (q.trim()) {
      params.set('q', q.trim());
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/auth/educator/institutes${query}`, {
      method: 'GET',
      token,
    });
  },

  acceptHireInvite(
    token: string,
    profileId: string,
  ): Promise<EducatorProfileSummary> {
    return apiRequest<EducatorProfileSummary>(
      `/auth/educator/collaborations/${profileId}/accept`,
      {
        method: 'POST',
        token,
      },
    );
  },

  declineCollaboration(
    token: string,
    profileId: string,
  ): Promise<{ id: string; deleted: boolean }> {
    return apiRequest<{ id: string; deleted: boolean }>(
      `/auth/educator/collaborations/${profileId}/decline`,
      {
        method: 'POST',
        token,
      },
    );
  },

  switchProfile(
    token: string,
    profileId: string,
  ): Promise<AuthSessionResult> {
    return apiRequest<AuthSessionResult>(`/auth/profiles/${profileId}/switch`, {
      method: 'POST',
      token,
    });
  },

  requestLeave(
    token: string,
    profileId: string,
    input: {
      reason: string;
      leaveStartsAt: string;
      leaveEndsAt: string;
      leaveRequestId?: string;
      updatePending?: boolean;
    },
  ): Promise<EducatorProfileSummary> {
    return apiRequest<EducatorProfileSummary>(
      `/auth/educator/collaborations/${profileId}/leave`,
      {
        method: 'POST',
        token,
        body: input,
      },
    );
  },

  cancelLeave(
    token: string,
    profileId: string,
    input?: { leaveRequestId?: string },
  ): Promise<EducatorProfileSummary> {
    return apiRequest<EducatorProfileSummary>(
      `/auth/educator/collaborations/${profileId}/leave/cancel`,
      {
        method: 'POST',
        token,
        body: input || {},
      },
    );
  },

  requestResign(
    token: string,
    profileId: string,
    input: { reason: string },
  ): Promise<EducatorProfileSummary> {
    return apiRequest<EducatorProfileSummary>(
      `/auth/educator/collaborations/${profileId}/resign`,
      {
        method: 'POST',
        token,
        body: input,
      },
    );
  },

  cancelResign(
    token: string,
    profileId: string,
  ): Promise<EducatorProfileSummary> {
    return apiRequest<EducatorProfileSummary>(
      `/auth/educator/collaborations/${profileId}/resign/cancel`,
      {
        method: 'POST',
        token,
      },
    );
  },
};
