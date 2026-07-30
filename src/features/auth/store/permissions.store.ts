/**
 * Device permission store — launch pre-prompt + OS permission request.
 */

import { PermissionsAndroid, Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { StorageKeys } from '@/shared/constants/storage-keys';
import { zustandStorage } from '@/shared/storage/zustand-storage';

export type PermissionStatus =
  | 'idle'
  | 'checking'
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'skipped';

type PermissionsState = {
  mediaStatus: PermissionStatus;
  isPermissionModalVisible: boolean;
  hasCompletedLaunchPrompt: boolean;
  isRequestingMedia: boolean;
  mediaError: string | null;
  /**
   * Opens the branded permission modal after splash/main screen is ready.
   */
  openLaunchPermissionModal: () => void;
  closePermissionModal: () => void;
  /**
   * User accepted custom modal → request OS permission.
   */
  acceptPermissionPrompt: () => Promise<boolean>;
  /**
   * User dismissed custom modal for now.
   */
  skipPermissionPrompt: () => void;
  /**
   * Direct OS request (e.g. before document upload).
   */
  requestMediaPermission: () => Promise<boolean>;
  resetMediaPermissionError: () => void;
};

async function checkAndroidMediaPermission(): Promise<PermissionStatus | null> {
  const sdk = typeof Platform.Version === 'number' ? Platform.Version : 0;
  const permission =
    sdk >= 33
      ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

  const has = await PermissionsAndroid.check(permission);
  return has ? 'granted' : null;
}

async function requestAndroidMediaPermission(): Promise<PermissionStatus> {
  const sdk = typeof Platform.Version === 'number' ? Platform.Version : 0;

  if (sdk >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
    );

    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      return 'granted';
    }
    if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      return 'blocked';
    }
    return 'denied';
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
  );

  if (result === PermissionsAndroid.RESULTS.GRANTED) {
    return 'granted';
  }
  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    return 'blocked';
  }
  return 'denied';
}

/**
 * Zustand store for launch permission UX + OS media access.
 */
export const usePermissionsStore = create<PermissionsState>()(
  persist(
    (set, get) => ({
      mediaStatus: 'idle',
      isPermissionModalVisible: false,
      hasCompletedLaunchPrompt: false,
      isRequestingMedia: false,
      mediaError: null,

      openLaunchPermissionModal: () => {
        const { hasCompletedLaunchPrompt, mediaStatus } = get();
        if (hasCompletedLaunchPrompt || mediaStatus === 'granted') {
          return;
        }
        set({ isPermissionModalVisible: true });
      },

      closePermissionModal: () => set({ isPermissionModalVisible: false }),

      acceptPermissionPrompt: async () => {
        set({ isRequestingMedia: true, mediaError: null });
        const granted = await get().requestMediaPermission();
        set({
          isPermissionModalVisible: false,
          hasCompletedLaunchPrompt: true,
          isRequestingMedia: false,
        });
        return granted;
      },

      skipPermissionPrompt: () => {
        set({
          isPermissionModalVisible: false,
          hasCompletedLaunchPrompt: true,
          mediaStatus: 'skipped',
          mediaError: null,
        });
      },

      requestMediaPermission: async () => {
        set({ isRequestingMedia: true, mediaStatus: 'checking', mediaError: null });

        try {
          if (Platform.OS === 'ios') {
            set({ mediaStatus: 'granted', isRequestingMedia: false });
            return true;
          }

          const already = await checkAndroidMediaPermission();
          if (already === 'granted') {
            set({
              mediaStatus: 'granted',
              isRequestingMedia: false,
              mediaError: null,
            });
            return true;
          }

          const status = await requestAndroidMediaPermission();
          set({
            mediaStatus: status,
            isRequestingMedia: false,
            mediaError:
              status === 'granted'
                ? null
                : 'Photo permission is required to upload documents.',
          });
          return status === 'granted';
        } catch {
          set({
            mediaStatus: 'denied',
            isRequestingMedia: false,
            mediaError: 'Unable to request photo permission right now.',
          });
          return false;
        }
      },

      resetMediaPermissionError: () => set({ mediaError: null }),
    }),
    {
      name: StorageKeys.PERMISSIONS,
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        mediaStatus: state.mediaStatus,
        hasCompletedLaunchPrompt: state.hasCompletedLaunchPrompt,
      }),
    },
  ),
);
