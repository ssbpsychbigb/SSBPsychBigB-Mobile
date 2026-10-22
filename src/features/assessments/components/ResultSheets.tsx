/**
 * Bookmark folder picker and question challenge sheet.
 */

import { useEffect, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import {
  useBookmarkItemMutation,
  useChallengeItemMutation,
  useUnbookmarkItemMutation,
} from '@/features/assessments/hooks/useAssessmentQueries';
import {
  BOOKMARK_FOLDERS,
  CHALLENGE_REASONS,
} from '@/features/assessments/lib/result-actions';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { useScreenBottomPadding } from '@/shared/lib/safe-area';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

type SheetFrameProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

function SheetFrame({ visible, title, onClose, children }: SheetFrameProps) {
  const theme = useTheme();
  const bottom = useScreenBottomPadding(vs(16));

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.avoid}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.background,
                paddingBottom: bottom,
              },
            ]}>
            <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
            <AppText variant="subtitle" weight="bold">
              {title}
            </AppText>
            {children}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

export function BookmarkSheet({
  visible,
  attemptId,
  itemId,
  folder,
  onClose,
}: {
  visible: boolean;
  attemptId: string;
  itemId: string;
  folder?: string | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const save = useBookmarkItemMutation(attemptId);
  const remove = useUnbookmarkItemMutation(attemptId);
  const busy = save.isPending || remove.isPending;

  const pick = (next: string) => {
    save.mutate(
      { itemId, folder: next },
      {
        onSuccess: () => {
          showToast.success('Saved', next);
          onClose();
        },
        onError: (error) => showErrorToast(error, 'Could not save'),
      },
    );
  };

  return (
    <SheetFrame onClose={onClose} title="Save question" visible={visible}>
      <View style={styles.choices}>
        {BOOKMARK_FOLDERS.map((name) => {
          const on = folder === name;
          return (
            <Pressable
              key={name}
              disabled={busy}
              onPress={() => pick(name)}
              style={[
                styles.choice,
                {
                  backgroundColor: on ? theme.colors.primary : theme.colors.surface,
                  borderColor: on ? theme.colors.primary : theme.colors.border,
                },
              ]}>
              <AppText color={on ? 'inverse' : 'primary'} variant="label" weight="semibold">
                {name}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {folder ? (
        <Button
          fullWidth
          loading={remove.isPending}
          onPress={() =>
            remove.mutate(itemId, {
              onSuccess: () => {
                showToast.success('Removed from bookmarks');
                onClose();
              },
              onError: (error) => showErrorToast(error, 'Could not remove'),
            })
          }
          variant="secondary">
          Remove bookmark
        </Button>
      ) : null}
    </SheetFrame>
  );
}

export function ChallengeSheet({
  visible,
  attemptId,
  itemId,
  onClose,
}: {
  visible: boolean;
  attemptId: string;
  itemId: string;
  onClose: () => void;
}) {
  const theme = useTheme();
  const challenge = useChallengeItemMutation(attemptId);
  const [reason, setReason] = useState<string>(CHALLENGE_REASONS[0].id);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!visible) return;
    setReason(CHALLENGE_REASONS[0].id);
    setNote('');
  }, [visible, itemId]);

  return (
    <SheetFrame onClose={onClose} title="Challenge this question" visible={visible}>
      <AppText color="secondary" variant="caption">
        A reviewer checks the key. This does not change your score.
      </AppText>
      <View style={styles.choices}>
        {CHALLENGE_REASONS.map((item) => {
          const on = reason === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setReason(item.id)}
              style={[
                styles.choice,
                {
                  backgroundColor: on ? theme.colors.primary : theme.colors.surface,
                  borderColor: on ? theme.colors.primary : theme.colors.border,
                },
              ]}>
              <AppText color={on ? 'inverse' : 'primary'} variant="caption" weight="semibold">
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        multiline
        onChangeText={setNote}
        placeholder="Optional note"
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.note,
          {
            color: theme.colors.text,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            fontFamily: resolveFontFamily('regular'),
          },
        ]}
        textAlignVertical="top"
        value={note}
      />
      <Button
        fullWidth
        loading={challenge.isPending}
        onPress={() =>
          challenge.mutate(
            { itemId, reason, note: note.trim() || undefined },
            {
              onSuccess: () => {
                showToast.success('Sent for review');
                onClose();
              },
              onError: (error) => showErrorToast(error, 'Could not send'),
            },
          )
        }>
        Send
      </Button>
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(13, 30, 52, 0.45)',
  },
  avoid: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  sheet: {
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    paddingHorizontal: s(20),
    paddingTop: vs(8),
    gap: vs(14),
  },
  handle: {
    alignSelf: 'center',
    width: s(36),
    height: vs(4),
    borderRadius: ms(99),
  },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
  },
  choice: {
    minHeight: ms(40),
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    borderRadius: ms(20),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    minHeight: vs(88),
    borderWidth: 1,
    borderRadius: ms(14),
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
    fontSize: 15,
  },
});
