/**
 * In-app cinema chrome — play, scrub, speed, captions, quality, fullscreen.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Captions,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react-native';

import { formatLessonClock } from '@/features/learn/lib/format-course';
import {
  PLAYBACK_SPEEDS,
  type QualityOption,
} from '@/features/learn/lib/player-controls';
import { ms, s, vs } from '@/shared/lib/responsive';
import { AppText } from '@/shared/ui';

const INK = '#FFFFFF';

export type PlayerMenu = 'none' | 'speed' | 'quality';

export type LessonPlayerChromeProps = {
  paused: boolean;
  muted: boolean;
  current: number;
  duration: number;
  speed: number;
  captionsOn: boolean;
  captionsAvailable: boolean;
  qualityLabel: string;
  qualities: QualityOption[];
  fullscreen: boolean;
  showFullscreen?: boolean;
  menu: PlayerMenu;
  onTogglePlay: () => void;
  onSeekRatio: (ratio: number) => void;
  onMute: () => void;
  onSpeed: (speed: number) => void;
  onCaptions: () => void;
  onQuality: (option: QualityOption) => void;
  onFullscreen: () => void;
  onMenu: (menu: PlayerMenu) => void;
};

/**
 * Overlay controls shared by file and YouTube lesson players.
 */
export function LessonPlayerChrome({
  paused,
  muted,
  current,
  duration,
  speed,
  captionsOn,
  captionsAvailable,
  qualityLabel,
  qualities,
  fullscreen,
  showFullscreen = true,
  menu,
  onTogglePlay,
  onSeekRatio,
  onMute,
  onSpeed,
  onCaptions,
  onQuality,
  onFullscreen,
  onMenu,
}: LessonPlayerChromeProps) {
  const progress = duration > 0 ? current / duration : 0;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.shade} pointerEvents="none" />

      <Pressable onPress={onTogglePlay} style={styles.playHit}>
        <View style={styles.playRing}>
          {paused ? (
            <Play color={INK} fill={INK} size={ms(28)} />
          ) : (
            <Pause color={INK} fill={INK} size={ms(26)} />
          )}
        </View>
      </Pressable>

      {menu === 'speed' ? (
        <View style={styles.sheet}>
          <AppText color="inverse" variant="caption" weight="bold">
            Playback speed
          </AppText>
          <View style={styles.chips}>
            {PLAYBACK_SPEEDS.map((rate) => (
              <Pressable
                key={rate}
                onPress={() => onSpeed(rate)}
                style={[styles.chip, speed === rate ? styles.chipOn : null]}>
                <AppText
                  color="inverse"
                  variant="caption"
                  weight={speed === rate ? 'bold' : 'semibold'}>
                  {rate === 1 ? 'Normal' : `${rate}x`}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {menu === 'quality' ? (
        <View style={styles.sheet}>
          <AppText color="inverse" variant="caption" weight="bold">
            Quality
          </AppText>
          <View style={styles.chips}>
            {qualities.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => onQuality(option)}
                style={[
                  styles.chip,
                  option.label === qualityLabel ? styles.chipOn : null,
                ]}>
                <AppText
                  color="inverse"
                  variant="caption"
                  weight={option.label === qualityLabel ? 'bold' : 'semibold'}>
                  {option.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.bottom}>
        <ScrubBar onSeek={onSeekRatio} progress={progress} />
        <View style={styles.row}>
          <AppText color="inverse" variant="caption">
            {formatLessonClock(Math.floor(current))}
            {duration > 0
              ? ` / ${formatLessonClock(Math.floor(duration))}`
              : ''}
          </AppText>
          <View style={styles.tools}>
            <Pressable
              onPress={() => onMenu(menu === 'speed' ? 'none' : 'speed')}
              style={styles.tool}>
              <AppText color="inverse" variant="caption" weight="bold">
                {speed === 1 ? '1x' : `${speed}x`}
              </AppText>
            </Pressable>
            {captionsAvailable ? (
              <Pressable onPress={onCaptions} style={styles.tool}>
                <Captions
                  color={captionsOn ? INK : 'rgba(255,255,255,0.4)'}
                  size={ms(17)}
                />
              </Pressable>
            ) : null}
            {qualities.length > 1 ? (
              <Pressable
                onPress={() => onMenu(menu === 'quality' ? 'none' : 'quality')}
                style={styles.tool}>
                <Settings color={INK} size={ms(16)} />
                <AppText color="inverse" variant="caption">
                  {qualityLabel}
                </AppText>
              </Pressable>
            ) : null}
            <Pressable onPress={onMute} style={styles.tool}>
              {muted ? (
                <VolumeX color={INK} size={ms(17)} />
              ) : (
                <Volume2 color={INK} size={ms(17)} />
              )}
            </Pressable>
            {showFullscreen ? (
              <Pressable onPress={onFullscreen} style={styles.tool}>
                {fullscreen ? (
                  <Minimize2 color={INK} size={ms(17)} />
                ) : (
                  <Maximize2 color={INK} size={ms(17)} />
                )}
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function ScrubBar({
  progress,
  onSeek,
}: {
  progress: number;
  onSeek: (ratio: number) => void;
}) {
  const [width, setWidth] = useState(1);

  return (
    <Pressable
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      onPress={(event) => {
        onSeek(event.nativeEvent.locationX / Math.max(width, 1));
      }}
      style={styles.barHit}>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${Math.min(100, progress * 100)}%` }]}
        />
        <View
          style={[
            styles.knob,
            { left: `${Math.min(100, Math.max(0, progress * 100))}%` },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
  },
  shade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  playHit: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playRing: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    position: 'absolute',
    left: s(12),
    right: s(12),
    bottom: vs(72),
    backgroundColor: 'rgba(12,14,20,0.94)',
    borderRadius: ms(14),
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
    gap: vs(10),
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
  },
  chip: {
    paddingHorizontal: s(10),
    paddingVertical: vs(6),
    borderRadius: ms(99),
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  chipOn: {
    backgroundColor: '#1877F2',
  },
  bottom: {
    paddingHorizontal: s(12),
    paddingBottom: vs(10),
    gap: vs(4),
  },
  barHit: {
    height: vs(22),
    justifyContent: 'center',
  },
  track: {
    height: vs(4),
    borderRadius: ms(99),
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  fill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(99),
  },
  knob: {
    position: 'absolute',
    top: vs(-4),
    width: ms(12),
    height: ms(12),
    marginLeft: -ms(6),
    borderRadius: ms(6),
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(8),
  },
  tools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  tool: {
    minHeight: ms(28),
    paddingHorizontal: s(4),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
});
