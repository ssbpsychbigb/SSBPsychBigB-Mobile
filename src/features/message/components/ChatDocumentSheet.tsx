/**
 * In-app document picker for chat — opens the system file chooser via WebView.
 * Works without a separate native document-picker package.
 */

import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';

import type { PickedChatFile } from '@/features/message/lib/pick-chat-file';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Spinner } from '@/shared/ui';

export type ChatDocumentSheetProps = {
  visible: boolean;
  onClose: () => void;
  onPicked: (file: PickedChatFile & { dataUrl: string }) => void;
};

const PICKER_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; margin: 0; padding: 28px 20px; background: #fff; color: #0D1E34; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    p { font-size: 14px; color: #5B6B7C; margin: 0 0 20px; line-height: 1.4; }
    label { display: block; text-align: center; background: #1877F2; color: #fff; padding: 14px 16px; border-radius: 12px; font-weight: 600; font-size: 15px; }
    input { position: absolute; width: 1px; height: 1px; opacity: 0; overflow: hidden; }
    .hint { margin-top: 16px; font-size: 12px; color: #8A96A3; text-align: center; }
  </style>
</head>
<body>
  <h1>Attach a file</h1>
  <p>PDF, Word, Excel, PowerPoint, text, CSV, or ZIP.</p>
  <label for="f">Browse device files</label>
  <input id="f" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.json,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip" />
  <p class="hint">Cancel with the button below if you change your mind.</p>
  <script>
    var input = document.getElementById('f');
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ canceled: true }));
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          name: file.name || 'attachment.bin',
          type: file.type || 'application/octet-stream',
          size: file.size || 0,
          dataUrl: reader.result
        }));
      };
      reader.onerror = function () {
        window.ReactNativeWebView.postMessage(JSON.stringify({ error: 'read_failed' }));
      };
      reader.readAsDataURL(file);
    });
  </script>
</body>
</html>`;

/**
 * Bottom sheet that asks the OS for a document, then returns a data URL.
 */
export function ChatDocumentSheet({
  visible,
  onClose,
  onPicked,
}: ChatDocumentSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [reading, setReading] = useState(false);
  const handled = useRef(false);

  const onMessage = (event: WebViewMessageEvent) => {
    if (handled.current) {
      return;
    }
    try {
      const payload = JSON.parse(event.nativeEvent.data) as {
        canceled?: boolean;
        error?: string;
        name?: string;
        type?: string;
        size?: number;
        dataUrl?: string;
      };
      if (payload.canceled || payload.error || !payload.dataUrl) {
        onClose();
        return;
      }
      handled.current = true;
      setReading(true);
      onPicked({
        uri: payload.dataUrl,
        dataUrl: payload.dataUrl,
        name: payload.name || 'attachment.bin',
        type: payload.type,
        size: payload.size,
      });
    } catch {
      onClose();
    }
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => {
        handled.current = false;
        setReading(false);
      }}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.modal}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.background,
              paddingBottom: insets.bottom + vs(8),
            },
          ]}>
          <View style={[styles.grabber, { backgroundColor: theme.colors.border }]} />
          {reading ? (
            <View style={styles.loading}>
              <Spinner label="Preparing file…" />
            </View>
          ) : (
            <WebView
              allowFileAccess
              allowsInlineMediaPlayback
              originWhitelist={['*']}
              onMessage={onMessage}
              source={{ html: PICKER_HTML }}
              style={styles.web}
            />
          )}
          <Pressable onPress={onClose} style={styles.cancel}>
            <AppText color="brand" variant="label" weight="semibold">
              Cancel
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(13,30,52,0.45)',
  },
  sheet: {
    height: vs(360),
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    overflow: 'hidden',
    paddingTop: vs(8),
  },
  grabber: {
    alignSelf: 'center',
    width: ms(36),
    height: vs(4),
    borderRadius: ms(2),
    marginBottom: vs(6),
  },
  web: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: vs(12),
    paddingHorizontal: s(16),
  },
});
