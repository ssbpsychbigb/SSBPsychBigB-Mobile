/**
 * Shared rejection field catalogs (parity with web + backend).
 */

export type RejectionFieldCode =
  | 'fullName'
  | 'email'
  | 'mobileNumber'
  | 'instituteName'
  | 'instituteLogo'
  | 'officerPhoto'
  | 'officerIdDocument'
  | 'examGoals'
  | 'profilePhoto'
  | 'idDocument';

export const REJECTION_FIELD_LABELS: Record<RejectionFieldCode, string> = {
  fullName: 'Full name',
  email: 'Email',
  mobileNumber: 'Mobile number',
  instituteName: 'Institute name',
  instituteLogo: 'Institute logo',
  officerPhoto: 'Officer photo',
  officerIdDocument: 'ID document',
  examGoals: 'Exam / prep goals',
  profilePhoto: 'Profile photo',
  idDocument: 'ID document',
};

export type RejectionRole = 'institute' | 'defence_officer' | 'educator';

export const REJECTION_FIELDS_BY_ROLE: Record<
  RejectionRole,
  RejectionFieldCode[]
> = {
  institute: ['email', 'mobileNumber', 'instituteName', 'instituteLogo'],
  defence_officer: [
    'fullName',
    'email',
    'mobileNumber',
    'officerPhoto',
    'officerIdDocument',
  ],
  educator: [
    'fullName',
    'email',
    'mobileNumber',
    'examGoals',
    'profilePhoto',
    'idDocument',
  ],
};

/**
 * Human labels for stored rejection field codes.
 */
export function labelRejectionFields(fields: string[] | undefined): string[] {
  if (!fields?.length) {
    return [];
  }

  return fields.map((code) => {
    if (code in REJECTION_FIELD_LABELS) {
      return REJECTION_FIELD_LABELS[code as RejectionFieldCode];
    }
    return code;
  });
}
