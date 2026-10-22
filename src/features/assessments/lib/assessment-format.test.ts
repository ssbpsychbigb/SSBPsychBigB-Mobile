import {
  asmtKindLabel,
  formatAssessmentDuration,
  formatAssessmentPrice,
} from '@/features/assessments/lib/assessment-format';

describe('assessment format', () => {
  it('labels known kinds and falls back cleanly', () => {
    expect(asmtKindLabel('oir')).toBe('OIR');
    expect(asmtKindLabel('wat')).toBe('WAT');
    expect(asmtKindLabel('unknown')).toBe('Test');
  });

  it('formats duration and price for cards', () => {
    expect(formatAssessmentDuration(0)).toBe('Untimed');
    expect(formatAssessmentDuration(90)).toBe('2 min');
    expect(formatAssessmentDuration(3600)).toBe('1h');
    expect(formatAssessmentPrice(0)).toBe('Free');
    expect(formatAssessmentPrice(499)).toContain('499');
  });
});
