/**
 * Shared Day Brief / Story limits aligned with the backend.
 */

export const STORY_CAPTION_MAX = 280;
export const STORY_OVERLAY_MAX = 160;

export const STORY_REACTIONS = ['❤️', '🔥', '👏', '😮', '😂', '🙌'] as const;

export type StoryVisibility = 'public' | 'followers' | 'close_friends';

export const STORY_VISIBILITY_OPTIONS: {
  key: StoryVisibility;
  label: string;
  hint: string;
}[] = [
  {
    key: 'public',
    label: 'Everyone',
    hint: 'Anyone on BIGB can see this story',
  },
  {
    key: 'followers',
    label: 'Followers',
    hint: 'Only people who follow you',
  },
  {
    key: 'close_friends',
    label: 'Close friends',
    hint: 'Only people you pick',
  },
];

export const STORY_BG_COLORS = [
  '#1351A1',
  '#0B3D91',
  '#1B4D3E',
  '#7A1F1F',
  '#4A1942',
  '#1A1A2E',
  '#C45C26',
  '#2C5F2D',
] as const;

export const STORY_MUSIC_TRACKS = [
  { id: 'original', label: 'Original audio' },
  { id: 'calm-focus', label: 'Calm Focus' },
  { id: 'march-on', label: 'March On' },
  { id: 'dawn-drill', label: 'Dawn Drill' },
  { id: 'quiet-ambition', label: 'Quiet Ambition' },
] as const;

export type StoryStickerDraft = {
  id: string;
  type: 'mention' | 'hashtag' | 'location' | 'link' | 'poll' | 'question' | 'text';
  label: string;
  value: string;
  x: number;
  y: number;
  options?: string[];
};
