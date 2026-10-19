/**
 * Sticker-style GIFs for the composer (same set as web, no GIF API).
 */

export type MockGif = {
  id: string;
  label: string;
  emoji: string;
  color: string;
};

export const MOCK_GIFS: MockGif[] = [
  { id: 'salute', label: 'Salute', emoji: '🫡', color: '#1351A1' },
  { id: 'yes-sir', label: 'Yes sir', emoji: '👍', color: '#1667CF' },
  { id: 'fire', label: 'On fire', emoji: '🔥', color: '#CC5800' },
  { id: 'clap', label: 'Clap', emoji: '👏', color: '#1877F2' },
  { id: 'target', label: 'On target', emoji: '🎯', color: '#0E2B50' },
  { id: 'flag', label: 'India', emoji: '🇮🇳', color: '#1877F2' },
  { id: 'strong', label: 'Strong', emoji: '💪', color: '#CC5800' },
  { id: 'star', label: 'Star', emoji: '⭐', color: '#1351A1' },
  { id: 'check', label: 'Done', emoji: '✅', color: '#1667CF' },
  { id: 'pray', label: 'All the best', emoji: '🙏', color: '#0E2B50' },
  { id: 'laugh', label: 'Haha', emoji: '😂', color: '#CC5800' },
  { id: 'rocket', label: 'Let’s go', emoji: '🚀', color: '#1351A1' },
];
