/**
 * Public registration join paths for mobile auth.
 */

import { FEATURE_FLAGS } from '@/shared/constants';

const BASE_REGISTER_JOIN_TYPES = [
  {
    value: 'aspirant',
    title: 'Aspirant / Student',
    shortTitle: 'Student',
    description: 'Prepare for NDA, CDS, AFCAT, SSB and more.',
  },
  {
    value: 'institute',
    title: 'Institute',
    shortTitle: 'Institute',
    description: 'Register your coaching academy on BIGB.',
  },
  {
    value: 'defence_officer',
    title: 'Defence Officer',
    shortTitle: 'Officer',
    description: 'Apply as a verified mentor from the forces.',
  },
  {
    value: 'educator',
    title: 'Educator (Freelancer)',
    shortTitle: 'Educator',
    description: 'Teach independently with your personal brand.',
  },
] as const;

export type RegisterJoinType = (typeof BASE_REGISTER_JOIN_TYPES)[number]['value'];

export const REGISTER_JOIN_TYPES = BASE_REGISTER_JOIN_TYPES.filter((option) => {
  if (option.value === 'educator') {
    return FEATURE_FLAGS.educatorFreelancerRegister;
  }

  return true;
});
