/**
 * Club rooms — underline tabs, Instagram / LinkedIn density.
 */

import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  CLUB_ROOM_LABEL,
  type ClubRoomKey,
} from '@/features/community/lib/club-rooms';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type ClubRoomPillsProps = {
  rooms: ClubRoomKey[];
  active: ClubRoomKey;
  onChange: (room: ClubRoomKey) => void;
};

/**
 * Compact in-screen navigation — not a nested swipe pager.
 */
export function ClubRoomPills({ rooms, active, onChange }: ClubRoomPillsProps) {
  const theme = useTheme();

  return (
    <View style={[styles.wrap, { borderBottomColor: theme.colors.border }]}>
      <ScrollView
        contentContainerStyle={styles.row}
        horizontal
        showsHorizontalScrollIndicator={false}>
        {rooms.map((room) => {
          const on = room === active;
          return (
            <Pressable
              key={room}
              onPress={() => onChange(room)}
              style={styles.tab}>
              <AppText
                color={on ? 'primary' : 'muted'}
                variant="caption"
                weight="semibold">
                {CLUB_ROOM_LABEL[room]}
              </AppText>
              <View
                style={[
                  styles.underline,
                  { backgroundColor: on ? theme.colors.primary : 'transparent' },
                ]}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: vs(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    paddingHorizontal: s(16),
  },
  tab: {
    minHeight: ms(40),
    paddingHorizontal: s(12),
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: vs(8),
  },
  underline: {
    height: 2,
    width: '100%',
    borderRadius: 1,
  },
});
