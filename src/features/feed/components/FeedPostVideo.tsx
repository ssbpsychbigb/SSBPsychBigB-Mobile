/**
 * Video media for a post card — poster tile in lists, inline player on PostDetail.
 */

import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Play } from 'lucide-react-native';
import Video from 'react-native-video';

import type { FeedPost } from '@/features/feed/types/feed.types';
import { ms, s, vs } from '@/shared/lib/responsive';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';

export function postVideoUri(post: FeedPost): string | null {
  const video = post.media.find((item) => item.mediaType === 'video');
  return resolveUploadUrl(video?.url);
}

function postPosterUri(post: FeedPost): string | null {
  const video = post.media.find((item) => item.mediaType === 'video');
  return resolveUploadUrl(video?.thumbnail);
}

export type FeedPostVideoProps = {
  post: FeedPost;
  mode: 'tile' | 'player';
  onPress?: () => void;
  /** Player mode only — pause when the screen loses focus. */
  paused?: boolean;
};

export function FeedPostVideo({ post, mode, onPress, paused = false }: FeedPostVideoProps) {
  const uri = postVideoUri(post);
  const poster = postPosterUri(post);

  if (!uri) {
    return null;
  }

  if (mode === 'tile') {
    return (
      <View style={styles.wrap}>
        <Pressable
          accessibilityLabel="Play video"
          accessibilityRole="button"
          onPress={onPress}
          style={[styles.frame, styles.tile]}>
          {poster ? (
            <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} />
          ) : (
            <Video
              muted
              paused
              pointerEvents="none"
              resizeMode="cover"
              source={{ uri }}
              style={StyleSheet.absoluteFill}
            />
          )}
          <View style={styles.playBadge}>
            <Play color="#FFFFFF" fill="#FFFFFF" size={ms(22)} />
          </View>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.frame, styles.player]}>
        <Video
          controls
          ignoreSilentSwitch="ignore"
          paused={paused}
          repeat
          resizeMode="contain"
          source={{ uri }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: s(10),
  },
  frame: {
    width: '100%',
    borderRadius: ms(16),
    overflow: 'hidden',
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: {
    height: vs(220),
  },
  player: {
    height: vs(380),
  },
  playBadge: {
    width: ms(52),
    height: ms(52),
    borderRadius: ms(26),
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: s(3),
  },
});
