/**
 * Leave / Resign request modal — reason required; leave uses calendar dates.
 */

import { useEffect, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AuthField } from '@/features/auth/components/AuthFields';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { BUTTON_HEIGHT } from '@/shared/ui/Button';
import {
  AppDateField,
  parseIsoDate,
  toIsoDate,
} from '@/shared/ui/AppDateField';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui/Text';

export type CollabHrMode = 'leave' | 'resign';

export type CollabHrRequestModalProps = {
  visible: boolean;
  mode: CollabHrMode;
  instituteName?: string;
  /** When true, leave form updates an existing pending request. */
  isLeaveUpdate?: boolean;
  initialReason?: string;
  initialLeaveStartsAt?: string;
  initialLeaveEndsAt?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (input: {
    reason: string;
    leaveStartsAt?: string;
    leaveEndsAt?: string;
  }) => Promise<void>;
};

const TITLES: Record<CollabHrMode, string> = {
  leave: 'Request leave',
  resign: 'Request resign',
};

const DESCRIPTIONS: Record<CollabHrMode, string> = {
  leave:
    'Temporary time away. You stay on the team after approval. This is not resignation.',
  resign:
    'Permanent exit. Notice (14 days) starts only after the institute accepts.',
};

const MODAL_MAX_HEIGHT = Dimensions.get('window').height * 0.86;

function todayIso(): string {
  return toIsoDate(new Date());
}

/**
 * Compact HR reason sheet for educator leave / resign.
 * Body may scroll; action buttons stay pinned and fully visible.
 */
export function CollabHrRequestModal({
  visible,
  mode,
  instituteName,
  isLeaveUpdate = false,
  initialReason = '',
  initialLeaveStartsAt,
  initialLeaveEndsAt,
  isSubmitting = false,
  onClose,
  onSubmit,
}: CollabHrRequestModalProps) {
  const theme = useTheme();
  const [reason, setReason] = useState('');
  const [leaveStartsAt, setLeaveStartsAt] = useState(todayIso());
  const [leaveEndsAt, setLeaveEndsAt] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const today = todayIso();
    setReason(initialReason || '');
    setLeaveStartsAt(
      initialLeaveStartsAt?.slice(0, 10) || today,
    );
    setLeaveEndsAt(initialLeaveEndsAt?.slice(0, 10) || today);
    setError(null);
  }, [
    visible,
    mode,
    initialReason,
    initialLeaveStartsAt,
    initialLeaveEndsAt,
  ]);

  const handleSubmit = async () => {
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      setError('Reason must be at least 10 characters.');
      return;
    }

    if (mode === 'leave') {
      if (!leaveStartsAt || !leaveEndsAt) {
        setError('Select leave start and end dates.');
        return;
      }
      if (leaveEndsAt < leaveStartsAt) {
        setError('End date must be on or after start date.');
        return;
      }
    }

    setError(null);
    await onSubmit({
      reason: trimmed,
      leaveStartsAt: mode === 'leave' ? leaveStartsAt : undefined,
      leaveEndsAt: mode === 'leave' ? leaveEndsAt : undefined,
    });
  };

  const isDanger = mode === 'resign';
  const accent = isDanger ? theme.colors.danger : theme.colors.primary;
  const minStart = parseIsoDate(todayIso());
  const minEnd = parseIsoDate(leaveStartsAt);

  const closeIfIdle = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={closeIfIdle}
      transparent
      visible={visible}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          onPress={closeIfIdle}
          style={StyleSheet.absoluteFill}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                maxHeight: MODAL_MAX_HEIGHT,
              },
            ]}>
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              style={styles.bodyScroll}
              contentContainerStyle={styles.bodyContent}>
              <AppText style={styles.title} variant="subtitle" weight="bold">
                {mode === 'leave' && isLeaveUpdate
                  ? 'Update leave request'
                  : TITLES[mode]}
              </AppText>
              <AppText
                color="secondary"
                style={[
                  styles.message,
                  !instituteName ? styles.messageSolo : null,
                ]}
                variant="caption">
                {mode === 'leave' && isLeaveUpdate
                  ? 'Change dates or reason. Institute will still need to review the pending request.'
                  : DESCRIPTIONS[mode]}
              </AppText>
              {instituteName ? (
                <AppText
                  color="muted"
                  style={styles.institute}
                  variant="caption"
                  weight="medium">
                  {instituteName}
                </AppText>
              ) : null}

              {mode === 'leave' ? (
                <View style={styles.dateBlock}>
                  <AppDateField
                    disabled={isSubmitting}
                    label="Starts"
                    minimumDate={minStart}
                    onChange={(next) => {
                      setLeaveStartsAt(next);
                      if (leaveEndsAt < next) {
                        setLeaveEndsAt(next);
                      }
                    }}
                    value={leaveStartsAt}
                  />
                  <AppText
                    color="muted"
                    style={styles.dateTo}
                    variant="caption"
                    weight="medium">
                    to
                  </AppText>
                  <AppDateField
                    disabled={isSubmitting}
                    label="Ends"
                    minimumDate={minEnd}
                    onChange={setLeaveEndsAt}
                    value={leaveEndsAt}
                  />
                </View>
              ) : null}

              <AuthField label="Reason">
                <TextInput
                  editable={!isSubmitting}
                  maxFontSizeMultiplier={1.3}
                  multiline
                  onChangeText={setReason}
                  placeholder="Explain briefly (min 10 characters)"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[
                    styles.input,
                    styles.reasonInput,
                    {
                      color: theme.colors.text,
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      fontFamily: resolveFontFamily('regular'),
                    },
                  ]}
                  textAlignVertical="top"
                  value={reason}
                />
              </AuthField>

              {error ? (
                <AppText color="danger" style={styles.error} variant="caption">
                  {error}
                </AppText>
              ) : null}
            </ScrollView>

            <View
              style={[
                styles.footer,
                { borderTopColor: theme.colors.border },
              ]}>
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.btn,
                    styles.cancelBtn,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                      opacity: pressed ? 0.88 : 1,
                    },
                  ]}>
                  <AppText variant="label" weight="semibold">
                    Cancel
                  </AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={() => {
                    void handleSubmit();
                  }}
                  style={({ pressed }) => [
                    styles.btn,
                    {
                      backgroundColor: accent,
                      opacity: isSubmitting ? 0.55 : pressed ? 0.9 : 1,
                    },
                  ]}>
                  <AppText color="inverse" variant="label" weight="semibold">
                    {isSubmitting
                      ? 'Please wait…'
                      : mode === 'leave'
                        ? isLeaveUpdate
                          ? 'Update leave'
                          : 'Submit leave'
                        : 'Submit resign'}
                  </AppText>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    justifyContent: 'center',
    paddingHorizontal: s(20),
  },
  sheetWrap: {
    width: '100%',
    maxHeight: MODAL_MAX_HEIGHT,
  },
  card: {
    width: '100%',
    borderRadius: ms(18),
    borderWidth: 1,
    overflow: 'hidden',
  },
  bodyScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  bodyContent: {
    paddingHorizontal: s(18),
    paddingTop: vs(18),
    paddingBottom: vs(8),
  },
  title: {
    textAlign: 'center',
    fontSize: fontSize(18),
    lineHeight: lineHeight(18, 1.3),
  },
  message: {
    marginTop: vs(8),
    textAlign: 'center',
    fontSize: fontSize(13),
    lineHeight: lineHeight(13, 1.4),
  },
  messageSolo: {
    marginBottom: vs(12),
  },
  institute: {
    marginTop: vs(6),
    marginBottom: vs(12),
    textAlign: 'center',
    fontSize: fontSize(12),
    lineHeight: lineHeight(12, 1.3),
  },
  dateBlock: {
    gap: vs(6),
    marginBottom: vs(12),
  },
  dateTo: {
    alignSelf: 'center',
    fontSize: fontSize(11),
    lineHeight: lineHeight(11, 1.2),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1,
    borderRadius: ms(10),
    paddingHorizontal: s(12),
    height: ms(42),
    fontSize: fontSize(14),
  },
  reasonInput: {
    height: vs(88),
    paddingTop: vs(10),
    paddingBottom: vs(10),
  },
  error: {
    marginTop: vs(8),
  },
  footer: {
    flexShrink: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: s(18),
    paddingTop: vs(12),
    paddingBottom: vs(14),
  },
  actions: {
    flexDirection: 'row',
    gap: s(10),
  },
  btn: {
    flex: 1,
    height: BUTTON_HEIGHT.md,
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
});
