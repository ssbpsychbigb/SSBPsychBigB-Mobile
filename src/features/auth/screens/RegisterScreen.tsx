/**
 * Registration screen — Join as first, then role-specific fields + Zustand API.
 */

import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  GraduationCap,
  Medal,
  University,
  Upload,
  UserRound,
} from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';

import type { AuthStackParamList } from '@/app/navigation/types';
import {
  AuthField,
  AuthMobileInput,
  AuthTextInput,
} from '@/features/auth/components/AuthFields';
import {
  EXAM_GOAL_OPTIONS,
  type ExamGoalValue,
} from '@/features/auth/constants/exam-goals';
import type { RegisterJoinType } from '@/features/auth/constants/register-join-types';
import { REGISTER_JOIN_TYPES } from '@/features/auth/constants/register-join-types';
import {
  isValidIndianMobile,
  normalizeMobileNumber,
} from '@/features/auth/lib/format-mobile';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { usePermissionsStore } from '@/features/auth/store/permissions.store';
import {
  ensureUploadFileName,
  isAllowedUploadMime,
  normalizeUploadMime,
  normalizeUploadUri,
} from '@/features/auth/lib/upload-asset';
import type { PickedAsset } from '@/features/auth/types/register-form';
import { APP_CONFIG } from '@/shared/constants/config';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Screen } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

export type RegisterScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Register'
>;

const JOIN_TYPE_ICONS = {
  aspirant: GraduationCap,
  institute: University,
  defence_officer: Medal,
  educator: UserRound,
} as const;

type FocusField =
  | 'fullName'
  | 'email'
  | 'instituteName'
  | 'mobile'
  | null;

function headerSubtitle(joinType: RegisterJoinType): string {
  if (joinType === 'institute') {
    return 'Your application will be reviewed by BIGB before activation.';
  }
  if (joinType === 'defence_officer') {
    return 'Submit your details for verification as a defence mentor.';
  }
  if (joinType === 'educator') {
    return 'Apply as a freelancer educator — BIGB verifies before you teach.';
  }
  return 'Create your account to start preparing.';
}

function submitLabel(joinType: RegisterJoinType): string {
  if (joinType === 'institute') {
    return 'Apply as Institute';
  }
  if (joinType === 'defence_officer') {
    return 'Apply as Officer';
  }
  if (joinType === 'educator') {
    return 'Apply as Educator';
  }
  return 'Create Student Account';
}

async function pickAsset(
  mediaType: 'photo' | 'mixed' = 'photo',
): Promise<PickedAsset | null> {
  const result = await launchImageLibrary({
    mediaType,
    selectionLimit: 1,
    quality: 0.8,
    maxWidth: 1600,
    maxHeight: 1600,
  });

  const asset = result.assets?.[0];
  if (result.didCancel || !asset?.uri) {
    return null;
  }

  const type = normalizeUploadMime(asset.type, asset.fileName);
  if (!isAllowedUploadMime(type)) {
    return null;
  }

  return {
    uri: normalizeUploadUri(asset.uri),
    type,
    name: ensureUploadFileName(asset.fileName, 'upload', type),
  };
}

/**
 * Public registration with web-aligned role fields and backend API.
 */
export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const theme = useTheme();
  const registerAccount = useAuthStore((state) => state.registerAccount);
  const isRegistering = useAuthStore((state) => state.isRegistering);
  const authError = useAuthStore((state) => state.authError);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);
  const requestMediaPermission = usePermissionsStore(
    (state) => state.requestMediaPermission,
  );
  const mediaError = usePermissionsStore((state) => state.mediaError);
  const mediaStatus = usePermissionsStore((state) => state.mediaStatus);

  const [joinType, setJoinType] = useState<RegisterJoinType>('aspirant');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [instituteName, setInstituteName] = useState('');
  const [examGoal, setExamGoal] = useState<ExamGoalValue | ''>('');
  const [examGoals, setExamGoals] = useState<ExamGoalValue[]>([]);
  const [focused, setFocused] = useState<FocusField>(null);
  const [localError, setLocalError] = useState<string | undefined>();
  const [uploads, setUploads] = useState<{
    instituteLogo: PickedAsset | null;
    officerPhoto: PickedAsset | null;
    officerIdDocument: PickedAsset | null;
    profilePhoto: PickedAsset | null;
    idDocument: PickedAsset | null;
  }>({
    instituteLogo: null,
    officerPhoto: null,
    officerIdDocument: null,
    profilePhoto: null,
    idDocument: null,
  });

  const joinMeta = useMemo(
    () => REGISTER_JOIN_TYPES.find((option) => option.value === joinType),
    [joinType],
  );

  const error = localError || authError || mediaError || undefined;

  const toggleExamGoal = (value: ExamGoalValue) => {
    setExamGoals((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  const canSubmit = (() => {
    if (isRegistering) {
      return false;
    }
    if (!isValidIndianMobile(mobileNumber) || !email.trim()) {
      return false;
    }
    if (joinType === 'aspirant') {
      return fullName.trim().length >= 2 && Boolean(examGoal);
    }
    if (joinType === 'institute') {
      return (
        instituteName.trim().length >= 2 && Boolean(uploads.instituteLogo)
      );
    }
    if (joinType === 'defence_officer') {
      return fullName.trim().length >= 2 && Boolean(uploads.officerIdDocument);
    }
    if (joinType === 'educator') {
      return (
        fullName.trim().length >= 2 &&
        Boolean(uploads.profilePhoto) &&
        Boolean(uploads.idDocument) &&
        examGoals.length > 0
      );
    }
    return false;
  })();

  const handlePick = async (
    key: keyof typeof uploads,
    allowDocuments = false,
  ) => {
    const granted =
      mediaStatus === 'granted'
        ? true
        : await requestMediaPermission();

    if (!granted) {
      setLocalError('Photo permission is required to upload documents.');
      showToast.warning(
        'Permission needed',
        'Allow photo access to upload documents.',
      );
      return;
    }

    const asset = await pickAsset(allowDocuments ? 'mixed' : 'photo');
    if (!asset) {
      showToast.warning(
        'Unsupported file',
        'Use JPEG, PNG, WebP, or PDF (for ID documents).',
      );
      return;
    }
    setUploads((prev) => ({ ...prev, [key]: asset }));
    setLocalError(undefined);
    clearAuthError();
    showToast.success('File added', 'Ready to use in your application.');
  };

  const handleSubmit = async () => {
    setLocalError(undefined);
    clearAuthError();

    try {
      const result = await registerAccount({
        joinType,
        fullName,
        email,
        examGoal,
        examGoals,
        mobileNumber: normalizeMobileNumber(mobileNumber),
        instituteName,
        instituteLogo: uploads.instituteLogo,
        officerPhoto: uploads.officerPhoto,
        officerIdDocument: uploads.officerIdDocument,
        profilePhoto: uploads.profilePhoto,
        idDocument: uploads.idDocument,
      });

      showToast.success(
        'Account created',
        result.emailSent
          ? 'OTP emailed — check your inbox to verify.'
          : 'Verify OTP to continue. Email delivery is not configured yet.',
      );
      navigation.navigate('Otp', {
        mobileNumber: normalizeMobileNumber(mobileNumber),
        purpose: 'register',
        joinType,
        debugOtp: result.debugOtp,
      });
    } catch (error) {
      // * authError is already set in the store.
      showErrorToast(
        error,
        'Could not start registration. Please try again.',
        'Registration failed',
      );
    }
  };

  const renderUpload = (
    key: keyof typeof uploads,
    label: string,
    required = false,
    allowDocuments = false,
  ) => {
    const selected = Boolean(uploads[key]);
    return (
      <Pressable
        onPress={() => {
          handlePick(key, allowDocuments).catch(() => undefined);
        }}
        style={[
          styles.uploadRow,
          {
            borderColor: selected ? theme.colors.primary : theme.colors.border,
            backgroundColor: theme.colors.surface,
          },
        ]}>
        <Upload
          color={selected ? theme.colors.primary : theme.colors.textMuted}
          size={ms(16)}
          strokeWidth={1.9}
        />
        <View style={styles.uploadCopy}>
          <AppText style={styles.uploadTitle} variant="caption" weight="semibold">
            {label}
            {required ? ' *' : ''}
          </AppText>
          <AppText color="muted" style={styles.uploadHint} variant="caption">
            {selected
              ? uploads[key]?.name || 'Selected · tap to replace'
              : 'Tap to upload · max 5 MB'}
          </AppText>
        </View>
      </Pressable>
    );
  };

  const renderExamChips = (
    selectedValues: ExamGoalValue[],
    multi: boolean,
  ) => (
    <View style={styles.chipWrap}>
      {EXAM_GOAL_OPTIONS.map((option) => {
        const selected = selectedValues.includes(option.value);
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (multi) {
                toggleExamGoal(option.value);
              } else {
                setExamGoal(option.value);
              }
            }}
            style={[
              styles.chip,
              {
                borderColor: selected
                  ? theme.colors.primary
                  : theme.colors.border,
                backgroundColor: selected
                  ? theme.colors.primaryMuted
                  : theme.colors.surface,
              },
            ]}>
            <AppText
              color={selected ? 'brand' : 'secondary'}
              style={styles.chipText}
              variant="caption"
              weight={selected ? 'semibold' : 'medium'}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <Screen padded={false} style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Back to login"
            accessibilityRole="button"
            hitSlop={ms(10)}
            onPress={() => navigation.goBack()}
            style={styles.backBtn}>
            <ArrowLeft color={theme.colors.text} size={ms(20)} strokeWidth={1.9} />
          </Pressable>
          <AppText color="brand" style={styles.brand} variant="title" weight="bold">
            {APP_CONFIG.appName}
          </AppText>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <AppText style={styles.headline} variant="title" weight="bold">
            Join {APP_CONFIG.appName}
          </AppText>
          <AppText color="secondary" style={styles.support} variant="caption">
            {headerSubtitle(joinType)}
          </AppText>

          <AuthField label="Join as">
            <View style={styles.joinGrid}>
              {REGISTER_JOIN_TYPES.map((option) => {
                const Icon = JOIN_TYPE_ICONS[option.value];
                const selected = joinType === option.value;

                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => setJoinType(option.value)}
                    style={[
                      styles.joinCard,
                      {
                        borderColor: selected
                          ? theme.colors.primary
                          : theme.colors.border,
                        backgroundColor: selected
                          ? theme.colors.primaryMuted
                          : theme.colors.surface,
                      },
                    ]}>
                    <View
                      style={[
                        styles.joinIcon,
                        {
                          backgroundColor: selected
                            ? theme.colors.primary
                            : theme.colors.background,
                        },
                      ]}>
                      <Icon
                        color={
                          selected ? '#FFFFFF' : theme.colors.textSecondary
                        }
                        size={ms(14)}
                        strokeWidth={2}
                      />
                    </View>
                    <AppText
                      color={selected ? 'brand' : 'primary'}
                      style={styles.joinTitle}
                      variant="caption"
                      weight="semibold">
                      {option.shortTitle}
                    </AppText>
                    <AppText
                      color="muted"
                      numberOfLines={2}
                      style={styles.joinDesc}
                      variant="caption">
                      {option.description}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </AuthField>

          <View style={styles.form}>
            {joinType === 'aspirant' ? (
              <>
                <AuthField label="Full name">
                  <AuthTextInput
                    autoCapitalize="words"
                    focused={focused === 'fullName'}
                    onBlur={() => setFocused(null)}
                    onChangeText={setFullName}
                    onFocus={() => setFocused('fullName')}
                    placeholder="Full name"
                    value={fullName}
                  />
                </AuthField>
                <AuthField label="Email">
                  <AuthTextInput
                    autoCapitalize="none"
                    focused={focused === 'email'}
                    keyboardType="email-address"
                    onBlur={() => setFocused(null)}
                    onChangeText={setEmail}
                    onFocus={() => setFocused('email')}
                    placeholder="Email"
                    value={email}
                  />
                </AuthField>
                <AuthField label="Exam goal">
                  {renderExamChips(examGoal ? [examGoal] : [], false)}
                </AuthField>
              </>
            ) : null}

            {joinType === 'institute' ? (
              <>
                {renderUpload('instituteLogo', 'Institute logo', true)}
                <AuthField label="Institute name">
                  <AuthTextInput
                    autoCapitalize="words"
                    focused={focused === 'instituteName'}
                    onBlur={() => setFocused(null)}
                    onChangeText={setInstituteName}
                    onFocus={() => setFocused('instituteName')}
                    placeholder="Institute name"
                    value={instituteName}
                  />
                </AuthField>
                <AuthField label="Email">
                  <AuthTextInput
                    autoCapitalize="none"
                    focused={focused === 'email'}
                    keyboardType="email-address"
                    onBlur={() => setFocused(null)}
                    onChangeText={setEmail}
                    onFocus={() => setFocused('email')}
                    placeholder="Official email"
                    value={email}
                  />
                </AuthField>
              </>
            ) : null}

            {joinType === 'defence_officer' ? (
              <>
                <View style={styles.uploadGrid}>
                  {renderUpload('officerPhoto', 'Profile photo (optional)')}
                  {renderUpload('officerIdDocument', 'ID document', true, true)}
                </View>
                <AuthField label="Full name">
                  <AuthTextInput
                    autoCapitalize="words"
                    focused={focused === 'fullName'}
                    onBlur={() => setFocused(null)}
                    onChangeText={setFullName}
                    onFocus={() => setFocused('fullName')}
                    placeholder="Full name"
                    value={fullName}
                  />
                </AuthField>
                <AuthField label="Email">
                  <AuthTextInput
                    autoCapitalize="none"
                    focused={focused === 'email'}
                    keyboardType="email-address"
                    onBlur={() => setFocused(null)}
                    onChangeText={setEmail}
                    onFocus={() => setFocused('email')}
                    placeholder="Email"
                    value={email}
                  />
                </AuthField>
              </>
            ) : null}

            {joinType === 'educator' ? (
              <>
                <View style={styles.uploadGrid}>
                  {renderUpload('profilePhoto', 'Profile photo', true)}
                  {renderUpload('idDocument', 'ID document', true, true)}
                </View>
                <AuthField label="Full name">
                  <AuthTextInput
                    autoCapitalize="words"
                    focused={focused === 'fullName'}
                    onBlur={() => setFocused(null)}
                    onChangeText={setFullName}
                    onFocus={() => setFocused('fullName')}
                    placeholder="Full name"
                    value={fullName}
                  />
                </AuthField>
                <AuthField label="Email">
                  <AuthTextInput
                    autoCapitalize="none"
                    focused={focused === 'email'}
                    keyboardType="email-address"
                    onBlur={() => setFocused(null)}
                    onChangeText={setEmail}
                    onFocus={() => setFocused('email')}
                    placeholder="Email"
                    value={email}
                  />
                </AuthField>
                <AuthField label="Exams you prepare students for">
                  {renderExamChips(examGoals, true)}
                </AuthField>
              </>
            ) : null}

            <AuthField label="Mobile number">
              <AuthMobileInput
                focused={focused === 'mobile'}
                onBlur={() => setFocused(null)}
                onChangeText={setMobileNumber}
                onFocus={() => setFocused('mobile')}
                value={mobileNumber}
              />
            </AuthField>

            {joinType !== 'aspirant' ? (
              <View
                style={[
                  styles.note,
                  { backgroundColor: theme.colors.primaryMuted },
                ]}>
                <AppText color="brand" style={styles.noteText} variant="caption">
                  {joinMeta?.shortTitle} applications are reviewed before
                  activation.
                </AppText>
              </View>
            ) : null}

            {error ? (
              <AppText color="danger" variant="caption">
                {error}
              </AppText>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit}
            onPress={() => {
              handleSubmit().catch(() => undefined);
            }}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: theme.colors.primary,
                opacity: !canSubmit ? 0.4 : pressed ? 0.88 : 1,
              },
            ]}>
            {isRegistering ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <AppText color="inverse" variant="label" weight="semibold">
                {submitLabel(joinType)}
              </AppText>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="link"
            hitSlop={ms(8)}
            onPress={() => navigation.navigate('Login')}
            style={styles.loginLink}>
            <AppText color="secondary" variant="caption">
              Already have an account?{' '}
              <AppText color="brand" variant="caption" weight="semibold">
                Login
              </AppText>
            </AppText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    paddingHorizontal: s(16),
    paddingTop: vs(8),
    paddingBottom: vs(4),
  },
  backBtn: {
    width: ms(36),
    height: ms(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    letterSpacing: 1.1,
    fontSize: fontSize(18),
    lineHeight: lineHeight(18, 24 / 18),
  },
  scrollContent: {
    paddingHorizontal: s(24),
    paddingTop: vs(10),
    paddingBottom: vs(36),
  },
  headline: {
    fontSize: fontSize(22),
    lineHeight: lineHeight(26, 32 / 26),
    letterSpacing: -0.2,
  },
  support: {
    marginTop: vs(6),
    marginBottom: vs(20),
    fontSize: fontSize(13),
    lineHeight: lineHeight(13, 18 / 13),
  },
  joinGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ms(8),
  },
  joinCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    borderWidth: 1,
    borderRadius: ms(12),
    padding: ms(10),
    gap: ms(6),
  },
  joinIcon: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinTitle: {
    fontSize: fontSize(13),
    lineHeight: lineHeight(13, 16 / 13),
  },
  joinDesc: {
    lineHeight: lineHeight(11, 14 / 11),
    fontSize: fontSize(11),
  },
  form: {
    gap: ms(16),
    marginTop: vs(22),
    marginBottom: vs(24),
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ms(8),
  },
  chip: {
    borderWidth: 1,
    borderRadius: ms(999),
    paddingHorizontal: s(10),
    paddingVertical: vs(7),
  },
  chipText: {
    fontSize: fontSize(12),
    lineHeight: lineHeight(12, 15 / 12),
  },
  uploadGrid: {
    gap: ms(8),
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
  },
  uploadCopy: {
    flex: 1,
    gap: ms(2),
  },
  uploadTitle: {
    fontSize: fontSize(13),
    lineHeight: lineHeight(13, 16 / 13),
  },
  uploadHint: {
    fontSize: fontSize(11),
    lineHeight: lineHeight(11, 14 / 11),
  },
  note: {
    borderRadius: ms(10),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
  },
  noteText: {
    fontSize: fontSize(12),
    lineHeight: lineHeight(12, 16 / 12),
  },
  cta: {
    height: ms(48),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: vs(16),
  },
});
