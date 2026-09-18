/**
 * Debug API = this PC's Wi-Fi IP (or emulator 10.0.2.2). USB is not required.
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
  if (!trimmed) {
    return null;
  }
  if (/YOUR_PC_IP|YOUR_LAN_IP|YOUR_API_HOST/i.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function hostnameIsLoopback(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

/**
 * True when the URL still points at loopback (useless on a physical phone).
 */
export function isLoopbackApiBaseUrl(url: string): boolean {
  try {
    return hostnameIsLoopback(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * Bundler hostname. Loopback on a physical phone is ignored (USB reverse is gone
 * the moment the cable is pulled).
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
  const host = match?.[1];
  if (!host) {
    return null;
  }

  if (hostnameIsLoopback(host)) {
    if (platform === 'android' && androidEmulator) {
      return '10.0.2.2';
    }
    return null;
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

export type DevApiBaseInput = {
  envLocal: string | null;
  lanHost: string | null;
  metroHost: string | null;
  platform: typeof Platform.OS;
  androidEmulator: boolean;
};

/**
 * Phone → PC over Wi-Fi. Cable unplug does not change the URL.
 */
export function resolveDevApiBaseUrl({
  envLocal,
  lanHost,
  metroHost,
  platform,
  androidEmulator,
}: DevApiBaseInput): string {
  if (platform === 'android' && androidEmulator) {
    return localApiBaseUrl('10.0.2.2');
  }

  if (envLocal && !isLoopbackApiBaseUrl(envLocal)) {
    return envLocal;
  }

  if (metroHost && !hostnameIsLoopback(metroHost) && metroHost !== '10.0.2.2') {
    return localApiBaseUrl(metroHost);
  }

  if (lanHost && !hostnameIsLoopback(lanHost)) {
    return localApiBaseUrl(lanHost);
  }

  return localApiBaseUrl('127.0.0.1');
}

/**
 * Debug: Wi-Fi IP of this PC. Release: API_BASE_URL_PRODUCTION.
 */
export function resolveApiBaseUrl(): string {
  if (__DEV__) {
    return resolveDevApiBaseUrl({
      androidEmulator: isAndroidEmulator(),
      envLocal: normalizeApiBaseUrl(process.env.API_BASE_URL_LOCAL),
      lanHost: (process.env.DEV_LAN_HOST || '').trim() || null,
      metroHost: hostFromScriptURL({
        androidEmulator: isAndroidEmulator(),
        platform: Platform.OS,
        scriptURL: readMetroScriptURL(),
      }),
      platform: Platform.OS,
    });
  }

  const production = normalizeApiBaseUrl(process.env.API_BASE_URL_PRODUCTION);
  if (production) {
    return production;
  }

  throw new Error('API_BASE_URL_PRODUCTION is missing. Set it in BigB/.env');
}
