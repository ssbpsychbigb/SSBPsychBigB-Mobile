/**
 * Unit tests for Metro-host → API host mapping.
 */

import {
  hostFromScriptURL,
  normalizeApiBaseUrl,
  resolveDevApiBaseUrl,
} from '@/shared/api/resolve-api-base-url';

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

  it('ignores loopback Metro on a physical phone', () => {
    expect(
      hostFromScriptURL({
        androidEmulator: false,
        platform: 'android',
        scriptURL: 'http://127.0.0.1:8081/index.bundle',
      }),
    ).toBeNull();
  });
});

describe('resolveDevApiBaseUrl', () => {
  it('uses the PC Wi-Fi IP when USB Metro is loopback', () => {
    expect(
      resolveDevApiBaseUrl({
        androidEmulator: false,
        envLocal: 'http://127.0.0.1:5000/api/v1',
        lanHost: '192.168.1.3',
        metroHost: null,
        platform: 'android',
      }),
    ).toBe('http://192.168.1.3:5000/api/v1');
  });

  it('prefers a real LAN override in .env', () => {
    expect(
      resolveDevApiBaseUrl({
        androidEmulator: false,
        envLocal: 'http://192.168.1.9:5000/api/v1',
        lanHost: '192.168.1.3',
        metroHost: '192.168.1.3',
        platform: 'android',
      }),
    ).toBe('http://192.168.1.9:5000/api/v1');
  });

  it('maps the Android emulator to 10.0.2.2', () => {
    expect(
      resolveDevApiBaseUrl({
        androidEmulator: true,
        envLocal: 'http://127.0.0.1:5000/api/v1',
        lanHost: '192.168.1.3',
        metroHost: '10.0.2.2',
        platform: 'android',
      }),
    ).toBe('http://10.0.2.2:5000/api/v1');
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

  it('ignores example placeholders', () => {
    expect(normalizeApiBaseUrl('http://YOUR_PC_IP:5000/api/v1')).toBeNull();
  });
});
