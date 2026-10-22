/**
 * Learner assignments + certificates. No studio routes.
 */

import { apiRequest } from '@/shared/api/client';

export type AssignmentKind = 'text' | 'file' | 'mcq' | 'descriptive';

export type AssignmentQuestion = {
  prompt: string;
  options: string[];
};

export type AssignmentSubmission = {
  id: string;
  status: string;
  score: number | null;
  feedback: string;
  bodyText?: string;
  filePath?: string;
  attemptCount?: number;
  submittedAt: string | null;
};

export type AssignmentItem = {
  id: string;
  title: string;
  instructions: string;
  maxScore: number;
  requiredForCertificate: boolean;
  kind?: AssignmentKind;
  questions?: AssignmentQuestion[];
  canResubmit?: boolean;
  sequence: number;
  submission?: AssignmentSubmission | null;
};

export type CertificateDto = {
  id: string;
  certificateCode: string;
  learnerName: string;
  courseTitle: string;
  issuedAt: string | null;
  verifyPath: string;
};

export type CertificateEligibility = {
  eligible: boolean;
  reason: string;
  progressPct: number;
  requiredPct: number;
  pendingAssignments: Array<{ id: string; title: string }>;
  certificate: CertificateDto | null;
};

export type VerifyResult = {
  valid: boolean;
  certificateCode: string;
  learnerName: string;
  courseTitle: string;
  issuedAt: string | null;
};

export type AssignmentFilePart = {
  uri: string;
  name: string;
  type: string;
};

export const courseCertApi = {
  listAssignments(idOrSlug: string, token: string) {
    return apiRequest<{ items: AssignmentItem[] }>(
      `/courses/${encodeURIComponent(idOrSlug)}/assignments`,
      { token },
    );
  },

  submit(
    assignmentId: string,
    input: {
      bodyText?: string;
      answers?: number[];
      file?: AssignmentFilePart;
    },
    token: string,
  ) {
    if (input.file) {
      const formData = new FormData();
      formData.append('file', {
        uri: input.file.uri,
        name: input.file.name,
        type: input.file.type,
      } as unknown as Blob);
      if (input.bodyText) {
        formData.append('bodyText', input.bodyText);
      }
      if (input.answers?.length) {
        formData.append('answers', JSON.stringify(input.answers));
      }
      return apiRequest<AssignmentSubmission>(
        `/courses/assignments/${encodeURIComponent(assignmentId)}/submit`,
        { method: 'POST', token, formData },
      );
    }
    return apiRequest<AssignmentSubmission>(
      `/courses/assignments/${encodeURIComponent(assignmentId)}/submit`,
      {
        method: 'POST',
        token,
        body: {
          bodyText: input.bodyText || '',
          answers: input.answers || [],
        },
      },
    );
  },

  eligibility(idOrSlug: string, token: string) {
    return apiRequest<CertificateEligibility>(
      `/courses/${encodeURIComponent(idOrSlug)}/certificate/eligibility`,
      { token },
    );
  },

  issue(idOrSlug: string, token: string) {
    return apiRequest<{ certificate: CertificateDto; created: boolean }>(
      `/courses/${encodeURIComponent(idOrSlug)}/certificate`,
      { method: 'POST', token, body: {} },
    );
  },

  mine(token: string) {
    return apiRequest<{ items: CertificateDto[] }>(
      '/courses/certificates/mine',
      { token },
    );
  },

  verify(code: string) {
    return apiRequest<VerifyResult>(
      `/certificates/verify/${encodeURIComponent(code)}`,
    );
  },
};
