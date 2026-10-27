/**
 * Full-screen photo and video viewer.
 * Video uses our own controls — not the system player bar.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BadgeCheck, Pause, Play, Volume2, VolumeX, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Video, { type OnLoadData, type OnProgressData, type VideoRef } from 'react-native-video';

import { ms, s, vs } from '@/shared/lib/responsive';
import { AppText } from '@/shared/ui';

export type FeedMediaPost = {
  name: string;
  initials: string;
  avatarColor: string;
  avatarUri?: string;
  verified?: boolean;
  timeLabel: string;
  caption: string;
  tags: string[];
  likesLabel: string;
  commentsLabel: string;
};

export type FeedMediaViewerProps = {
  visible: boolean;
  uris: string[];
  initialIndex?: number;
  videoUri?: string | null;
  post?: FeedMediaPost;
  onAuthorPress?: () => void;
  onClose: () => void;
};

function clock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function FeedMediaViewer({
  visible,
  uris,
  initialIndex = 0,
  videoUri,
  post,
  onAuthorPress,
  onClose,
}: FeedMediaViewerProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [frame, setFrame] = useState({ width, height });
  const [index, setIndex] = useState(initialIndex);
  const start = Math.min(Math.max(initialIndex, 0), Math.max(uris.length - 1, 0));

  useEffect(() => {
    if (visible) {
      setIndex(start);
    }
  }, [start, visible]);

  return (
    <Modal
      animationType="fade"
      navigationBarTranslucent
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <GestureHandlerRootView style={styles.root}>
        <View
          onLayout={(event) => {
            const nextWidth = Math.round(event.nativeEvent.layout.width);
            const nextHeight = Math.round(event.nativeEvent.layout.height);
            setFrame((current) =>
              current.width === nextWidth && current.height === nextHeight
                ? current
                : { width: nextWidth, height: nextHeight },
            );
          }}
          style={styles.media}>
          {videoUri ? (
            <ViewerVideo uri={videoUri} />
          ) : (
            <ScrollView
              contentOffset={{ x: start * width, y: 0 }}
              decelerationRate="fast"
              horizontal
              onMomentumScrollEnd={(event) => {
                const next = Math.round(event.nativeEvent.contentOffset.x / width);
                setIndex(Math.min(uris.length - 1, Math.max(0, next)));
              }}
              pagingEnabled
              showsHorizontalScrollIndicator={false}>
              {uris.map((uri, slide) => (
                <ZoomPhoto
                  active={slide === index}
                  height={frame.height || height}
                  key={uri}
                  uri={uri}
                  width={frame.width || width}
                />
              ))}
            </ScrollView>
          )}
          {uris.length > 1 && !videoUri ? (
            <View pointerEvents="none" style={styles.dots}>
              {uris.map((uri, dot) => (
                <View key={uri} style={[styles.dot, dot === index ? styles.dotOn : null]} />
              ))}
            </View>
          ) : null}
        </View>

        {post ? <PostDetails post={post} /> : null}

        <View style={[styles.topBar, { top: insets.top + vs(8) }]}>
          <IconButton label="Close" onPress={onClose}>
            <X color="#FFFFFF" size={ms(18)} strokeWidth={2.4} />
          </IconButton>
          {post ? (
            <Pressable
              accessibilityRole={onAuthorPress ? 'link' : undefined}
              disabled={!onAuthorPress}
              onPress={onAuthorPress}
              style={styles.authorHit}>
              {post.avatarUri ? (
                <Image source={{ uri: post.avatarUri }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: post.avatarColor }]}>
                  <AppText color="inverse" variant="caption" weight="bold">
                    {post.initials}
                  </AppText>
                </View>
              )}
              <View style={styles.authorText}>
                <View style={styles.nameRow}>
                  <AppText numberOfLines={1} style={styles.name} weight="bold">
                    {post.name}
                  </AppText>
                  {post.verified ? (
                    <BadgeCheck color="#4C9AFF" size={ms(14)} strokeWidth={2.2} />
                  ) : null}
                </View>
                <AppText numberOfLines={1} style={styles.meta} variant="caption">
                  {post.timeLabel}
                </AppText>
              </View>
            </Pressable>
          ) : null}
          {uris.length > 1 && !videoUri ? (
            <View style={styles.counter}>
              <AppText style={styles.counterText} variant="caption" weight="semibold">
                {index + 1}/{uris.length}
              </AppText>
            </View>
          ) : null}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function IconButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.72 : 1 }]}>
      {children}
    </Pressable>
  );
}

function ViewerVideo({ uri }: { uri: string }) {
  const videoRef = useRef<VideoRef>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [chrome, setChrome] = useState(true);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    if (paused || !chrome) {
      return;
    }
    const timer = setTimeout(() => setChrome(false), 2400);
    return () => clearTimeout(timer);
  }, [chrome, paused]);

  const togglePlay = () => {
    setPaused((value) => !value);
    setChrome(true);
  };

  const seekTo = (locationX: number) => {
    if (!duration || !trackWidth) {
      return;
    }
    const ratio = Math.min(1, Math.max(0, locationX / trackWidth));
    const next = ratio * duration;
    videoRef.current?.seek(next);
    setCurrent(next);
    setChrome(true);
  };

  const ratio = duration > 0 ? Math.min(1, current / duration) : 0;

  return (
    <View style={styles.stage}>
      <Video
        ignoreSilentSwitch="ignore"
        muted={muted}
        onEnd={() => {
          setPaused(true);
          setChrome(true);
          setCurrent(duration);
        }}
        onError={() => setFailed(true)}
        onLoad={(event: OnLoadData) => {
          setReady(true);
          setDuration(event.duration || 0);
        }}
        onProgress={(event: OnProgressData) => {
          if (!paused) {
            setCurrent(event.currentTime);
          }
        }}
        paused={paused}
        progressUpdateInterval={200}
        ref={videoRef}
        resizeMode="contain"
        source={{ uri }}
        style={StyleSheet.absoluteFill}
      />

      <Pressable accessibilityLabel={paused ? 'Play' : 'Pause'} onPress={togglePlay} style={styles.stageHit} />

      {!ready && !failed ? (
        <View pointerEvents="none" style={styles.centerBadge}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : null}

      {failed ? (
        <View pointerEvents="none" style={styles.centerBadge}>
          <AppText style={styles.failText} variant="label" weight="semibold">
            Couldn't play this video
          </AppText>
        </View>
      ) : null}

      {paused && ready && !failed ? (
        <View pointerEvents="none" style={styles.centerBadge}>
          <View style={styles.playBadge}>
            <Play color="#FFFFFF" fill="#FFFFFF" size={ms(28)} />
          </View>
        </View>
      ) : null}

      {chrome && ready && !failed ? (
        <View style={[styles.dock, { bottom: vs(10) }]}>
          <View style={styles.dockRow}>
            <Pressable
              accessibilityLabel={paused ? 'Play' : 'Pause'}
              accessibilityRole="button"
              hitSlop={8}
              onPress={togglePlay}
              style={styles.dockPlay}>
              {paused ? (
                <Play color="#FFFFFF" fill="#FFFFFF" size={ms(16)} />
              ) : (
                <Pause color="#FFFFFF" fill="#FFFFFF" size={ms(16)} />
              )}
            </Pressable>
            <AppText style={styles.time} variant="caption" weight="semibold">
              {clock(current)}
            </AppText>
            <Pressable
              accessibilityLabel="Seek"
              onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
              onPress={(event) => seekTo(event.nativeEvent.locationX)}
              style={styles.trackHit}>
              <View style={styles.track}>
                <View style={[styles.trackFill, { width: `${ratio * 100}%` }]} />
              </View>
            </Pressable>
            <AppText style={styles.time} variant="caption" weight="semibold">
              {clock(duration)}
            </AppText>
            <Pressable
              accessibilityLabel={muted ? 'Unmute' : 'Mute'}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                setMuted((value) => !value);
                setChrome(true);
              }}
              style={styles.dockPlay}>
              {muted ? (
                <VolumeX color="#FFFFFF" size={ms(18)} strokeWidth={2.2} />
              ) : (
                <Volume2 color="#FFFFFF" size={ms(18)} strokeWidth={2.2} />
              )}
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function PostDetails({ post }: { post: FeedMediaPost }) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const long = post.caption.length > 110;
  const text = open || !long ? post.caption : `${post.caption.slice(0, 100).trim()}…`;

  return (
    <View style={[styles.details, { paddingBottom: Math.max(insets.bottom, vs(12)) }]}>
      {post.caption ? (
        <AppText style={styles.caption}>
          <AppText style={styles.name} weight="bold">
            {post.name}{' '}
          </AppText>
          {text}
          {long ? (
            <AppText onPress={() => setOpen((value) => !value)} style={styles.more} weight="semibold">
              {open ? '  less' : ' more'}
            </AppText>
          ) : null}
        </AppText>
      ) : null}
      {post.tags.length > 0 ? (
        <ScrollView
          contentContainerStyle={styles.tagRow}
          horizontal
          showsHorizontalScrollIndicator={false}>
          {post.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <AppText style={styles.tagText} variant="caption" weight="semibold">
                {tag}
              </AppText>
            </View>
          ))}
        </ScrollView>
      ) : null}
      <AppText style={styles.meta} variant="caption">
        {post.likesLabel} reactions · {post.commentsLabel} comments
      </AppText>
    </View>
  );
}

function ZoomPhoto({
  uri,
  width,
  height,
  active,
}: {
  uri: string;
  width: number;
  height: number;
  active: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const zoomed = useRef(false);
  const lastTap = useRef(0);

  useEffect(() => {
    if (!active && zoomed.current) {
      zoomed.current = false;
      scale.setValue(1);
    }
  }, [active, scale]);

  const onPress = () => {
    const now = Date.now();
    if (now - lastTap.current > 280) {
      lastTap.current = now;
      return;
    }
    lastTap.current = 0;
    const next = zoomed.current ? 1 : 2.4;
    zoomed.current = next !== 1;
    Animated.spring(scale, { toValue: next, useNativeDriver: true, friction: 7 }).start();
  };

  return (
    <Pressable onPress={onPress} style={[styles.slide, { width, height }]}>
      <Animated.Image
        resizeMode="contain"
        source={{ uri }}
        style={{ width, height: height * 0.82, transform: [{ scale }] }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  stage: {
    flex: 1,
    backgroundColor: '#000000',
  },
  stageHit: {
    ...StyleSheet.absoluteFill,
  },
  media: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    left: s(10),
    right: s(10),
    zIndex: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
  },
  authorHit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    minWidth: 0,
  },
  avatar: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  authorText: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  name: {
    color: '#FFFFFF',
    flexShrink: 1,
  },
  meta: {
    color: 'rgba(255,255,255,0.72)',
  },
  details: {
    paddingHorizontal: s(16),
    paddingTop: vs(12),
    gap: vs(8),
    backgroundColor: '#000000',
  },
  caption: {
    color: '#FFFFFF',
  },
  more: {
    color: 'rgba(255,255,255,0.65)',
  },
  tagRow: {
    flexDirection: 'row',
    gap: s(8),
    paddingRight: s(8),
  },
  tag: {
    borderRadius: ms(999),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  tagText: {
    color: '#FFFFFF',
  },
  iconBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  counter: {
    borderRadius: ms(12),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  counterText: {
    color: '#FFFFFF',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: vs(10),
    flexDirection: 'row',
    justifyContent: 'center',
    gap: s(6),
  },
  dot: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotOn: {
    width: ms(16),
    backgroundColor: '#FFFFFF',
  },
  centerBadge: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  failText: {
    color: '#FFFFFF',
  },
  playBadge: {
    width: ms(68),
    height: ms(68),
    borderRadius: ms(34),
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: ms(4),
  },
  dock: {
    position: 'absolute',
    left: s(12),
    right: s(12),
    zIndex: 4,
  },
  dockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    paddingHorizontal: s(8),
    paddingVertical: vs(6),
    borderRadius: ms(16),
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  dockPlay: {
    width: ms(28),
    height: ms(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    minWidth: ms(36),
  },
  trackHit: {
    flex: 1,
    height: ms(28),
    justifyContent: 'center',
  },
  track: {
    height: ms(3),
    borderRadius: ms(2),
    backgroundColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
});
