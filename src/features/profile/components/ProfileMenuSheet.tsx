/**
 * Own-profile ⋯ sheet — Saved and the rest of the account live here,
 * so the You tab stays a photo, counts, and a grid.
 */

import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Award,
  Bookmark,
  Briefcase,
  Heart,
  LogOut,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react-native';

import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type ProfileMenuKey =
  | 'saved'
  | 'wishlist'
  | 'certificates'
  | 'network'
  | 'account'
  | 'workspace'
  | 'freelancer'
  | 'logout';

export type ProfileMenuSheetProps = {
  visible: boolean;
  showWorkspace?: boolean;
  showFreelancer?: boolean;
  freelancerBusy?: boolean;
  onClose: () => void;
  onSelect: (key: ProfileMenuKey) => void;
};

type MenuRow = {
  key: ProfileMenuKey;
  label: string;
  Icon: LucideIcon;
  danger?: boolean;
};

/**
 * Bottom sheet for the You tab. Sign out sits last, in red.
 */
export function ProfileMenuSheet({
  visible,
  showWorkspace = false,
  showFreelancer = false,
  freelancerBusy = false,
  onClose,
  onSelect,
}: ProfileMenuSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const rows: MenuRow[] = [
    { key: 'saved', label: 'Saved', Icon: Bookmark },
    { key: 'wishlist', label: 'Wishlist', Icon: Heart },
    { key: 'certificates', label: 'Certificates', Icon: Award },
    { key: 'network', label: 'Network', Icon: Users },
    { key: 'account', label: 'Account', Icon: UserRound },
    ...(showWorkspace
      ? [{ key: 'workspace' as const, label: 'Workspace', Icon: Briefcase }]
      : []),
    ...(showFreelancer
      ? [{ key: 'freelancer' as const, label: 'Switch to Freelancer', Icon: UserRound }]
      : []),
    { key: 'logout', label: 'Sign out', Icon: LogOut, danger: true },
  ];

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.modal}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.background,
              paddingBottom: insets.bottom + vs(8),
            },
          ]}>
          <View style={[styles.grabber, { backgroundColor: theme.colors.border }]} />
          {rows.map((row, index) => {
            const color = row.danger ? theme.colors.danger : theme.colors.text;
            const divided = row.danger && index > 0;
            const busy = row.key === 'freelancer' && freelancerBusy;
            return (
              <View key={row.key}>
                {divided ? (
                  <View style={[styles.hairline, { backgroundColor: theme.colors.border }]} />
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => onSelect(row.key)}
                  style={({ pressed }) => [
                    styles.row,
                    pressed ? { backgroundColor: theme.colors.surface } : null,
                  ]}>
                  <row.Icon color={color} size={ms(20)} strokeWidth={2} />
                  <AppText
                    style={{ color, flex: 1 }}
                    variant="body"
                    weight="semibold">
                    {busy ? 'Switching…' : row.label}
                  </AppText>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(13,30,52,0.45)',
  },
  sheet: {
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    paddingTop: vs(8),
  },
  grabber: {
    alignSelf: 'center',
    width: ms(36),
    height: vs(4),
    borderRadius: ms(2),
    marginBottom: vs(6),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(14),
    paddingHorizontal: s(20),
    paddingVertical: vs(13),
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: s(20),
    marginTop: vs(4),
    marginBottom: vs(4),
  },
});
