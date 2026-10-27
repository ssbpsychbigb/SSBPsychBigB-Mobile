/**
 * Runtime camera permission. Android needs it because `CAMERA` is declared in
 * the manifest; iOS asks by itself using the Info.plist usage text.
 */

import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';

export async function ensureCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  const permission = PermissionsAndroid.PERMISSIONS.CAMERA;
  if (await PermissionsAndroid.check(permission)) {
    return true;
  }

  const result = await PermissionsAndroid.request(permission, {
    title: 'Allow camera',
    message: 'BIGB uses the camera only when you take a photo or record a clip to share.',
    buttonPositive: 'Allow',
    buttonNegative: 'Not now',
  });

  if (result === PermissionsAndroid.RESULTS.GRANTED) {
    return true;
  }

  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    Alert.alert(
      'Camera is turned off',
      'Turn on Camera for BIGB in Settings to take photos and record clips.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
      ],
    );
  }
  return false;
}
