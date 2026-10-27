/**
 * Bottom sheet that stays above the software keyboard on Android and iOS.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type KeyboardEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';

export type KeyboardSheetProps = {
  visible: boolean;
  /** Back button, backdrop tap. */
  onRequestClose: () => void;
  children: ReactNode;
  /** `'auto'` hugs content; a number is a fraction of the window height. */
  height?: 'auto' | number;
  style?: StyleProp<ViewStyle>;
};

const IS_IOS = Platform.OS === 'ios';
const SHOW_EVENT = IS_IOS ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE_EVENT = IS_IOS ? 'keyboardWillHide' : 'keyboardDidHide';

export function useKeyboardHeight(enabled: boolean): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setHeight(0);
      return;
    }
    const onShow = (event: KeyboardEvent) => setHeight(event.endCoordinates.height);
    const onHide = () => setHeight(0);
    const showSub = Keyboard.addListener(SHOW_EVENT, onShow);
    const hideSub = Keyboard.addListener(HIDE_EVENT, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [enabled]);

  return height;
}

export function KeyboardSheet({
  visible,
  onRequestClose,
  children,
  height = 'auto',
  style,
}: KeyboardSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const keyboard = useKeyboardHeight(visible && IS_IOS);
  const [rootHeight, setRootHeight] = useState(windowHeight);
  const lift = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(lift, {
      toValue: keyboard,
      duration: Platform.OS === 'ios' ? 250 : 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [keyboard, lift]);

  useEffect(() => {
    if (!visible) {
      enter.setValue(0);
      return;
    }
    Animated.spring(enter, {
      toValue: 1,
      damping: 22,
      stiffness: 220,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  }, [enter, visible]);

  const available = rootHeight - keyboard - (IS_IOS ? insets.top : 0) - vs(12);
  const sizeStyle: ViewStyle =
    height === 'auto'
      ? { maxHeight: available }
      : { height: Math.min(windowHeight * height, available) };
  const restingBottom = IS_IOS ? Math.max(insets.bottom, vs(12)) : vs(12);

  return (
    // * Android: a non-translucent Modal window gets `adjustResize`, so the OS
    // * shrinks it above the keyboard. Keyboard events never reach JS there.
    <Modal
      animationType="fade"
      onRequestClose={onRequestClose}
      transparent
      visible={visible}>
      <GestureHandlerRootView
        onLayout={(event) => setRootHeight(event.nativeEvent.layout.height)}
        style={styles.root}>
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          onPress={onRequestClose}
          style={[StyleSheet.absoluteFill, styles.backdrop]}
        />
        <Animated.View style={[styles.dock, { paddingBottom: lift }]}>
          <Animated.View
            style={[
              styles.sheet,
              sizeStyle,
              {
                backgroundColor: theme.colors.background,
                paddingBottom: keyboard > 0 ? vs(8) : restingBottom,
                opacity: enter,
                transform: [
                  {
                    translateY: enter.interpolate({
                      inputRange: [0, 1],
                      outputRange: [vs(48), 0],
                    }),
                  },
                ],
              },
              style,
            ]}>
            <View style={[styles.grabber, { backgroundColor: theme.colors.border }]} />
            <Pressable
              accessible={false}
              onPress={Keyboard.dismiss}
              style={height === 'auto' ? undefined : styles.fill}>
              {children}
            </Pressable>
          </Animated.View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  dock: {
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: ms(26),
    borderTopRightRadius: ms(26),
    paddingHorizontal: s(18),
    paddingTop: vs(8),
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
  },
  grabber: {
    alignSelf: 'center',
    width: s(40),
    height: vs(4),
    borderRadius: 999,
    marginBottom: vs(6),
  },
});
