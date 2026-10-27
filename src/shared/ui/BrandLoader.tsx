/**
 * BIGB loader — brand mark inside a rotating gradient arc. Used for every page / section load.
 */

import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { fontSize, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui/Text';

const MARK = require('../assets/brand/bigb-logo-mark.png');

/** The mark PNG has its own rounded border; scaling past the disc crops it out. */
const MARK_SCALE = 1.14;
const ARC_FRACTION = 0.3;

export type BrandLoaderSize = 'small' | 'large';

/**
 * - default (`large`): sizes itself so the mark sits at the vertical centre of the screen,
 *   whatever header / chips render above it.
 * - `fill`: takes the parent's remaining space and centres inside it (chat body, boot gate).
 * - `small`: compact row for "loading more" footers.
 */
export type BrandLoaderProps = {
  size?: BrandLoaderSize;
  fill?: boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

const SPEC: Record<BrandLoaderSize, { ring: number; disc: number; stroke: number }> = {
  small: { ring: ms(40), disc: ms(26), stroke: ms(2.5) },
  large: { ring: ms(64), disc: ms(42), stroke: ms(3) },
};

const LABEL_WIDTH = s(260);

export function BrandLoader({ size = 'large', fill = false, label, style }: BrandLoaderProps) {
  const theme = useTheme();
  const spin = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const centered = !fill && size === 'large';
  const inlineLabel = !fill && !centered;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    spinLoop.start();
    breatheLoop.start();
    return () => {
      spinLoop.stop();
      breatheLoop.stop();
    };
  }, [spin, breathe]);

  const { ring, disc, stroke } = SPEC[size];
  const radius = (ring - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const mark = disc * MARK_SCALE;
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] });
  const gradientId = `bigb-arc-${size}`;

  return (
    <View
      accessibilityLabel={label || 'Loading'}
      accessibilityRole="progressbar"
      style={[
        fill ? styles.fill : centered ? styles.centered : styles.inline,
        style,
      ]}>
      <View style={{ width: ring, height: ring }}>
        <Svg height={ring} style={StyleSheet.absoluteFill} width={ring}>
          <Circle
            cx={ring / 2}
            cy={ring / 2}
            fill="none"
            r={radius}
            stroke={theme.colors.primary}
            strokeOpacity={theme.mode === 'dark' ? 0.22 : 0.12}
            strokeWidth={stroke}
          />
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
          <Svg height={ring} width={ring}>
            <Defs>
              <LinearGradient id={gradientId} x1="0.45" x2="1" y1="0" y2="0.7">
                <Stop offset="0" stopColor={theme.colors.primary} stopOpacity="0" />
                <Stop offset="0.6" stopColor={theme.colors.primary} stopOpacity="1" />
                <Stop offset="1" stopColor={theme.palette.tertiary.DEFAULT} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Circle
              cx={ring / 2}
              cy={ring / 2}
              fill="none"
              r={radius}
              stroke={`url(#${gradientId})`}
              strokeDasharray={`${circumference * ARC_FRACTION} ${circumference}`}
              strokeLinecap="round"
              strokeWidth={stroke}
              transform={`rotate(-90 ${ring / 2} ${ring / 2})`}
            />
          </Svg>
        </Animated.View>
        <View style={styles.center}>
          <Animated.View
            style={[
              styles.disc,
              {
                width: disc,
                height: disc,
                borderRadius: disc / 2,
                transform: [{ scale }],
              },
            ]}>
            <Image
              resizeMode="contain"
              source={MARK}
              style={{ width: mark, height: mark }}
            />
          </Animated.View>
        </View>
        {label && !inlineLabel ? (
          <AppText
            color="muted"
            numberOfLines={1}
            style={[
              styles.label,
              styles.labelUnderRing,
              { top: ring + vs(12), left: (ring - LABEL_WIDTH) / 2 },
            ]}
            weight="medium">
            {label}
          </AppText>
        ) : null}
      </View>
      {label && inlineLabel ? (
        <AppText color="muted" style={[styles.label, styles.labelInline]} weight="medium">
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: ms(160),
  },
  centered: {
    width: '100%',
    minHeight: vs(320),
    alignItems: 'center',
    justifyContent: 'center',
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(20),
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disc: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#0D1E34',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  label: {
    fontSize: fontSize(13),
    letterSpacing: 0.2,
  },
  labelUnderRing: {
    position: 'absolute',
    width: LABEL_WIDTH,
    textAlign: 'center',
  },
  labelInline: {
    marginTop: vs(10),
  },
});
