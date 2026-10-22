/**
 * Shared playback-rate and quality labels for file + YouTube players.
 */

export const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;

export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

export type QualityOption = {
  id: string;
  label: string;
  /** File player: height. YouTube: quality token. */
  value: string | number;
};

const YT_LABEL: Record<string, string> = {
  highres: '4K',
  hd2160: '4K',
  hd1440: '1440p',
  hd1080: '1080p',
  hd720: '720p',
  large: '480p',
  medium: '360p',
  small: '240p',
  tiny: '144p',
  default: 'Auto',
  auto: 'Auto',
};

export function youtubeQualityLabel(token: string): string {
  return YT_LABEL[token] || token.toUpperCase();
}

export function heightQualityLabel(height: number): string {
  if (height >= 1800) {
    return '4K';
  }
  if (height >= 1400) {
    return '1440p';
  }
  if (height >= 1000) {
    return '1080p';
  }
  if (height >= 680) {
    return '720p';
  }
  if (height >= 460) {
    return '480p';
  }
  if (height >= 320) {
    return '360p';
  }
  return `${Math.round(height)}p`;
}

export function youtubeQualities(tokens: string[]): QualityOption[] {
  const unique = Array.from(new Set(tokens.filter(Boolean)));
  const options = unique
    .filter((token) => token !== 'auto' && token !== 'default')
    .map((token) => ({
      id: token,
      label: youtubeQualityLabel(token),
      value: token,
    }));
  return [{ id: 'auto', label: 'Auto', value: 'default' }, ...options];
}
