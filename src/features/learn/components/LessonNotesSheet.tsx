/**
 * Timestamped private notes — stay in the player, same API as web.
 */

import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StickyNote, Trash2, X } from 'lucide-react-native';

import {
  useCreateLessonNoteMutation,
  useDeleteLessonNoteMutation,
  useLessonNotesQuery,
} from '@/features/learn/hooks/useCourseEngagementQueries';
import {
  formatLessonClock,
  formatRelativeTime,
} from '@/features/learn/lib/format-course';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, ConfirmModal, Spinner } from '@/shared/ui';
import { showErrorToast } from '@/shared/ui/toast';

export type LessonNotesSheetProps = {
  visible: boolean;
  lessonId: string;
  timestampSec: number;
  onClose: () => void;
};

/**
 * Bottom sheet note pad. Optional timestamp from the playhead.
 */
export function LessonNotesSheet({
  visible,
  lessonId,
  timestampSec,
  onClose,
}: LessonNotesSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const notesQuery = useLessonNotesQuery(lessonId, visible);
  const createNote = useCreateLessonNoteMutation(lessonId);
  const deleteNote = useDeleteLessonNoteMutation(lessonId);
  const [draft, setDraft] = useState('');
  const [stamp, setStamp] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const items = notesQuery.data?.items ?? [];

  const save = () => {
    const body = draft.trim();
    if (!body) {
      return;
    }
    createNote.mutate(
      {
        body,
        timestampSec: stamp ? Math.floor(timestampSec) : 0,
      },
      {
        onSuccess: () => setDraft(''),
        onError: (error) => showErrorToast(error, 'Could not save note'),
      },
    );
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <Pressable onPress={onClose} style={styles.backdrop}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.background,
                paddingBottom: Math.max(insets.bottom, vs(16)),
              },
            ]}>
            <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
            <View style={styles.head}>
              <View style={styles.headCopy}>
                <StickyNote color={theme.colors.primary} size={ms(18)} />
                <AppText variant="subtitle" weight="bold">
                  Notes
                </AppText>
              </View>
              <Pressable accessibilityLabel="Close notes" onPress={onClose}>
                <X color={theme.colors.text} size={ms(20)} />
              </Pressable>
            </View>
            <AppText color="muted" variant="caption">
              Private to you. Same notes on web.
            </AppText>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.list}>
              {notesQuery.isLoading && !notesQuery.data ? <Spinner /> : null}
              {!notesQuery.isLoading && items.length === 0 ? (
                <AppText color="muted" variant="caption">
                  No notes on this lesson yet.
                </AppText>
              ) : null}
              {items.map((note) => (
                <View
                  key={note.id}
                  style={[
                    styles.note,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}>
                  <View style={styles.noteTop}>
                    <AppText color="brand" variant="caption" weight="semibold">
                      {note.timestampSec
                        ? formatLessonClock(note.timestampSec)
                        : 'Lesson'}
                    </AppText>
                    <Pressable
                      accessibilityLabel="Delete note"
                      onPress={() => setPendingDelete(note.id)}>
                      <Trash2 color={theme.colors.textMuted} size={ms(15)} />
                    </Pressable>
                  </View>
                  <AppText variant="body">{note.body}</AppText>
                  <AppText color="muted" variant="caption">
                    {formatRelativeTime(note.createdAt)}
                  </AppText>
                </View>
              ))}
            </ScrollView>

            <Pressable
              onPress={() => setStamp((value) => !value)}
              style={styles.stamp}>
              <AppText color={stamp ? 'brand' : 'muted'} variant="caption" weight="semibold">
                {stamp && timestampSec > 0
                  ? `Save at ${formatLessonClock(Math.floor(timestampSec))}`
                  : 'No timestamp'}
              </AppText>
            </Pressable>
            <TextInput
              multiline
              onChangeText={setDraft}
              placeholder="Capture a point from this lecture…"
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  fontFamily: resolveFontFamily('regular'),
                },
              ]}
              value={draft}
            />
            <Button
              disabled={!draft.trim()}
              loading={createNote.isPending}
              onPress={save}>
              Save note
            </Button>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
      <ConfirmModal
        Icon={Trash2}
        confirmLabel="Delete"
        isLoading={deleteNote.isPending}
        message="This note is removed from phone and web."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) {
            return;
          }
          deleteNote.mutate(pendingDelete, {
            onError: (error) => showErrorToast(error, 'Could not delete'),
            onSettled: () => setPendingDelete(null),
          });
        }}
        title="Delete note?"
        tone="danger"
        visible={Boolean(pendingDelete)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(11,13,18,0.48)',
  },
  sheet: {
    maxHeight: '86%',
    borderTopLeftRadius: ms(22),
    borderTopRightRadius: ms(22),
    paddingHorizontal: s(16),
    paddingTop: vs(8),
    gap: vs(10),
  },
  handle: {
    alignSelf: 'center',
    width: s(36),
    height: vs(4),
    borderRadius: ms(2),
    marginBottom: vs(6),
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  list: {
    maxHeight: vs(280),
  },
  note: {
    borderWidth: 1,
    borderRadius: ms(14),
    padding: s(12),
    gap: vs(6),
    marginBottom: vs(8),
  },
  noteTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stamp: {
    alignSelf: 'flex-start',
  },
  input: {
    minHeight: vs(84),
    borderWidth: 1,
    borderRadius: ms(14),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    fontSize: 15,
    textAlignVertical: 'top',
  },
});
