/**
 * Instagram-style Day Brief / Story viewer — trays, progress, pause, mute, delete.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import {
  Eye,
  Heart,
  MessageCircle,
  Pause,
  Send,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react-native';

import { STORY_REACTIONS } from '@/features/feed/lib/day-brief-constants';
import type {
  DayBriefItem,
  DayBriefSticker,
  DayBriefTray,
} from '@/features/feed/types/feed.types';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { AppText } from '@/shared/ui';

export type DayBriefViewerProps = {
  trays: DayBriefTray[];
  /** Brief id to open first (within its tray). */
  startBriefId: string | null;
  visible: boolean;
  canDelete?: boolean;
  deleteBusy?: boolean;
  onClose: () => void;
  onAuthorPress?: (username: string, name?: string) => void;
  onSegmentOpen?: (brief: DayBriefItem) => void;
  onDelete?: (brief: DayBriefItem) => void;
  onAddStory?: () => void;
  onReply?: (brief: DayBriefItem, tray: DayBriefTray) => void;
  onShare?: (brief: DayBriefItem) => void;
  onReact?: (brief: DayBriefItem, emoji: string) => void;
  onOpenViewers?: (brief: DayBriefItem) => void;
  onVotePoll?: (
    brief: DayBriefItem,
    stickerId: string,
    optionIndex: number,
  ) => void;
  onSaveHighlight?: (brief: DayBriefItem) => void;
};

function segmentDurationMs(brief: DayBriefItem | null | undefined): number {
  const sec = Number(brief?.durationSec);
  if (Number.isFinite(sec) && sec > 0) {
    return Math.max(3, Math.min(sec, 30)) * 1000;
  }
  return brief?.videoUrl ? 12_000 : 6_000;
}

/**
 * Full-screen story theatre: per-user trays, progress bars, tap zones, hold to pause.
 */
export function DayBriefViewer({
  trays,
  startBriefId,
  visible,
  canDelete = false,
  deleteBusy = false,
  onClose,
  onAuthorPress,
  onSegmentOpen,
  onDelete,
  onAddStory,
  onReply,
  onShare,
  onReact,
  onOpenViewers,
  onVotePoll,
  onSaveHighlight,
}: DayBriefViewerProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [trayIndex, setTrayIndex] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [reactOpen, setReactOpen] = useState(false);
  const [localStickers, setLocalStickers] = useState<DayBriefSticker[]>([]);
  const progressRef = useRef(0);
  const holdStarted = useRef(0);

  const start = useMemo(() => {
    if (!startBriefId || trays.length === 0) {
      return { tray: 0, item: 0 };
    }
    for (let t = 0; t < trays.length; t += 1) {
      const i = trays[t]?.items.findIndex((item) => item.id === startBriefId) ?? -1;
      if (i >= 0) {
        return { tray: t, item: i };
      }
    }
    return { tray: 0, item: 0 };
  }, [startBriefId, trays]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setTrayIndex(start.tray);
    setItemIndex(start.item);
    progressRef.current = 0;
    setProgress(0);
    setPaused(false);
    setReactOpen(false);
  }, [visible, start.tray, start.item]);

  const tray = trays[trayIndex] ?? null;
  const brief = tray?.items[itemIndex] ?? null;
  const durationMs = segmentDurationMs(brief);
  const poster = resolveUploadUrl(brief?.posterUrl);
  const videoUrl = resolveUploadUrl(brief?.videoUrl);
  const isTextStory = brief?.mediaType === 'text' || (!poster && !videoUrl && Boolean(brief?.overlayText || brief?.backgroundColor));
  const stickers = localStickers.length ? localStickers : brief?.stickers || [];

  useEffect(() => {
    if (!visible || !brief) {
      return;
    }
    onSegmentOpen?.(brief);
    progressRef.current = 0;
    setProgress(0);
    setLocalStickers(brief.stickers || []);
  }, [visible, brief?.id]);

  useEffect(() => {
    if (!visible || !brief || paused) {
      return undefined;
    }
    const started = Date.now();
    const from = progressRef.current;
    const id = setInterval(() => {
      const next = from + (Date.now() - started) / durationMs;
      progressRef.current = next;
      if (next >= 1) {
        setProgress(1);
        goNext();
        return;
      }
      setProgress(next);
    }, 40);
    return () => clearInterval(id);
  }, [visible, brief?.id, paused, durationMs, trayIndex, itemIndex]);

  const goNext = () => {
    progressRef.current = 0;
    setProgress(0);
    const currentTray = trays[trayIndex];
    if (!currentTray) {
      onClose();
      return;
    }
    if (itemIndex < currentTray.items.length - 1) {
      setItemIndex((value) => value + 1);
      return;
    }
    if (trayIndex < trays.length - 1) {
      setTrayIndex((value) => value + 1);
      setItemIndex(0);
      return;
    }
    onClose();
  };

  const goPrev = () => {
    progressRef.current = 0;
    setProgress(0);
    if (progress > 0.15) {
      setProgress(0);
      return;
    }
    if (itemIndex > 0) {
      setItemIndex((value) => value - 1);
      return;
    }
    if (trayIndex > 0) {
      const prevTray = trays[trayIndex - 1];
      setTrayIndex((value) => value - 1);
      setItemIndex(Math.max(0, (prevTray?.items.length || 1) - 1));
      return;
    }
    setProgress(0);
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={[styles.root, { width, height }]}>
        {brief && tray ? (
          <>
            <View style={StyleSheet.absoluteFill}>
              {videoUrl ? (
                <Video
                  disableFocus
                  ignoreSilentSwitch="ignore"
                  muted={muted}
                  paused={paused}
                  repeat={false}
                  resizeMode="cover"
                  source={{ uri: videoUrl }}
                  style={StyleSheet.absoluteFill}
                />
              ) : poster && !isTextStory ? (
                <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} />
              ) : (
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    styles.fallback,
                    { backgroundColor: brief.backgroundColor || '#1351A1' },
                  ]}>
                  {brief.overlayText || (isTextStory && brief.caption) ? (
                    <AppText color="inverse" style={styles.overlayHero} weight="bold">
                      {brief.overlayText || brief.caption}
                    </AppText>
                  ) : (
                    <AppText color="inverse" variant="title" weight="bold">
                      {getUserInitials(tray.name)}
                    </AppText>
                  )}
                </View>
              )}

              {!isTextStory && brief.overlayText ? (
                <View pointerEvents="none" style={styles.overlayBanner}>
                  <AppText color="inverse" style={styles.overlayBannerText} weight="bold">
                    {brief.overlayText}
                  </AppText>
                </View>
              ) : null}

              {stickers.map((sticker) => (
                <View
                  key={sticker.id}
                  pointerEvents={sticker.type === 'poll' && !tray.isSelf ? 'auto' : 'none'}
                  style={[
                    styles.sticker,
                    {
                      top: `${Math.round((sticker.y ?? 0.55) * 100)}%` as `${number}%`,
                      left: `${Math.round((sticker.x ?? 0.5) * 100)}%` as `${number}%`,
                    },
                  ]}>
                  {sticker.type === 'poll' ? (
                    <View style={styles.pollCard}>
                      <AppText color="inverse" style={styles.pollQ} weight="semibold">
                        {sticker.label || sticker.value || 'Poll'}
                      </AppText>
                      {(sticker.options || []).map((option, optionIndex) => {
                        const tallies = sticker.tallies || [];
                        const total = Math.max(
                          1,
                          tallies.reduce((sum, n) => sum + n, 0),
                        );
                        const voted = sticker.myVote != null;
                        const pct = Math.round(((tallies[optionIndex] || 0) / total) * 100);
                        const mine = sticker.myVote === optionIndex;
                        return (
                          <Pressable
                            key={`${sticker.id}-${optionIndex}`}
                            disabled={tray.isSelf || voted}
                            onPress={() => {
                              setPaused(true);
                              setLocalStickers((current) =>
                                current.map((row) => {
                                  if (row.id !== sticker.id) {
                                    return row;
                                  }
                                  const nextTallies = [...(row.tallies || row.options?.map(() => 0) || [])];
                                  while (nextTallies.length < (row.options || []).length) {
                                    nextTallies.push(0);
                                  }
                                  nextTallies[optionIndex] = (nextTallies[optionIndex] || 0) + 1;
                                  return {
                                    ...row,
                                    myVote: optionIndex,
                                    tallies: nextTallies,
                                    voteCount: (row.voteCount || 0) + 1,
                                  };
                                }),
                              );
                              onVotePoll?.(brief, sticker.id, optionIndex);
                            }}
                            style={[
                              styles.pollOption,
                              mine ? styles.pollOptionMine : null,
                            ]}>
                            <AppText color="inverse" variant="caption" weight="semibold">
                              {option}
                              {voted ? ` · ${pct}%` : ''}
                            </AppText>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.stickerChip}>
                      <AppText color="inverse" variant="caption" weight="semibold">
                        {sticker.type === 'hashtag'
                          ? `#${String(sticker.value || '').replace(/^#/, '')}`
                          : sticker.type === 'mention'
                            ? `@${String(sticker.value || '').replace(/^@/, '')}`
                            : sticker.type === 'link'
                              ? sticker.label || 'Link'
                              : sticker.label || sticker.value}
                      </AppText>
                    </View>
                  )}
                </View>
              ))}
            </View>

            <View style={[styles.chrome, { paddingTop: insets.top + vs(8) }]}>
              <View style={styles.progressRow}>
                {tray.items.map((item, index) => {
                  let fill = 0;
                  if (index < itemIndex) {
                    fill = 1;
                  } else if (index === itemIndex) {
                    fill = Math.min(1, Math.max(0, progress));
                  }
                  return (
                    <View key={item.id} style={styles.progressTrack}>
                      <View style={[styles.progressFill, { flex: fill }]} />
                      <View style={{ flex: Math.max(0, 1 - fill) }} />
                    </View>
                  );
                })}
              </View>

              <View style={styles.header}>
                <Pressable
                  accessibilityRole="link"
                  disabled={!tray.username || !onAuthorPress}
                  onPress={() => onAuthorPress?.(tray.username || '', tray.name)}
                  style={styles.author}>
                  <View style={styles.avatar}>
                    {resolveUploadUrl(tray.avatarUrl) ? (
                      <Image
                        source={{ uri: resolveUploadUrl(tray.avatarUrl) || undefined }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <AppText color="inverse" style={styles.avatarInitials} weight="bold">
                        {getUserInitials(tray.name)}
                      </AppText>
                    )}
                  </View>
                  <View style={styles.authorCopy}>
                    <AppText color="inverse" numberOfLines={1} weight="bold">
                      {tray.isSelf ? 'Your story' : tray.name}
                    </AppText>
                    <AppText color="inverse" style={styles.sub} variant="caption">
                      {brief.musicLabel || brief.music || 'Original audio'} · 24h
                    </AppText>
                  </View>
                </Pressable>

                <View style={styles.headerActions}>
                  {paused ? (
                    <View style={styles.iconBtn}>
                      <Pause color="#FFFFFF" size={ms(18)} strokeWidth={2.2} />
                    </View>
                  ) : null}
                  {videoUrl ? (
                    <Pressable
                      accessibilityLabel={muted ? 'Unmute' : 'Mute'}
                      hitSlop={ms(8)}
                      onPress={() => setMuted((value) => !value)}
                      style={styles.iconBtn}>
                      {muted ? (
                        <VolumeX color="#FFFFFF" size={ms(20)} strokeWidth={2.2} />
                      ) : (
                        <Volume2 color="#FFFFFF" size={ms(20)} strokeWidth={2.2} />
                      )}
                    </Pressable>
                  ) : null}
                  {canDelete && tray.isSelf && onDelete ? (
                    <Pressable
                      accessibilityLabel="Delete story"
                      disabled={deleteBusy}
                      hitSlop={ms(8)}
                      onPress={() => onDelete(brief)}
                      style={styles.iconBtn}>
                      <Trash2 color="#FFFFFF" size={ms(20)} strokeWidth={2.2} />
                    </Pressable>
                  ) : null}
                  {tray.isSelf && onAddStory ? (
                    <Pressable
                      accessibilityLabel="Add to story"
                      hitSlop={ms(8)}
                      onPress={onAddStory}
                      style={styles.addChip}>
                      <AppText color="inverse" variant="caption" weight="bold">
                        + Add
                      </AppText>
                    </Pressable>
                  ) : null}
                  <Pressable
                    accessibilityLabel="Close"
                    hitSlop={ms(8)}
                    onPress={onClose}
                    style={styles.iconBtn}>
                    <X color="#FFFFFF" size={ms(22)} strokeWidth={2.4} />
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.tapRow} pointerEvents="box-none">
              <Pressable
                onPress={() => {
                  if (Date.now() - holdStarted.current < 280) {
                    goPrev();
                  }
                }}
                onPressIn={() => {
                  holdStarted.current = Date.now();
                  setPaused(true);
                }}
                onPressOut={() => setPaused(false)}
                style={styles.tapZone}
              />
              <Pressable
                onPress={() => {
                  if (Date.now() - holdStarted.current < 280) {
                    goNext();
                  }
                }}
                onPressIn={() => {
                  holdStarted.current = Date.now();
                  setPaused(true);
                }}
                onPressOut={() => setPaused(false)}
                style={[styles.tapZone, styles.tapZoneWide]}
              />
            </View>

            <View
              pointerEvents="box-none"
              style={[styles.footer, { paddingBottom: insets.bottom + vs(14) }]}>
              {brief.caption && brief.caption !== brief.overlayText ? (
                <AppText color="inverse" style={styles.caption} variant="body">
                  {brief.caption}
                </AppText>
              ) : null}

              {reactOpen && !tray.isSelf ? (
                <View style={styles.reactRow}>
                  {STORY_REACTIONS.map((emoji) => (
                    <Pressable
                      key={emoji}
                      onPress={() => {
                        onReact?.(brief, emoji);
                        setReactOpen(false);
                      }}
                      style={styles.reactBtn}>
                      <AppText style={styles.reactEmoji}>{emoji}</AppText>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <View style={styles.actions}>
                {tray.isSelf ? (
                  <>
                    <Pressable
                      accessibilityLabel="Seen by"
                      onPress={() => onOpenViewers?.(brief)}
                      style={styles.actionChip}>
                      <Eye color="#FFFFFF" size={ms(18)} strokeWidth={2.2} />
                      <AppText color="inverse" variant="caption" weight="semibold">
                        Seen by
                      </AppText>
                    </Pressable>
                    {onSaveHighlight ? (
                      <Pressable
                        accessibilityLabel="Highlight"
                        onPress={() => onSaveHighlight(brief)}
                        style={styles.actionChip}>
                        <AppText color="inverse" variant="caption" weight="semibold">
                          Highlight
                        </AppText>
                      </Pressable>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Pressable
                      accessibilityLabel="React"
                      onPress={() => {
                        setPaused(true);
                        setReactOpen((value) => !value);
                      }}
                      style={styles.actionChip}>
                      <Heart color="#FFFFFF" size={ms(18)} strokeWidth={2.2} />
                      <AppText color="inverse" variant="caption" weight="semibold">
                        {brief.myReaction || 'React'}
                      </AppText>
                    </Pressable>
                    <Pressable
                      accessibilityLabel="Reply"
                      onPress={() => onReply?.(brief, tray)}
                      style={styles.actionChip}>
                      <MessageCircle color="#FFFFFF" size={ms(18)} strokeWidth={2.2} />
                      <AppText color="inverse" variant="caption" weight="semibold">
                        Reply
                      </AppText>
                    </Pressable>
                  </>
                )}
                <Pressable
                  accessibilityLabel="Share"
                  onPress={() => onShare?.(brief)}
                  style={styles.actionChip}>
                  <Send color="#FFFFFF" size={ms(18)} strokeWidth={2.2} />
                  <AppText color="inverse" variant="caption" weight="semibold">
                    Share
                  </AppText>
                </Pressable>
              </View>
            </View>
          </>
        ) : (
          <Pressable onPress={onClose} style={styles.empty}>
            <AppText color="inverse">No stories</AppText>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fallback: {
    backgroundColor: '#1351A1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(24),
  },
  overlayHero: {
    fontSize: fontSize(30),
    lineHeight: lineHeight(30, 1.2),
    textAlign: 'center',
  },
  overlayBanner: {
    position: 'absolute',
    top: '42%',
    left: s(20),
    right: s(20),
    alignItems: 'center',
  },
  overlayBannerText: {
    fontSize: fontSize(24),
    lineHeight: lineHeight(24, 1.2),
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  sticker: {
    position: 'absolute',
    transform: [{ translateX: -ms(70) }],
    zIndex: 3,
    maxWidth: s(220),
  },
  stickerChip: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: ms(999),
    paddingHorizontal: s(12),
    paddingVertical: vs(7),
  },
  pollCard: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: ms(16),
    padding: s(12),
    gap: vs(8),
    minWidth: s(180),
  },
  pollQ: {
    marginBottom: vs(2),
  },
  pollOption: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: ms(12),
    paddingHorizontal: s(10),
    paddingVertical: vs(8),
  },
  pollOptionMine: {
    backgroundColor: 'rgba(19,81,161,0.85)',
    borderColor: '#FFFFFF',
  },
  chrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 4,
    paddingHorizontal: s(10),
    gap: vs(10),
  },
  progressRow: {
    flexDirection: 'row',
    gap: s(4),
  },
  progressTrack: {
    flex: 1,
    height: vs(2.5),
    borderRadius: ms(2),
    backgroundColor: 'rgba(255,255,255,0.35)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(8),
  },
  author: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  avatar: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: fontSize(12),
  },
  authorCopy: {
    flex: 1,
    gap: vs(1),
  },
  sub: {
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  iconBtn: {
    width: ms(36),
    height: ms(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addChip: {
    borderRadius: ms(999),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
  },
  tapRow: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
    flexDirection: 'row',
  },
  tapZone: {
    flex: 1,
  },
  tapZoneWide: {
    flex: 2,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    paddingHorizontal: s(14),
    gap: vs(10),
  },
  caption: {
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  reactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: ms(16),
    paddingHorizontal: s(10),
    paddingVertical: vs(8),
  },
  reactBtn: {
    paddingHorizontal: s(4),
  },
  reactEmoji: {
    fontSize: ms(26),
  },
  actions: {
    flexDirection: 'row',
    gap: s(8),
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: ms(999),
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
