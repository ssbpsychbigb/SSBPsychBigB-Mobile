/**
 * In-app PDF lecture — document stays in the player frame, like Udemy.
 */

import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import NativeWebView from 'react-native-webview';
import { FileText, Maximize2, Minimize2, X } from 'lucide-react-native';

import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button } from '@/shared/ui';

const InAppWebView = NativeWebView as any;

export type LessonPdfStageProps = {
  src: string;
  title: string;
  canComplete: boolean;
  completed?: boolean;
  onComplete: () => void;
};

function viewerUri(src: string): string {
  if (Platform.OS !== 'android') {
    return src;
  }
  const signed = /[?&](X-Amz-|Signature=|token=)/i.test(src);
  if (signed) {
    return src;
  }
  return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(src)}`;
}

/**
 * Player-slot PDF viewer. Portrait fullscreen — not landscape cinema.
 */
export function LessonPdfStage({
  src,
  title,
  canComplete,
  completed,
  onComplete,
}: LessonPdfStageProps) {
  const theme = useTheme();
  const [fullscreen, setFullscreen] = useState(false);
  const uri = useMemo(() => viewerUri(src), [src]);

  const document = (
    <View style={[styles.shell, fullscreen ? styles.fill : null]}>
      {InAppWebView ? (
        <InAppWebView
          allowsFullscreenVideo={false}
          mixedContentMode="always"
          originWhitelist={['*']}
          setSupportMultipleWindows={false}
          source={{ uri }}
          startInLoadingState
          style={styles.web}
        />
      ) : (
        <View style={styles.fallback}>
          <FileText color="#FFFFFF" size={ms(28)} />
          <AppText color="inverse" variant="caption">
            PDF is in this lesson. Rebuild the app to preview it in-player.
          </AppText>
        </View>
      )}
      <View style={styles.bar}>
        <FileText color="#FFFFFF" size={ms(14)} />
        <AppText
          color="inverse"
          numberOfLines={1}
          style={styles.title}
          variant="caption">
          {title}
        </AppText>
        <Pressable
          accessibilityLabel={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          onPress={() => setFullscreen((value) => !value)}
          style={styles.tool}>
          {fullscreen ? (
            <Minimize2 color="#FFFFFF" size={ms(16)} />
          ) : (
            <Maximize2 color="#FFFFFF" size={ms(16)} />
          )}
        </Pressable>
      </View>
    </View>
  );

  return (
    <View>
      {fullscreen ? <View style={styles.shell} /> : document}
      <Modal
        animationType="slide"
        onRequestClose={() => setFullscreen(false)}
        visible={fullscreen}>
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel="Close PDF"
            onPress={() => setFullscreen(false)}
            style={styles.close}>
            <X color="#FFFFFF" size={ms(18)} />
          </Pressable>
          {fullscreen ? document : null}
        </View>
      </Modal>
      <View
        style={[styles.actions, { backgroundColor: theme.colors.background }]}>
        {canComplete ? (
          <Button onPress={onComplete} size="sm">
            {completed ? 'Completed' : 'Mark complete'}
          </Button>
        ) : (
          <AppText color="muted" variant="caption">
            Preview only — enroll to save completion.
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: vs(280),
    backgroundColor: '#111318',
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
    height: undefined,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  web: {
    flex: 1,
    backgroundColor: '#111318',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(8),
    paddingHorizontal: s(20),
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  tool: {
    padding: s(4),
  },
  actions: {
    paddingHorizontal: s(16),
    paddingVertical: vs(10),
  },
  modalRoot: {
    flex: 1,
    backgroundColor: '#111318',
    paddingTop: vs(40),
  },
  close: {
    position: 'absolute',
    top: vs(12),
    right: s(12),
    zIndex: 2,
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
