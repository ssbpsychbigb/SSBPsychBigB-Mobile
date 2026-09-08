/**
 * Unit tests for status-bar inset resolution.
 */

import { resolveSafeTopInset } from '@/shared/lib/safe-area';

describe('resolveSafeTopInset', () => {
  it('uses Android StatusBar height when insets are 0', () => {
    expect(
      resolveSafeTopInset({
        androidStatusBarHeight: 24,
        insetsTop: 0,
        platform: 'android',
        windowMetricsTop: 0,
      }),
    ).toBe(24);
  });

  it('keeps a real cutout inset when it is taller than StatusBar height', () => {
    expect(
      resolveSafeTopInset({
        androidStatusBarHeight: 24,
        insetsTop: 52,
        platform: 'android',
        windowMetricsTop: 0,
      }),
    ).toBe(52);
  });

  it('falls back to a notch-sized inset on iOS when the provider reports 0', () => {
    expect(
      resolveSafeTopInset({
        androidStatusBarHeight: 0,
        insetsTop: 0,
        platform: 'ios',
        windowMetricsTop: 0,
      }),
    ).toBe(47);
  });

  it('prefers window metrics when they are the only non-zero source', () => {
    expect(
      resolveSafeTopInset({
        androidStatusBarHeight: 0,
        insetsTop: 0,
        platform: 'android',
        windowMetricsTop: 44,
      }),
    ).toBe(44);
  });
});
