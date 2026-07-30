/**
 * Fix flagged fields and resubmit a rejected application (multipart).
 */

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { FilePenLine } from 'lucide-react-native';

import { authApi } from '@/features/auth/api/auth.api';
import {
  AuthField,
  AuthMobileInput,
  AuthTextInput,
} from '@/features/auth/components/AuthFields';
import {
  EXAM_GOAL_OPTIONS,
  type ExamGoalValue,
} from '@/features/auth/constants/exam-goals';
import { normalizeMobileNumber } from '@/features/auth/lib/format-mobile';
import {
  REJECTION_FIELD_LABELS,
  REJECTION_FIELDS_BY_ROLE,
  type RejectionFieldCode,
  type RejectionRole,
} from '@/features/auth/lib/rejection-fields';
import {
  validateResubmitForm,
  type ResubmitFieldErrors,
  type ResubmitFormValues,
} from '@/features/auth/lib/validate-resubmit';
import {
  ensureUploadFileName,
  isAllowedUploadMime,
  normalizeUploadMime,
  normalizeUploadUri,
  toMultipartFilePart,
} from '@/features/auth/lib/upload-asset';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { PickedAsset } from '@/features/auth/types/register-form';
import { ApiError } from '@/shared/api/types';
import { APP_CONFIG } from '@/shared/constants/config';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Screen } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

export type ApplicationResubmitScreenProps = {
  onBack?: () => void;
  onResubmitted?: () => void;
};

type ResubmitValues = ResubmitFormValues;

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
  if (!asset?.uri) {
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

function appendAsset(
  formData: FormData,
  field: string,
  asset: PickedAsset | null,
): void {
  if (!asset?.uri) {
    return;
  }

  formData.append(field, toMultipartFilePart(asset, field) as unknown as Blob);
}

/**
 * Applicant correction form — only flagged fields are editable.
 */
export function ApplicationResubmitScreen({
  onBack,
  onResubmitted,
}: ApplicationResubmitScreenProps) {
  const theme = useTheme();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useLogout();

  const flagged = useMemo(() => {
    const stored = (user?.rejectedFields || []).filter(
      (code): code is RejectionFieldCode => code in REJECTION_FIELD_LABELS,
    );
    if (stored.length > 0) {
      return stored;
    }
    if (
      user?.role === 'institute' ||
      user?.role === 'defence_officer' ||
      user?.role === 'educator'
    ) {
      return REJECTION_FIELDS_BY_ROLE[user.role as RejectionRole];
    }
    return [];
  }, [user?.rejectedFields, user?.role]);

  const flaggedSet = useMemo(() => new Set(flagged), [flagged]);

  const [values, setValues] = useState<ResubmitValues>(() => ({
    fullName: user?.fullName || '',
    email: user?.email || '',
    mobileNumber: user?.mobileNumber || '',
    instituteName: user?.instituteName || '',
    instituteLogo: null,
    officerPhoto: null,
    officerIdDocument: null,
    examGoals: (user?.examGoals || []).filter((code): code is ExamGoalValue =>
      EXAM_GOAL_OPTIONS.some((option) => option.value === code),
    ),
    profilePhoto: null,
    idDocument: null,
  }));
  const [errors, setErrors] = useState<ResubmitFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const clearFieldError = (field: RejectionFieldCode | 'form') => {
    setErrors((prev) => {
      if (!prev[field] && !prev.form) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      if (field !== 'form') {
        delete next.form;
      }
      return next;
    });
  };

  const validate = (): boolean => {
    const next = validateResubmitForm(flaggedSet, values, {
      fullName: user?.fullName,
      email: user?.email,
      mobileNumber: user?.mobileNumber,
      instituteName: user?.instituteName,
    });
    setErrors(next);
    if (Object.keys(next).length > 0) {
      showToast.warning(
        'Check the form',
        next.form || 'Fix the highlighted fields before resubmitting.',
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!accessToken || !validate()) {
      return;
    }

    const formData = new FormData();
    if (flaggedSet.has('fullName')) {
      formData.append('fullName', values.fullName.trim());
    }
    if (flaggedSet.has('email')) {
      formData.append('email', values.email.trim());
    }
    if (flaggedSet.has('mobileNumber')) {
      formData.append(
        'mobileNumber',
        normalizeMobileNumber(values.mobileNumber),
      );
    }
    if (flaggedSet.has('instituteName')) {
      formData.append('instituteName', values.instituteName.trim());
    }
    if (flaggedSet.has('instituteLogo')) {
      appendAsset(formData, 'instituteLogo', values.instituteLogo);
    }
    if (flaggedSet.has('officerPhoto')) {
      appendAsset(formData, 'officerPhoto', values.officerPhoto);
    }
    if (flaggedSet.has('officerIdDocument')) {
      appendAsset(formData, 'officerIdDocument', values.officerIdDocument);
    }
    if (flaggedSet.has('examGoals')) {
      formData.append('examGoals', JSON.stringify(values.examGoals));
    }
    if (flaggedSet.has('profilePhoto')) {
      appendAsset(formData, 'profilePhoto', values.profilePhoto);
    }
    if (flaggedSet.has('idDocument')) {
      appendAsset(formData, 'idDocument', values.idDocument);
    }

    setIsSubmitting(true);
    try {
      const updated = await authApi.resubmitApplication(accessToken, formData);
      setUser(updated);
      showToast.success(
        'Resubmitted',
        'Your application is back under review.',
      );
      onResubmitted?.();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Could not resubmit. Please try again.';
      setErrors({ form: message });
      showErrorToast(error, message, 'Resubmit failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.accountStatus !== 'rejected') {
    return (
      <Screen contentStyle={styles.content}>
        <AppText variant="body">This application is not awaiting resubmit.</AppText>
        {onBack ? (
          <Button fullWidth onPress={onBack} variant="secondary">
            Back
          </Button>
        ) : null}
      </Screen>
    );
  }

  if (flagged.length === 0) {
    return (
      <Screen contentStyle={styles.content}>
        <AppText variant="body">No flagged fields to update.</AppText>
        {onBack ? (
          <Button fullWidth onPress={onBack} variant="secondary">
            Back
          </Button>
        ) : null}
      </Screen>
    );
  }

  const toggleExam = (value: ExamGoalValue) => {
    clearFieldError('examGoals');
    setValues((prev) => ({
      ...prev,
      examGoals: prev.examGoals.includes(value)
        ? prev.examGoals.filter((item) => item !== value)
        : [...prev.examGoals, value],
    }));
  };

  return (
    <Screen contentStyle={styles.content} scroll>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: theme.colors.primaryMuted },
        ]}>
        <FilePenLine color={theme.colors.primary} size={ms(28)} />
      </View>
      <AppText color="brand" style={styles.brand} variant="title">
        {APP_CONFIG.appName}
      </AppText>
      <AppText style={styles.heading} variant="subtitle">
        Fix & resubmit
      </AppText>
      <AppText color="secondary" style={styles.copy} variant="body">
        Update only the flagged fields, then send your application back for
        review.
      </AppText>

      {user.rejectionReason ? (
        <View
          style={[
            styles.note,
            {
              backgroundColor: theme.palette.danger[50],
              borderColor: theme.palette.danger[200],
            },
          ]}>
          <AppText color="danger" variant="caption">
            Review note
          </AppText>
          <AppText variant="body">{user.rejectionReason}</AppText>
        </View>
      ) : null}

      {flaggedSet.has('fullName') ? (
        <AuthField label="Full name">
          <AuthTextInput
            focused={focused === 'fullName'}
            onBlur={() => setFocused(null)}
            onChangeText={(fullName) => {
              clearFieldError('fullName');
              setValues((v) => ({ ...v, fullName }));
            }}
            onFocus={() => setFocused('fullName')}
            value={values.fullName}
          />
          {errors.fullName ? (
            <AppText color="danger" variant="caption">
              {errors.fullName}
            </AppText>
          ) : null}
        </AuthField>
      ) : null}

      {flaggedSet.has('email') ? (
        <AuthField label="Email">
          <AuthTextInput
            autoCapitalize="none"
            focused={focused === 'email'}
            keyboardType="email-address"
            onBlur={() => setFocused(null)}
            onChangeText={(email) => {
              clearFieldError('email');
              setValues((v) => ({ ...v, email }));
            }}
            onFocus={() => setFocused('email')}
            value={values.email}
          />
          {errors.email ? (
            <AppText color="danger" variant="caption">
              {errors.email}
            </AppText>
          ) : null}
        </AuthField>
      ) : null}

      {flaggedSet.has('mobileNumber') ? (
        <AuthField label="Mobile">
          <AuthMobileInput
            focused={focused === 'mobileNumber'}
            onBlur={() => setFocused(null)}
            onChangeText={(mobileNumber) => {
              clearFieldError('mobileNumber');
              setValues((v) => ({ ...v, mobileNumber }));
            }}
            onFocus={() => setFocused('mobileNumber')}
            value={values.mobileNumber}
          />
          {errors.mobileNumber ? (
            <AppText color="danger" variant="caption">
              {errors.mobileNumber}
            </AppText>
          ) : null}
        </AuthField>
      ) : null}

      {flaggedSet.has('instituteName') ? (
        <AuthField label="Institute name">
          <AuthTextInput
            focused={focused === 'instituteName'}
            onBlur={() => setFocused(null)}
            onChangeText={(instituteName) => {
              clearFieldError('instituteName');
              setValues((v) => ({ ...v, instituteName }));
            }}
            onFocus={() => setFocused('instituteName')}
            value={values.instituteName}
          />
          {errors.instituteName ? (
            <AppText color="danger" variant="caption">
              {errors.instituteName}
            </AppText>
          ) : null}
        </AuthField>
      ) : null}

      {flaggedSet.has('examGoals') ? (
        <AuthField label="Exam / prep goals">
          <View style={styles.chips}>
            {EXAM_GOAL_OPTIONS.map((option) => {
              const selected = values.examGoals.includes(option.value);
              return (
                <Pressable
                  key={option.value}
                  onPress={() => toggleExam(option.value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected
                        ? theme.colors.primaryMuted
                        : theme.colors.surface,
                      borderColor: selected
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}>
                  <AppText
                    color={selected ? 'brand' : 'primary'}
                    variant="caption">
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          {errors.examGoals ? (
            <AppText color="danger" variant="caption">
              {errors.examGoals}
            </AppText>
          ) : null}
        </AuthField>
      ) : null}

      {(
        [
          ['instituteLogo', 'Institute logo', 'instituteLogo', 'photo'],
          ['officerPhoto', 'Officer photo', 'officerPhoto', 'photo'],
          ['officerIdDocument', 'ID document', 'officerIdDocument', 'mixed'],
          ['profilePhoto', 'Profile photo', 'profilePhoto', 'photo'],
          ['idDocument', 'ID document', 'idDocument', 'mixed'],
        ] as const
      ).map(([code, label, key, media]) => {
        if (!flaggedSet.has(code)) {
          return null;
        }
        const asset = values[key];
        return (
          <AuthField key={code} label={label}>
            <Button
              onPress={async () => {
                const picked = await pickAsset(media);
                if (picked) {
                  clearFieldError(code);
                  setValues((v) => ({ ...v, [key]: picked }));
                } else {
                  showToast.warning(
                    'Unsupported file',
                    'Use JPEG, PNG, WebP, or PDF for ID documents.',
                  );
                }
              }}
              variant="secondary">
              {asset?.name || `Upload ${label.toLowerCase()}`}
            </Button>
            {errors[code] ? (
              <AppText color="danger" variant="caption">
                {errors[code]}
              </AppText>
            ) : null}
          </AuthField>
        );
      })}

      {errors.form ? (
        <AppText color="danger" variant="caption">
          {errors.form}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        <Button fullWidth loading={isSubmitting} onPress={handleSubmit}>
          Resubmit for review
        </Button>
        {onBack ? (
          <Button fullWidth onPress={onBack} variant="secondary">
            Back
          </Button>
        ) : null}
        <Button fullWidth onPress={logout} variant="ghost">
          Sign out
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: vs(24),
    paddingBottom: vs(40),
    gap: ms(12),
  },
  iconWrap: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  brand: {
    textAlign: 'center',
    letterSpacing: 1,
  },
  heading: {
    textAlign: 'center',
  },
  copy: {
    textAlign: 'center',
    marginBottom: vs(8),
  },
  note: {
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
    gap: ms(4),
    marginBottom: vs(4),
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ms(8),
  },
  chip: {
    borderWidth: 1,
    borderRadius: ms(999),
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
  },
  actions: {
    gap: ms(10),
    marginTop: vs(8),
  },
});
