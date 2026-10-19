/**
 * Appoint or edit the single Co-Admin seat — same rights as web.
 */

import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Check, Shield } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CO_ADMIN_RIGHT_COPY,
  CO_ADMIN_RIGHT_KEYS,
  emptyCoAdminRights,
  isCoAdminSeat,
  type CoAdminRights,
} from '@/features/community/lib/community-rights';
import type { CommunityMember } from '@/features/community/types/community.types';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button } from '@/shared/ui';

export type ClubCoAdminSheetProps = {
  member: CommunityMember | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (rights: CoAdminRights) => void;
};

/**
 * Bottom sheet of optional Co-Admin checkboxes.
 */
export function ClubCoAdminSheet({
  member,
  isSaving,
  onClose,
  onSave,
}: ClubCoAdminSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [rights, setRights] = useState<CoAdminRights>(emptyCoAdminRights());
  const open = Boolean(member);
  const isEdit = isCoAdminSeat(member?.role);
  const name = member?.user.fullName || member?.user.username || 'Member';

  useEffect(() => {
    if (open) {
      setRights(emptyCoAdminRights(member?.rights));
    }
  }, [open, member]);

  return (
    <Modal
      animationType="slide"
      navigationBarTranslucent
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={open}>
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.backdrop}>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                paddingBottom: Math.max(insets.bottom, vs(16)),
              },
            ]}>
            <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
            <View style={styles.header}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: theme.colors.primaryMuted },
                ]}>
                <Shield color={theme.colors.primary} size={ms(18)} strokeWidth={2.2} />
              </View>
              <View style={styles.titles}>
                <AppText variant="subtitle" weight="bold">
                  {isEdit ? 'Edit Co-Admin rights' : 'Appoint Co-Admin'}
                </AppText>
                <AppText color="muted" variant="caption">
                  {name} becomes the second key for archive and delete. Rights
                  below are optional.
                </AppText>
              </View>
            </View>

            <ScrollView
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}>
              {CO_ADMIN_RIGHT_KEYS.map((key) => {
                const copy = CO_ADMIN_RIGHT_COPY[key];
                const checked = rights[key];
                return (
                  <Pressable
                    key={key}
                    onPress={() =>
                      setRights((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                    style={[
                      styles.rightRow,
                      {
                        borderColor: checked
                          ? theme.colors.primary
                          : theme.colors.border,
                        backgroundColor: checked
                          ? theme.colors.primaryMuted
                          : theme.colors.surface,
                      },
                    ]}>
                    <View
                      style={[
                        styles.check,
                        {
                          borderColor: checked
                            ? theme.colors.primary
                            : theme.colors.border,
                          backgroundColor: checked
                            ? theme.colors.primary
                            : theme.colors.background,
                        },
                      ]}>
                      {checked ? (
                        <Check color="#FFFFFF" size={ms(12)} strokeWidth={3} />
                      ) : null}
                    </View>
                    <View style={styles.titles}>
                      <AppText variant="label" weight="semibold">
                        {copy.label}
                      </AppText>
                      <AppText color="muted" variant="caption">
                        {copy.hint}
                      </AppText>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.actions}>
              <Button onPress={onClose} style={styles.flex} variant="secondary">
                Cancel
              </Button>
              <Button
                disabled={isSaving || !member}
                loading={isSaving}
                onPress={() => onSave(rights)}
                style={styles.flex}>
                {isEdit ? 'Save rights' : 'Appoint'}
              </Button>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    borderWidth: 1,
    paddingHorizontal: s(16),
    paddingTop: vs(8),
  },
  handle: {
    alignSelf: 'center',
    width: s(40),
    height: vs(4),
    borderRadius: ms(2),
    marginBottom: vs(12),
  },
  header: {
    flexDirection: 'row',
    gap: s(12),
    marginBottom: vs(12),
  },
  iconWrap: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: {
    flex: 1,
    gap: vs(2),
  },
  list: {
    gap: vs(8),
    paddingBottom: vs(12),
  },
  rightRow: {
    flexDirection: 'row',
    gap: s(12),
    borderWidth: 1,
    borderRadius: ms(16),
    padding: s(12),
    alignItems: 'flex-start',
  },
  check: {
    width: ms(22),
    height: ms(22),
    borderRadius: ms(7),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(2),
  },
  actions: {
    flexDirection: 'row',
    gap: s(10),
    paddingTop: vs(8),
  },
  flex: {
    flex: 1,
  },
});
