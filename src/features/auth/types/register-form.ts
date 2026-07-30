/**
 * Registration form contracts (mobile).
 */

import type { ExamGoalValue } from '@/features/auth/constants/exam-goals';
import type { RegisterJoinType } from '@/features/auth/constants/register-join-types';

export type PickedAsset = {
  uri: string;
  type?: string;
  name?: string;
};

export type RegisterFormValues = {
  joinType: RegisterJoinType;
  fullName: string;
  email: string;
  examGoal: ExamGoalValue | '';
  examGoals: ExamGoalValue[];
  mobileNumber: string;
  instituteName: string;
  instituteLogo: PickedAsset | null;
  officerPhoto: PickedAsset | null;
  officerIdDocument: PickedAsset | null;
  profilePhoto: PickedAsset | null;
  idDocument: PickedAsset | null;
};
