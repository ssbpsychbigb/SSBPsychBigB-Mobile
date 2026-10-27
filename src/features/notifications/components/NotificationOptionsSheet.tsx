/**
 * Bottom sheet for a single notification — mark read / remove.
 */

import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCheck, Trash2, type LucideIcon } from 'lucide-react-native';

import { NotificationAvatar } from '@/features/notifications/components/NotificationRow';
import type { AppNotification } from '@/features/notifications/types/notification.types';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type NotificationOptionsSheetProps = {
  item: AppNotification | null;
  onClose: () => void;
  onMarkRead: (item: AppNotification) => void;
  onRemove: (item: AppNotification) => void;
};

export function NotificationOptionsSheet({
  item,
  onClose,
  onMarkRead,
  onRemove,
}: NotificationOptionsSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const actor = item?.actors[0];
  const sentence = Boolean(actor && actor.kind !== 'system' && item && /^[a-z]/.test(item.headline));

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={Boolean(item)}>
      <Pressable onPress={onClose} style={styles.backdrop} />
      {item ? (
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.background,
              paddingBottom: insets.bottom + vs(12),
            },
          ]}>
          <View style={[styles.grabber, { backgroundColor: theme.colors.border }]} />

          <View style={styles.preview}>
            <NotificationAvatar item={item} size={ms(40)} />
            <AppText numberOfLines={2} style={[styles.previewText, { color: theme.colors.text }]}>
              {sentence ? (
                <>
                  <AppText style={styles.previewName} weight="bold">
                    {actor?.name}
                  </AppText>{' '}
                  {item.headline}
                </>
              ) : (
                item.headline
              )}
            </AppText>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          {item.unread ? (
            <OptionRow
              Icon={CheckCheck}
              label="Mark as read"
              onPress={() => onMarkRead(item)}
              subtitle="Clear the unread highlight"
            />
          ) : null}
          <OptionRow
            Icon={Trash2}
            danger
            label="Remove notification"
            onPress={() => onRemove(item)}
            subtitle="Delete it from your notifications"
          />

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancel,
              { backgroundColor: pressed ? theme.colors.border : theme.colors.surface },
            ]}>
            <AppText style={styles.cancelLabel} weight="semibold">
              Cancel
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </Modal>
  );
}

function OptionRow({
  Icon,
  label,
  subtitle,
  danger,
  onPress,
}: {
  Icon: LucideIcon;
  label: string;
  subtitle: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const tone = danger ? theme.colors.danger : theme.colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        pressed ? { backgroundColor: theme.colors.surface } : null,
      ]}>
      <View
        style={[
          styles.optionIcon,
          { backgroundColor: danger ? `${theme.colors.danger}14` : theme.colors.surface },
        ]}>
        <Icon color={tone} size={ms(19)} strokeWidth={2.1} />
      </View>
      <View style={styles.optionText}>
        <AppText style={[styles.optionLabel, { color: tone }]} weight="semibold">
          {label}
        </AppText>
        <AppText color="muted" style={styles.optionSub}>
          {subtitle}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(13,30,52,0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    paddingHorizontal: s(16),
    paddingTop: vs(8),
  },
  grabber: {
    alignSelf: 'center',
    width: ms(40),
    height: ms(4),
    borderRadius: ms(2),
    marginBottom: vs(14),
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    paddingHorizontal: s(4),
  },
  previewText: {
    flex: 1,
    fontSize: fontSize(14),
    lineHeight: lineHeight(14, 1.4),
  },
  previewName: {
    fontSize: fontSize(14),
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: vs(12),
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(14),
    paddingHorizontal: s(4),
    paddingVertical: vs(10),
    borderRadius: ms(14),
  },
  optionIcon: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    gap: vs(1),
  },
  optionLabel: {
    fontSize: fontSize(15),
  },
  optionSub: {
    fontSize: fontSize(12.5),
  },
  cancel: {
    marginTop: vs(12),
    height: ms(48),
    borderRadius: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontSize: fontSize(15),
  },
});
