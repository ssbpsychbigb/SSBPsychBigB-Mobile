/**
 * Edit the signed-in profile — photo, name, username, bio, city.
 */

import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, ImagePlus, Trash2 } from 'lucide-react-native';

import type { RootStackParamList } from '@/app/navigation/types';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { PickedAsset } from '@/features/auth/types/register-form';
import { MediaPickError, captureFeedPhoto, pickFeedImage } from '@/features/feed/lib/pick-feed-image';
import { profileApi, profilePostKeys } from '@/features/profile/api/profile.api';
import { ChangeContactSheet } from '@/features/profile/components/ChangeContactSheet';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { useTheme } from '@/shared/theme';
import { AppText, Button, SocialStackChrome } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [photo, setPhoto] = useState<PickedAsset | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [contact, setContact] = useState<null | 'email' | 'mobile'>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user?.username || !token || loaded) {
      return;
    }
    let alive = true;
    void profileApi.getByUsername(user.username, token).then((profile) => {
      if (!alive) {
        return;
      }
      setBio(profile.bio || '');
      setCity(profile.city || '');
      setFullName(profile.fullName || user.fullName || '');
      setUsername(profile.username || user.username || '');
      setLoaded(true);
    }).catch(() => {
      if (alive) {
        setLoaded(true);
      }
    });
    return () => {
      alive = false;
    };
  }, [loaded, token, user?.fullName, user?.username]);

  const currentPhoto =
    photo?.uri ||
    (!removePhoto ? resolveUploadUrl(user?.profilePhotoPath || user?.officerPhotoPath) : undefined);

  const choose = async (camera: boolean) => {
    try {
      const asset = camera ? await captureFeedPhoto() : await pickFeedImage();
      if (!asset) {
        return;
      }
      setPhoto(asset);
      setRemovePhoto(false);
    } catch (error) {
      if (error instanceof MediaPickError) {
        showErrorToast(error, error.message, 'Photo');
      }
    }
  };

  const save = async () => {
    if (!token || !user || busy) {
      return;
    }
    const nextName = fullName.trim();
    const nextUsername = username.trim().toLowerCase();
    if (nextName.length < 2) {
      showToast.error('Name needed', 'Enter the name people should see.');
      return;
    }
    if (!/^[a-z0-9_]{3,30}$/.test(nextUsername)) {
      showToast.error(
        'Username',
        'Use 3–30 letters, numbers, or underscores.',
      );
      return;
    }
    setBusy(true);
    try {
      const profile = await profileApi.updateMe(
        {
          fullName: nextName,
          username: nextUsername,
          bio: bio.trim(),
          city: city.trim(),
          removePhoto: removePhoto && !photo,
        },
        token,
      );
      const withPhoto = photo ? await profileApi.uploadPhoto(photo, token) : profile;
      setUser({
        ...user,
        fullName: withPhoto.fullName || nextName,
        username: withPhoto.username || nextUsername,
        profilePhotoPath: withPhoto.profilePhotoPath || (removePhoto ? '' : user.profilePhotoPath),
      });
      void queryClient.invalidateQueries({ queryKey: profilePostKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['member-profile'] });
      showToast.success('Profile saved', 'Your name and photo are updated.');
      navigation.goBack();
    } catch (error) {
      showErrorToast(error, 'Could not save your profile.', 'Profile');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SocialStackChrome subtitle="This is what people see on your profile" title="Edit profile">
      <View style={styles.hero}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          {currentPhoto ? (
            <Image source={{ uri: currentPhoto }} style={styles.avatarImage} />
          ) : (
            <AppText color="inverse" variant="subtitle" weight="bold">
              {getUserInitials(fullName || user?.fullName)}
            </AppText>
          )}
        </View>
        <View style={styles.photoActions}>
          <Pressable onPress={() => void choose(true)} style={styles.photoBtn}>
            <Camera color={theme.colors.primary} size={ms(16)} strokeWidth={2} />
            <AppText color="brand" variant="caption" weight="semibold">
              Camera
            </AppText>
          </Pressable>
          <Pressable onPress={() => void choose(false)} style={styles.photoBtn}>
            <ImagePlus color={theme.colors.primary} size={ms(16)} strokeWidth={2} />
            <AppText color="brand" variant="caption" weight="semibold">
              Gallery
            </AppText>
          </Pressable>
          {currentPhoto ? (
            <Pressable
              onPress={() => {
                setPhoto(null);
                setRemovePhoto(true);
              }}
              style={styles.photoBtn}>
              <Trash2 color={theme.colors.danger} size={ms(16)} strokeWidth={2} />
              <AppText style={{ color: theme.colors.danger }} variant="caption" weight="semibold">
                Remove
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>

      <Field label="Name" onChangeText={setFullName} value={fullName} />
      <Field
        autoCapitalize="none"
        label="Username"
        onChangeText={setUsername}
        prefix="@"
        value={username}
      />
      <Field label="City" onChangeText={setCity} placeholder="Delhi" value={city} />
      <Field
        label="Bio"
        multiline
        onChangeText={setBio}
        placeholder="What you are preparing for"
        value={bio}
      />

      <Button fullWidth loading={busy} onPress={() => void save()}>
        Save profile
      </Button>

      <View style={[styles.contact, { borderColor: theme.colors.border }]}>
        <AppText variant="label" weight="bold">
          Login details
        </AppText>
        <ContactRow
          label="Email"
          onPress={() => setContact('email')}
          value={user?.email || '—'}
        />
        <ContactRow
          label="Mobile"
          onPress={() => setContact('mobile')}
          value={user?.mobileNumber || '—'}
        />
      </View>
      <ChangeContactSheet
        kind={contact || 'email'}
        onClose={() => setContact(null)}
        visible={contact != null}
      />
    </SocialStackChrome>
  );
}

function ContactRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.contactRow}>
      <View style={styles.contactCopy}>
        <AppText color="muted" variant="caption">
          {label}
        </AppText>
        <AppText numberOfLines={1} variant="body">
          {value}
        </AppText>
      </View>
      <AppText color="brand" variant="caption" weight="semibold">
        Change
      </AppText>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  prefix,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  prefix?: string;
  autoCapitalize?: 'none' | 'sentences';
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <AppText color="muted" variant="caption" weight="semibold">
        {label}
      </AppText>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}>
        {prefix ? (
          <AppText color="muted" variant="body">
            {prefix}
          </AppText>
        ) : null}
        <TextInput
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            multiline ? styles.bio : null,
            {
              color: theme.colors.text,
              fontFamily: resolveFontFamily('regular'),
            },
          ]}
          value={value}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: vs(12),
    marginBottom: vs(8),
  },
  avatar: {
    width: ms(96),
    height: ms(96),
    borderRadius: ms(48),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  photoActions: {
    flexDirection: 'row',
    gap: s(16),
  },
  photoBtn: {
    alignItems: 'center',
    gap: vs(4),
  },
  contact: {
    marginTop: vs(18),
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: vs(14),
    gap: vs(4),
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    paddingVertical: vs(8),
  },
  contactCopy: {
    flex: 1,
    gap: vs(2),
  },
  field: {
    gap: vs(6),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(14),
    paddingHorizontal: s(14),
  },
  input: {
    flex: 1,
    minHeight: vs(48),
    fontSize: fontSize(16),
    lineHeight: lineHeight(22),
  },
  bio: {
    minHeight: vs(96),
    textAlignVertical: 'top',
    paddingVertical: vs(12),
  },
});
