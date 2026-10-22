/**
 * Gated MP4 / HLS player — in-app chrome, speed, captions, quality, fullscreen.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { Headphones } from 'lucide-react-native';
import Video, {
  SelectedTrackType,
  SelectedVideoTrackType,
  TextTrackType,
  type OnLoadData,
  type OnProgressData,
  type VideoRef,
} from 'react-native-video';

import { ForcedLandscapeModal } from '@/features/learn/components/ForcedLandscapeModal';
import {
  LessonPlayerChrome,
  type PlayerMenu,
} from '@/features/learn/components/LessonPlayerChrome';
import {
  heightQualityLabel,
  type QualityOption,
} from '@/features/learn/lib/player-controls';
import { ms } from '@/shared/lib/responsive';

const AUTO_QUALITY: QualityOption = { id: 'auto', label: 'Auto', value: 'auto' };

export type LessonVideoPlayerProps = {
  src: string;
  captionSrc?: string | null;
  resumeAtSec?: number;
  skipIntroSec?: number;
  skipOutroSec?: number;
  chapters?: { title: string; startSec: number }[];
  /** Lecture audio (mp3 / m4a / S3) — same chrome, artwork instead of picture. */
  audioOnly?: boolean;
  poster?: ImageSourcePropType | null;
  onProgress?: (input: {
    watchPct: number;
    lastPositionSec: number;
    completed?: boolean;
    timeSpentSec?: number;
  }) => void;
};

/**
 * Course player — stay inside BIGB. Contain-fit, no external app.
 */
export function LessonVideoPlayer({
  src,
  captionSrc,
  resumeAtSec = 0,
  skipIntroSec = 0,
  skipOutroSec = 0,
  audioOnly = false,
  poster,
  onProgress,
}: LessonVideoPlayerProps) {
  const videoRef = useRef<VideoRef>(null);
  const lastSentRef = useRef(0);
  const resumedRef = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { width } = useWindowDimensions();

  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showChrome, setShowChrome] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(Boolean(captionSrc));
  const [fullscreen, setFullscreen] = useState(false);
  const [menu, setMenu] = useState<PlayerMenu>('none');
  const [qualities, setQualities] = useState<QualityOption[]>([AUTO_QUALITY]);
  const [quality, setQuality] = useState<QualityOption>(AUTO_QUALITY);

  useEffect(() => {
    resumedRef.current = false;
    lastSentRef.current = 0;
    setPaused(false);
    setCurrent(0);
    setDuration(0);
    setCaptionsOn(Boolean(captionSrc));
    setQuality(AUTO_QUALITY);
  }, [src, captionSrc]);

  const bumpChrome = useCallback(() => {
    setShowChrome(true);
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    hideTimer.current = setTimeout(() => {
      if (!paused && menu === 'none' && !audioOnly) {
        setShowChrome(false);
      }
    }, 3200);
  }, [paused, menu, audioOnly]);

  useEffect(() => {
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, []);

  const pushProgress = (
    watchPct: number,
    position: number,
    completed?: boolean,
  ) => {
    const now = Date.now();
    if (!completed && now - lastSentRef.current < 4000) {
      return;
    }
    lastSentRef.current = now;
    onProgress?.({
      watchPct: Math.round(watchPct),
      lastPositionSec: Math.floor(position),
      completed,
      timeSpentSec: 4,
    });
  };

  const onLoad = (data: OnLoadData) => {
    const dur = data.duration || 0;
    setDuration(dur);
    const tracks = (data as OnLoadData & {
      videoTracks?: { height?: number; index?: number }[];
    }).videoTracks;
    if (tracks?.length) {
      const unique = new Map<string, QualityOption>();
      tracks.forEach((track) => {
        const h = track.height || 0;
        if (h < 140) {
          return;
        }
        const label = heightQualityLabel(h);
        unique.set(label, { id: label, label, value: h });
      });
      setQualities([AUTO_QUALITY, ...Array.from(unique.values())]);
    }
    const start = current > 2 ? current : resumeAtSec;
    if (!resumedRef.current && start > 2 && start < dur - 2) {
      videoRef.current?.seek(start);
      setCurrent(start);
      resumedRef.current = true;
    }
  };

  const onTick = (data: OnProgressData) => {
    const pos = data.currentTime || 0;
    const dur = duration || data.seekableDuration || 0;
    setCurrent(pos);
    if (dur > 0) {
      const pct = (pos / dur) * 100;
      const nearEnd = skipOutroSec > 0 && pos >= dur - skipOutroSec;
      pushProgress(nearEnd ? 100 : pct, pos, nearEnd || pct >= 95);
    }
  };

  const seekRatio = (ratio: number) => {
    if (!duration) {
      return;
    }
    const next = Math.max(0, Math.min(duration, ratio * duration));
    videoRef.current?.seek(next);
    setCurrent(next);
    bumpChrome();
  };

  const selectedVideoTrack =
    quality.value === 'auto'
      ? { type: SelectedVideoTrackType.AUTO }
      : {
          type: SelectedVideoTrackType.RESOLUTION,
          value: Number(quality.value),
        };

  const inlineH = Math.round((width * 9) / 16);

  const stage = (
    <View
      style={[
        styles.shell,
        fullscreen ? styles.fullShell : { height: inlineH },
      ]}>
      <Video
        ref={videoRef}
        controls={false}
        ignoreSilentSwitch="ignore"
        muted={muted}
        onEnd={() => {
          setPaused(true);
          pushProgress(100, duration, true);
          setShowChrome(true);
        }}
        onLoad={onLoad}
        onProgress={onTick}
        paused={paused}
        playInBackground={audioOnly}
        rate={speed}
        repeat={false}
        resizeMode="contain"
        selectedTextTrack={
          captionsOn && captionSrc
            ? { type: SelectedTrackType.INDEX, value: 0 }
            : { type: SelectedTrackType.DISABLED }
        }
        selectedVideoTrack={selectedVideoTrack}
        source={{ uri: src }}
        style={audioOnly ? styles.hiddenMedia : styles.video}
        textTracks={
          captionSrc
            ? [
                {
                  title: 'Captions',
                  language: 'en',
                  type: TextTrackType.VTT,
                  uri: captionSrc,
                },
              ]
            : []
        }
      />
      {audioOnly ? (
        <View pointerEvents="none" style={styles.audioArt}>
          {poster ? (
            <Image resizeMode="cover" source={poster} style={styles.poster} />
          ) : (
            <View style={styles.audioFallback}>
              <Headphones color="#FFFFFF" size={ms(36)} />
            </View>
          )}
        </View>
      ) : null}
      <Pressable onPress={bumpChrome} style={StyleSheet.absoluteFill}>
        {showChrome ? (
          <LessonPlayerChrome
            captionsAvailable={!audioOnly && Boolean(captionSrc)}
            captionsOn={captionsOn}
            current={current}
            duration={duration}
            fullscreen={fullscreen}
            menu={menu}
            muted={muted}
            onCaptions={() => {
              setCaptionsOn((value) => !value);
              bumpChrome();
            }}
            onFullscreen={() => {
              resumedRef.current = false;
              setFullscreen((value) => !value);
              setMenu('none');
            }}
            onMenu={(next) => {
              setMenu(next);
              bumpChrome();
            }}
            onMute={() => setMuted((value) => !value)}
            onQuality={(option) => {
              setQuality(option);
              setMenu('none');
            }}
            onSeekRatio={seekRatio}
            onSpeed={(rate) => {
              setSpeed(rate);
              setMenu('none');
            }}
            onTogglePlay={() => {
              setPaused((value) => !value);
              bumpChrome();
            }}
            paused={paused}
            qualities={audioOnly ? [] : qualities}
            qualityLabel={quality.label}
            showFullscreen={!audioOnly}
            speed={speed}
          />
        ) : null}
      </Pressable>
    </View>
  );

  if (fullscreen) {
    return (
      <ForcedLandscapeModal
        onClose={() => setFullscreen(false)}
        visible>
        {stage}
      </ForcedLandscapeModal>
    );
  }

  return stage;
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  fullShell: {
    flex: 1,
  },
  video: {
    ...StyleSheet.absoluteFill,
  },
  hiddenMedia: {
    width: 1,
    height: 1,
    opacity: 0,
  },
  audioArt: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12141A',
  },
  poster: {
    width: ms(160),
    height: ms(160),
    borderRadius: ms(16),
  },
  audioFallback: {
    width: ms(120),
    height: ms(120),
    borderRadius: ms(60),
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
