/**
 * Unit tests for Metro-host → API host mapping.
 */

import { hostFromScriptURL, normalizeApiBaseUrl } from '@/shared/api/resolve-api-base-url';

describe('hostFromScriptURL', () => {
  it('reuses the LAN IP the device already uses for Metro', () => {
    expect(
      hostFromScriptURL({
        androidEmulator: false,
        platform: 'android',
        scriptURL: 'http://192.168.1.5:8081/index.bundle?platform=android',
      }),
    ).toBe('192.168.1.5');
  });

  it('maps Android emulator loopback to 10.0.2.2', () => {
    expect(
      hostFromScriptURL({
        androidEmulator: true,
        platform: 'android',
        scriptURL: 'http://localhost:8081/index.bundle',
      }),
    ).toBe('10.0.2.2');
  });

  it('keeps localhost on a physical Android device (adb reverse)', () => {
    expect(
      hostFromScriptURL({
        androidEmulator: false,
        platform: 'android',
        scriptURL: 'http://127.0.0.1:8081/index.bundle',
      }),
    ).toBe('127.0.0.1');
  });
});

describe('normalizeApiBaseUrl', () => {
  it('returns null for blank values', () => {
    expect(normalizeApiBaseUrl('')).toBeNull();
    expect(normalizeApiBaseUrl('   ')).toBeNull();
    expect(normalizeApiBaseUrl(undefined)).toBeNull();
  });

  it('strips a trailing slash', () => {
    expect(normalizeApiBaseUrl('https://api.example.com/api/v1/')).toBe(
      'https://api.example.com/api/v1',
    );
  });
});
