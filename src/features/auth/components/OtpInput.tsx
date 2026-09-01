/**
 * 6-digit OTP input group with keyboard, paste, and focus UX.
 */

import { useEffect, useRef } from 'react';
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';

import { OTP_LENGTH } from '@/features/auth/types/otp';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';

export type OtpInputProps = {
  value: string;
  hasError?: boolean;
  disabled?: boolean;
  focusRequestId?: number;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
};

/**
 * Splits OTP into individual digit cells.
 */
export function OtpInput({
  value,
  hasError = false,
  disabled = false,
  focusRequestId = 0,
  onChange,
  onComplete,
}: OtpInputProps) {
  const theme = useTheme();
  const inputsRef = useRef<Array<TextInput | null>>([]);
  const digits = Array.from(
    { length: OTP_LENGTH },
    (_, index) => value[index] ?? '',
  );

  const focusInput = (index: number) => {
    inputsRef.current[index]?.focus();
  };

  useEffect(() => {
    if (focusRequestId <= 0 || disabled) {
      return;
    }
    focusInput(0);
  }, [focusRequestId, disabled]);

  const emitChange = (nextDigits: string[]) => {
    const nextValue = nextDigits.join('').slice(0, OTP_LENGTH);
    onChange(nextValue);

    if (nextValue.length === OTP_LENGTH) {
      onComplete?.(nextValue);
    }
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '');

    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, OTP_LENGTH);
      const nextDigits = Array.from(
        { length: OTP_LENGTH },
        (_, i) => pasted[i] ?? '',
      );
      emitChange(nextDigits);
      focusInput(Math.min(pasted.length, OTP_LENGTH - 1));
      return;
    }

    const digit = cleaned.slice(-1);
    const nextDigits = [...digits];

    if (!digit) {
      nextDigits[index] = '';
      emitChange(nextDigits);
      return;
    }

    nextDigits[index] = digit;
    emitChange(nextDigits);

    if (index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyPress = (
    index: number,
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (event.nativeEvent.key !== 'Backspace') {
      return;
    }

    const nextDigits = [...digits];

    if (nextDigits[index]) {
      nextDigits[index] = '';
      emitChange(nextDigits);
      return;
    }

    if (index > 0) {
      nextDigits[index - 1] = '';
      emitChange(nextDigits);
      focusInput(index - 1);
    }
  };

  return (
    <View accessibilityLabel="One-time password" style={styles.row}>
      {digits.map((digit, index) => {
        const filled = Boolean(digit);
        return (
          <TextInput
            key={`otp-${index}`}
            ref={(node) => {
              inputsRef.current[index] = node;
            }}
            accessibilityLabel={`Digit ${index + 1} of ${OTP_LENGTH}`}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            autoFocus={index === 0}
            editable={!disabled}
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={(text) => handleChange(index, text)}
            onKeyPress={(event) => handleKeyPress(index, event)}
            selectTextOnFocus
            style={[
              styles.cell,
              {
                color: theme.colors.text,
                borderColor: hasError
                  ? theme.colors.danger
                  : filled
                    ? theme.colors.primary
                    : theme.colors.border,
                backgroundColor: filled
                  ? theme.colors.primaryMuted
                  : theme.colors.surface,
                fontFamily: resolveFontFamily('semibold'),
              },
              disabled ? styles.cellDisabled : null,
            ]}
            textContentType={index === 0 ? 'oneTimeCode' : 'none'}
            value={digit}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: s(8),
  },
  cell: {
    flex: 1,
    height: ms(48),
    maxWidth: s(48),
    borderWidth: 1,
    borderRadius: ms(12),
    textAlign: 'center',
    fontSize: fontSize(18),
    lineHeight: lineHeight(18, 1.22),
    paddingVertical: 0,
  },
  cellDisabled: {
    opacity: 0.6,
  },
});
