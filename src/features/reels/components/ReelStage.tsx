/**
 * Immersive Prep Reel — full-bleed video with Instagram-style overlay chrome.
 */

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Bookmark,
  Heart,
  MessageCircle,
  Music2,
  Play,
  Send,
  Volume2,
  VolumeX,
} from 'lucide-react-native';

import Video from 'react-native-video';

import { getUserInitials } from '@/features/home/lib/user-initials';
import type { PrepReelPreview } from '@/features/reels/data/reels-preview';
import { getReelVideoSource } from '@/features/reels/lib/reel-video-source';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useScreenTopPadding } from '@/shared/lib/safe-area';
import { AppText } from '@/shared/ui';

const INK = '#FFFFFF';
const ICON_SIZE = ms(28);

export type ReelStageProps = {
  reel: PrepReelPreview;
  /** Measured page size. Video must use pixels — flex/percent often collapse to 0. */
  width: number;
  height: number;
  /** True when this page is selected and the Reels tab is focused. */
  isActive: boolean;
  isLiked: boolean;
  isSaved: boolean;
  isFollowing: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  onFollow: () => void;
  onOpenMessages: () => void;
  userPaused: boolean;
  onTogglePause: () => void;
};

/**
 * Edge-to-edge player. Auto-plays when active; tap pauses; mute is a separate control.
 */
export function ReelStage({
  reel,
  width,
  height,
  isActive,
  isLiked,
  isSaved,
  isFollowing,
  muted,
  onToggleMute,
  onLike,
  onComment,
  onShare,
  onSave,
  onFollow,
  onOpenMessages,
  userPaused,
  onTogglePause,
}: ReelStageProps) {
  const topPad = useScreenTopPadding(vs(4));
  const [captionOpen, setCaptionOpen] = useState(false);
  const caption = `${reel.title} ${reel.synopsis}`;
  const longCaption = caption.length > 92;
  const shownCaption =
    captionOpen || !longCaption ? caption : `${caption.slice(0, 86).trim()}…`;

  useEffect(() => {
    if (!isActive) {
      setCaptionOpen(false);
    }
  }, [isActive]);

  return (
    <View style={{ width, height, backgroundColor: '#000000' }}>
      <Video
        disableFocus
        ignoreSilentSwitch="ignore"
        muted={muted}
        paused={!isActive || userPaused}
        playInBackground={false}
        pointerEvents="none"
        repeat
        resizeMode="cover"
        source={getReelVideoSource(reel.video)}
        style={{ width, height }}
      />

      <Pressable
        accessibilityLabel={userPaused ? 'Resume reel' : 'Pause reel'}
        accessibilityRole="button"
        onPress={onTogglePause}
        style={styles.tapLayer}>
        {userPaused ? (
          <View style={styles.pauseBadge}>
            <Play color={INK} fill={INK} size={ms(28)} />
          </View>
        ) : null}
      </Pressable>

      <View pointerEvents="box-none" style={styles.chrome}>
        <View
          pointerEvents="box-none"
          style={[styles.topBar, { paddingTop: topPad }]}>
          <AppText color="inverse" style={styles.reelsTitle} variant="subtitle" weight="bold">
            Reels
          </AppText>
          <View style={styles.topActions}>
            <Pressable
              accessibilityLabel="Messages"
              accessibilityRole="button"
              hitSlop={10}
              onPress={onOpenMessages}
              style={styles.ringBtn}>
              <MessageCircle color={INK} size={ms(18)} strokeWidth={2.2} />
            </Pressable>
            <Pressable
              accessibilityLabel={muted ? 'Unmute' : 'Mute'}
              accessibilityRole="button"
              hitSlop={10}
              onPress={onToggleMute}
              style={styles.ringBtn}>
              {muted ? (
                <VolumeX color={INK} size={ms(18)} strokeWidth={2.2} />
              ) : (
                <Volume2 color={INK} size={ms(18)} strokeWidth={2.2} />
              )}
            </Pressable>
          </View>
        </View>

        <View pointerEvents="box-none" style={styles.bottomBlock}>
          <View style={styles.meta}>
            <View style={styles.identity}>
              <View style={[styles.avatar, { backgroundColor: reel.color }]}>
                <AppText color="inverse" variant="caption" weight="semibold">
                  {getUserInitials(reel.author)}
                </AppText>
              </View>
              <View style={styles.identityCopy}>
                <AppText color="inverse" numberOfLines={1} style={styles.author} weight="bold">
                  {reel.author}
                </AppText>
                <AppText color="inverse" numberOfLines={1} style={styles.posted} variant="caption">
                  {reel.authorRole} · {reel.postedAgo}
                </AppText>
              </View>
              <Pressable
                accessibilityLabel={isFollowing ? 'Following' : 'Follow'}
                accessibilityRole="button"
                onPress={onFollow}
                style={[
                  styles.follow,
                  isFollowing ? styles.followOn : styles.followOff,
                ]}>
                <AppText color="inverse" variant="caption" weight="semibold">
                  {isFollowing ? 'Following' : 'Follow'}
                </AppText>
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={!longCaption}
              onPress={() => setCaptionOpen((value) => !value)}>
              <AppText color="inverse" style={styles.caption} variant="caption">
                {shownCaption}
                {longCaption && !captionOpen ? (
                  <AppText color="inverse" style={styles.more} variant="caption" weight="semibold">
                    {' '}
                    more
                  </AppText>
                ) : null}
              </AppText>
            </Pressable>

            <View style={styles.audioRow}>
              <Music2 color={INK} size={ms(13)} strokeWidth={2.2} />
              <AppText color="inverse" numberOfLines={1} style={styles.audio} variant="caption">
                {reel.category} · {reel.duration}
              </AppText>
            </View>
          </View>

          <View style={styles.rail}>
            <RailAction
              label={reel.likesLabel}
              onPress={onLike}>
              <Heart
                color={isLiked ? '#E53935' : INK}
                fill={isLiked ? '#E53935' : 'transparent'}
                size={ICON_SIZE}
                strokeWidth={2}
              />
            </RailAction>
            <RailAction label={reel.commentsLabel} onPress={onComment}>
              <MessageCircle color={INK} size={ICON_SIZE} strokeWidth={2} />
            </RailAction>
            <RailAction label="Send" onPress={onShare}>
              <Send color={INK} size={ms(26)} strokeWidth={2} />
            </RailAction>
            <RailAction label="Save" onPress={onSave}>
              <Bookmark
                color={INK}
                fill={isSaved ? INK : 'transparent'}
                size={ICON_SIZE}
                strokeWidth={2}
              />
            </RailAction>
          </View>
        </View>
      </View>
    </View>
  );
}

function RailAction({
  children,
  label,
  onPress,
}: {
  children: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.railBtn, pressed ? styles.railBtnPressed : null]}>
      {children}
      <AppText color="inverse" style={styles.railLabel} variant="caption" weight="semibold">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tapLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBadge: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: s(3),
  },
  chrome: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: vs(48),
    paddingHorizontal: s(16),
  },
  reelsTitle: {
    color: INK,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  ringBtn: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.92)',
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: s(14),
    paddingBottom: vs(14),
    gap: s(10),
    backgroundColor: 'transparent',
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: vs(10),
    paddingBottom: vs(4),
    backgroundColor: 'transparent',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  avatar: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    borderWidth: 1.5,
    borderColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
    gap: vs(1),
  },
  author: {
    fontSize: fontSize(14),
    lineHeight: lineHeight(14, 1.2),
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  posted: {
    opacity: 0.88,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  follow: {
    paddingHorizontal: s(12),
    paddingVertical: vs(5),
    borderRadius: ms(8),
    borderWidth: 1.5,
  },
  followOff: {
    borderColor: INK,
    backgroundColor: 'transparent',
  },
  followOn: {
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  caption: {
    lineHeight: lineHeight(13, 1.4),
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  more: {
    opacity: 0.78,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
  },
  audio: {
    flex: 1,
    opacity: 0.92,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  rail: {
    alignItems: 'center',
    gap: vs(16),
    paddingBottom: vs(6),
  },
  railBtn: {
    alignItems: 'center',
    minWidth: ms(44),
    gap: vs(4),
  },
  railBtnPressed: {
    opacity: 0.75,
  },
  railLabel: {
    includeFontPadding: false,
    fontSize: fontSize(11),
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
});
