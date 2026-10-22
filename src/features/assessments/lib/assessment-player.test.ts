import {
  clockDriftMs,
  draftIsAnswered,
  draftsFromAttempt,
  formatClock,
  payloadFromDrafts,
  remainingSec,
} from '@/features/assessments/lib/assessment-player';

describe('assessment player helpers', () => {
  it('round-trips saved answers without dropping a zero index', () => {
    const drafts = draftsFromAttempt([
      { itemId: 'a', selectedIndex: 0, text: 'word' },
    ]);
    const draft = drafts.a;
    expect(draft?.selectedIndex).toBe(0);
    expect(payloadFromDrafts(drafts)).toEqual([
      {
        itemId: 'a',
        selectedIndex: 0,
        text: 'word',
        story: undefined,
        characters: undefined,
        theme: undefined,
      },
    ]);
    expect(draftIsAnswered(draft)).toBe(true);
    expect(draftIsAnswered({})).toBe(false);
  });

  it('follows the server clock', () => {
    const now = Date.parse('2026-10-22T10:00:05.000Z');
    expect(clockDriftMs('2026-10-22T10:00:00.000Z', now)).toBe(5000);
    expect(remainingSec('2026-10-22T10:01:00.000Z', now)).toBe(55);
    expect(remainingSec('2026-10-22T09:00:00.000Z', now)).toBe(0);
    expect(remainingSec(null, now)).toBeNull();
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(0)).toBe('0:00');
  });
});
