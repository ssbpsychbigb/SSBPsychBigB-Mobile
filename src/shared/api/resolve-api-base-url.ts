/**
 * Picks the backend host from the single gitignored `.env`.
 */

import { NativeModules, Platform } from 'react-native';

const LOCAL_API_PORT = 5000;

export type MetroHostInput = {
  scriptURL?: string;
  platform: typeof Platform.OS;
  androidEmulator: boolean;
};

/**
 * Strips whitespace and a trailing slash from an env URL.
 */
export function normalizeApiBaseUrl(raw: string | undefined): string | null {
  const trimmed = (raw ?? '').trim().replace(/\/$/, '');
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Extracts the bundler hostname and maps emulator loopback to 10.0.2.2.
 */
export function hostFromScriptURL({
  scriptURL,
  platform,
  androidEmulator,
}: MetroHostInput): string | null {
  if (!scriptURL) {
    return null;
  }

  const match = scriptURL.match(/^https?:\/\/([^/:]+)/i);
  if (!match) {
    return null;
  }

  const host = match[1];
  if (!host) {
    return null;
  }
  const loopback = host === 'localhost' || host === '127.0.0.1';
  if (loopback && platform === 'android' && androidEmulator) {
    return '10.0.2.2';
  }
  if (loopback) {
    return '127.0.0.1';
  }
  return host;
}

/**
 * Heuristic for the Android emulator (not a physical device).
 */
export function isAndroidEmulator(): boolean {
  if (Platform.OS !== 'android') {
    return false;
  }

  const constants = Platform.constants as {
    Brand?: string;
    Fingerprint?: string;
    Model?: string;
    Manufacturer?: string;
  };
  const blob =
    `${constants.Brand ?? ''} ${constants.Fingerprint ?? ''} ${constants.Model ?? ''} ${constants.Manufacturer ?? ''}`.toLowerCase();

  return (
    blob.includes('generic') ||
    blob.includes('emulator') ||
    blob.includes('sdk_gphone') ||
    blob.includes('google_sdk') ||
    blob.includes('ranchu')
  );
}

function readMetroScriptURL(): string | undefined {
  try {
    const source = NativeModules.SourceCode as { scriptURL?: string } | undefined;
    return source?.scriptURL;
  } catch {
    return undefined;
  }
}

function localApiBaseUrl(host: string): string {
  return `http://${host}:${LOCAL_API_PORT}/api/v1`;
}

/**
 * 1. One `.env`: LOCAL in debug, PRODUCTION in release.
 * 2. If local is empty in debug, use Metro host on port 5000.
 */
export function resolveApiBaseUrl(): string {
  if (__DEV__) {
    const local = normalizeApiBaseUrl(process.env.API_BASE_URL_LOCAL);
    if (local) {
      return local;
    }

    const fromMetro = hostFromScriptURL({
      androidEmulator: isAndroidEmulator(),
      platform: Platform.OS,
      scriptURL: readMetroScriptURL(),
    });
    if (fromMetro) {
      return localApiBaseUrl(fromMetro);
    }

    if (Platform.OS === 'android') {
      return localApiBaseUrl(isAndroidEmulator() ? '10.0.2.2' : '127.0.0.1');
    }

    return localApiBaseUrl('127.0.0.1');
  }

  const production = normalizeApiBaseUrl(process.env.API_BASE_URL_PRODUCTION);
  if (production) {
    return production;
  }

  throw new Error(
    'API_BASE_URL_PRODUCTION is missing. Set it in BigB/.env',
  );
}
