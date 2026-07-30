/**
 * Themed date field — opens branded Material calendar (community DateTimePicker).
 */

import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';

import { colors } from '@/shared/constants/colors';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui/Text';

export type AppDateFieldProps = {
  label: string;
  value: string;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  onChange: (isoDate: string) => void;
};

/**
 * Parses YYYY-MM-DD as a local calendar date (avoids UTC shift).
 */
export function parseIsoDate(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) {
    return new Date();
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(year, month - 1, day);
}

/**
 * Formats a Date as YYYY-MM-DD in local time.
 */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/**
 * Single-line human label for leave fields (e.g. 31 Jul 2026).
 * Avoids locale hyphen formats that wrap awkwardly in narrow cells.
 */
export function formatDisplayDate(iso: string): string {
  const date = parseIsoDate(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTHS_SHORT[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Compact branded date trigger that opens the platform calendar.
 */
export function AppDateField({
  label,
  value,
  minimumDate,
  maximumDate,
  disabled = false,
  onChange,
}: AppDateFieldProps) {
  const theme = useTheme();
  const [iosOpen, setIosOpen] = useState(false);
  const selected = parseIsoDate(value);
  const brandPrimary = theme.colors.primary || colors.primary.DEFAULT;

  const applyDate = (next: Date) => {
    onChange(toIsoDate(next));
  };

  const openPicker = () => {
    if (disabled) {
      return;
    }

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: selected,
        mode: 'date',
        // * Material 3 calendar — colors come from android AppTheme / materialCalendarTheme.
        design: 'material',
        title: label,
        minimumDate,
        maximumDate,
        positiveButton: {
          label: 'OK',
          textColor: brandPrimary,
        },
        negativeButton: {
          label: 'Cancel',
          textColor: theme.colors.textSecondary,
        },
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'dismissed' || !date) {
            return;
          }
          applyDate(date);
        },
      });
      return;
    }

    setIosOpen((open) => !open);
  };

  const onIosChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed') {
      setIosOpen(false);
      return;
    }
    if (date) {
      applyDate(date);
    }
  };

  return (
    <View style={styles.wrap}>
      <AppText
        color="secondary"
        style={styles.label}
        variant="caption"
        weight="medium">
        {label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={openPicker}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: theme.colors.surface,
            borderColor: iosOpen ? brandPrimary : theme.colors.border,
            opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
          },
        ]}>
        <View
          style={[
            styles.iconChip,
            { backgroundColor: `${brandPrimary}14` },
          ]}>
          <CalendarDays color={brandPrimary} size={ms(15)} strokeWidth={2.2} />
        </View>
        <AppText
          numberOfLines={1}
          style={styles.value}
          variant="label"
          weight="medium">
          {formatDisplayDate(value)}
        </AppText>
      </Pressable>

      {Platform.OS === 'ios' && iosOpen ? (
        <View
          style={[
            styles.iosSheet,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}>
          <DateTimePicker
            accentColor={brandPrimary}
            display="inline"
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            mode="date"
            onChange={onIosChange}
            themeVariant={theme.mode === 'dark' ? 'dark' : 'light'}
            value={selected}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setIosOpen(false)}
            style={[styles.doneBtn, { backgroundColor: brandPrimary }]}>
            <AppText color="inverse" variant="label">
              Done
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: ms(6),
    minWidth: 0,
  },
  label: {
    marginLeft: s(2),
    fontSize: fontSize(12),
    lineHeight: lineHeight(12, 1.25),
    letterSpacing: 0.2,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(10),
    paddingVertical: vs(8),
    minHeight: ms(48),
    minWidth: 0,
  },
  iconChip: {
    width: ms(30),
    height: ms(30),
    borderRadius: ms(8),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  value: {
    flex: 1,
    minWidth: 0,
    fontSize: fontSize(14),
    lineHeight: lineHeight(14, 1.25),
  },
  iosSheet: {
    marginTop: vs(8),
    borderWidth: 1,
    borderRadius: ms(14),
    overflow: 'hidden',
    paddingBottom: vs(10),
  },
  doneBtn: {
    alignSelf: 'center',
    marginTop: vs(4),
    paddingHorizontal: s(20),
    height: ms(36),
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
