/**
 * Fullscreen cinema — landscape even when the phone rotation lock is on.
 * Rotates the player 90° instead of waiting for the system sensor.
 */

import type { ReactNode } from 'react';
import {
  Modal,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

export type ForcedLandscapeModalProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Black modal that presents children in landscape layout.
 */
export function ForcedLandscapeModal({
  visible,
  onClose,
  children,
}: ForcedLandscapeModalProps) {
  const { width, height } = useWindowDimensions();
  const portraitLocked = height >= width;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      supportedOrientations={['landscape', 'landscape-left', 'landscape-right', 'portrait']}
      visible={visible}>
      <StatusBar hidden />
      <View style={styles.root}>
        <View
          style={
            portraitLocked
              ? {
                  position: 'absolute',
                  width: height,
                  height: width,
                  top: (height - width) / 2,
                  left: (width - height) / 2,
                  transform: [{ rotate: '90deg' }],
                }
              : styles.fill
          }>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fill: {
    flex: 1,
  },
});
