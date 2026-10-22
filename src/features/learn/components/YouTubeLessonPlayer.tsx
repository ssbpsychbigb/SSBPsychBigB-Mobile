/**
 * YouTube lessons play inside BIGB — iframe API, never the YouTube app.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import NativeWebView from 'react-native-webview';

/** Default export — named `{ WebView }` is undefined under Metro interop. */
const InAppWebView = NativeWebView as any;

import { ForcedLandscapeModal } from '@/features/learn/components/ForcedLandscapeModal';
import {
  LessonPlayerChrome,
  type PlayerMenu,
} from '@/features/learn/components/LessonPlayerChrome';
import {
  type QualityOption,
  youtubeQualities,
} from '@/features/learn/lib/player-controls';
import {
  buildYoutubePlayerHtml,
  isYoutubeAppHandoffUrl,
} from '@/features/learn/lib/youtube-player-html';
import { AppText } from '@/shared/ui';

type YtMessage = {
  type?: string;
  time?: number;
  duration?: number;
  state?: number;
  qualities?: string[];
  code?: number;
};

export type YouTubeLessonPlayerProps = {
  videoId: string;
  resumeAtSec?: number;
  onProgress?: (input: {
    watchPct: number;
    lastPositionSec: number;
    completed?: boolean;
    timeSpentSec?: number;
  }) => void;
};

/**
 * Custom chrome over a locked-down YouTube embed.
 */
export function YouTubeLessonPlayer({
  videoId,
  resumeAtSec = 0,
  onProgress,
}: YouTubeLessonPlayerProps) {
  const webRef = useRef<{ injectJavaScript: (js: string) => void } | null>(null);
  const lastSentRef = useRef(0);
  const { width } = useWindowDimensions();

  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [current, setCurrent] = useState(resumeAtSec);
  const [duration, setDuration] = useState(0);
  const [showChrome, setShowChrome] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [menu, setMenu] = useState<PlayerMenu>('none');
  const [qualities, setQualities] = useState<QualityOption[]>([
    { id: 'auto', label: 'Auto', value: 'default' },
  ]);
  const [qualityLabel, setQualityLabel] = useState('Auto');
  const [embedStart, setEmbedStart] = useState(resumeAtSec);

  const send = useCallback((cmd: Record<string, unknown>) => {
    webRef.current?.injectJavaScript(
      `window.__cmd && window.__cmd(${JSON.stringify(cmd)}); true;`,
    );
  }, []);

  useEffect(() => {
    lastSentRef.current = 0;
    setPaused(false);
    setCurrent(resumeAtSec);
    setDuration(0);
    setQualityLabel('Auto');
    setEmbedStart(resumeAtSec);
  }, [videoId, resumeAtSec]);

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

  const onMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as YtMessage;
      if (data.type === 'ready' || data.type === 'progress' || data.type === 'state') {
        if (typeof data.duration === 'number' && data.duration > 0) {
          setDuration(data.duration);
        }
        if (typeof data.time === 'number') {
          setCurrent(data.time);
          const dur = data.duration || duration;
          if (dur > 0) {
            const pct = (data.time / dur) * 100;
            pushProgress(pct, data.time, pct >= 95);
          }
        }
        if (data.type === 'state') {
          // 1 playing, 2 paused, 0 ended
          if (data.state === 1) {
            setPaused(false);
          }
          if (data.state === 2) {
            setPaused(true);
          }
          if (data.state === 0) {
            setPaused(true);
            pushProgress(100, data.duration || duration, true);
          }
        }
      }
      if ((data.type === 'ready' || data.type === 'qualities') && data.qualities) {
        setQualities(youtubeQualities(data.qualities));
      }
    } catch {
      /* ignore malformed iframe posts */
    }
  };

  const togglePlay = () => {
    if (paused) {
      send({ action: 'play' });
      setPaused(false);
    } else {
      send({ action: 'pause' });
      setPaused(true);
    }
    setShowChrome(true);
    setMenu('none');
  };

  const seekRatio = (ratio: number) => {
    const dur = duration || 1;
    const next = Math.max(0, Math.min(dur, ratio * dur));
    send({ action: 'seek', time: next });
    setCurrent(next);
  };

  const html = useMemo(
    () => buildYoutubePlayerHtml(videoId, embedStart),
    [videoId, embedStart],
  );
  const inlineH = Math.round((width * 9) / 16);

  if (!InAppWebView) {
    return (
      <View style={[styles.shell, { height: inlineH, justifyContent: 'center' }]}>
        <AppText color="inverse" style={{ textAlign: 'center', paddingHorizontal: 24 }} variant="caption">
          Rebuild the app once to enable in-app YouTube (yarn android).
        </AppText>
      </View>
    );
  }

  const player = (
    <View style={[styles.shell, fullscreen ? styles.fullShell : { height: inlineH }]}>
      <InAppWebView
        ref={webRef}
        allowsFullscreenVideo={false}
        allowsInlineMediaPlayback
        automaticallyAdjustContentInsets={false}
        androidLayerType="hardware"
        domStorageEnabled
        javaScriptEnabled
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="always"
        nestedScrollEnabled={false}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={(request: { url: string }) =>
          !isYoutubeAppHandoffUrl(request.url)
        }
        originWhitelist={['*']}
        scrollEnabled={false}
        setSupportMultipleWindows={false}
        source={{
          html,
          baseUrl: 'https://www.youtube-nocookie.com',
        }}
        style={styles.web}
      />
      <Pressable
        onPress={() => {
          setShowChrome(true);
          setMenu('none');
        }}
        style={StyleSheet.absoluteFill}>
        {showChrome ? (
          <LessonPlayerChrome
            captionsAvailable
            captionsOn={captionsOn}
            current={current}
            duration={duration}
            fullscreen={fullscreen}
            menu={menu}
            muted={muted}
            onCaptions={() => {
              const next = !captionsOn;
              setCaptionsOn(next);
              send({ action: next ? 'captionsOn' : 'captionsOff' });
            }}
            onFullscreen={() => {
              setEmbedStart(Math.floor(current));
              setFullscreen((value) => !value);
              setMenu('none');
            }}
            onMenu={setMenu}
            onMute={() => {
              const next = !muted;
              setMuted(next);
              send({ action: next ? 'mute' : 'unmute' });
            }}
            onQuality={(option) => {
              setQualityLabel(option.label);
              send({ action: 'quality', quality: option.value });
              setMenu('none');
            }}
            onSeekRatio={seekRatio}
            onSpeed={(rate) => {
              setSpeed(rate);
              send({ action: 'rate', rate });
              setMenu('none');
            }}
            onTogglePlay={togglePlay}
            paused={paused}
            qualities={qualities}
            qualityLabel={qualityLabel}
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
        {player}
      </ForcedLandscapeModal>
    );
  }

  return player;
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  fullShell: {
    flex: 1,
  },
  web: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
