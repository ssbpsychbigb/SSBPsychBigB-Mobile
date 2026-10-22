/**
 * Folders and challenge reasons shared with the web result page.
 */

export const BOOKMARK_FOLDERS = [
  'Difficult',
  'Revise later',
  'Favourite',
  'Incorrect',
] as const;

export const CHALLENGE_REASONS = [
  { id: 'wrong_key', label: 'Wrong answer key' },
  { id: 'typo', label: 'Typo or unclear wording' },
  { id: 'explanation', label: 'Explanation issue' },
  { id: 'duplicate', label: 'Duplicate question' },
] as const;
