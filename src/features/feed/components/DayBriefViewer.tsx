/**
 * 24h story viewer — photo or video (Day Brief API).
 */

import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import Video from 'react-native-video';

import type { DayBriefItem } from '@/features/feed/types/feed.types';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { ms, s, vs } from '@/shared/lib/responsive';
import { AppText } from '@/shared/ui';

export type DayBriefViewerProps = {
  brief: DayBriefItem | null;
  onClose: () => void;
  onAuthorPress?: (username: string, name?: string) => void;
};

/**
 * Full-screen story. Separate from Reels (those stay on the Reels tab).
 */
export function DayBriefViewer({ brief, onClose, onAuthorPress }: DayBriefViewerProps) {
  const poster = resolveUploadUrl(brief?.posterUrl);
  const videoUrl = resolveUploadUrl(brief?.videoUrl);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={Boolean(brief)}>
      <Pressable onPress={onClose} style={styles.root}>
        {brief ? (
          <View style={styles.card}>
            {videoUrl ? (
              <Video
                disableFocus
                ignoreSilentSwitch="ignore"
                muted
                paused={false}
                repeat
                resizeMode="cover"
                source={{ uri: videoUrl }}
                style={styles.media}
              />
            ) : poster ? (
              <Image source={{ uri: poster }} style={styles.media} />
            ) : (
              <View style={styles.fallback}>
                <AppText color="inverse" variant="title" weight="bold">
                  {getUserInitials(brief.creator?.name)}
                </AppText>
              </View>
            )}
            <Pressable
              accessibilityRole="link"
              disabled={!brief.creator?.username || !onAuthorPress}
              onPress={(event) => {
                event.stopPropagation();
                onAuthorPress?.(brief.creator?.username || '', brief.creator?.name);
              }}>
              <AppText color="inverse" style={styles.name} weight="bold">
                {brief.creator?.name || 'Member'}
              </AppText>
            </Pressable>
            <AppText color="inverse" style={styles.caption} variant="body">
              {brief.caption}
            </AppText>
            <AppText color="inverse" style={styles.hint} variant="caption">
              Story · 24 hours · tap to close
            </AppText>
          </View>
        ) : null}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    paddingHorizontal: s(24),
  },
  card: {
    gap: vs(10),
  },
  media: {
    width: '100%',
    height: vs(420),
    borderRadius: ms(18),
    backgroundColor: '#111111',
  },
  fallback: {
    width: '100%',
    height: vs(280),
    borderRadius: ms(18),
    backgroundColor: '#1351A1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    textAlign: 'center',
  },
  caption: {
    textAlign: 'center',
  },
  hint: {
    textAlign: 'center',
    opacity: 0.7,
  },
});
