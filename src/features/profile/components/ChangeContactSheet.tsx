/**
 * Change the login email or mobile. The code is emailed. Nothing changes until the code matches.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, KeyboardSheet } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

type Kind = 'email' | 'mobile';

export function ChangeContactSheet({
  kind,
  visible,
  onClose,
}: {
  kind: Kind;
  visible: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const token = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);
  const [value, setValue] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [busy, setBusy] = useState(false);
  const email = kind === 'email';

  const reset = () => {
    setValue('');
    setCode('');
    setSentTo('');
    setBusy(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const send = async () => {
    if (!token || busy) {
      return;
    }
    setBusy(true);
    try {
      const result = email
        ? await authApi.requestEmailChange(token, value.trim())
        : await authApi.requestMobileChange(token, value.trim());
      setSentTo(result.maskedEmail);
      if (result.debugOtp) {
        setCode(result.debugOtp);
      }
      showToast.success('Code sent', `Check ${result.maskedEmail}`);
    } catch (error) {
      showErrorToast(error, 'Could not send the code.', 'Account');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!token || busy) {
      return;
    }
    setBusy(true);
    try {
      const result = email
        ? await authApi.confirmEmailChange(token, value.trim(), code.trim())
        : await authApi.confirmMobileChange(token, value.trim(), code.trim());
      setUser(result.user);
      showToast.success(email ? 'Email updated' : 'Mobile updated');
      close();
    } catch (error) {
      showErrorToast(error, 'Could not confirm that code.', 'Account');
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      color: theme.colors.text,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      fontFamily: resolveFontFamily('regular'),
    },
  ];

  return (
    <KeyboardSheet onRequestClose={close} visible={visible}>
      <View style={styles.body}>
        <View style={styles.head}>
          <AppText variant="subtitle" weight="bold">
            {email ? 'Change email' : 'Change mobile'}
          </AppText>
          <Pressable onPress={close}>
            <AppText color="muted" variant="label" weight="semibold">
              Close
            </AppText>
          </Pressable>
        </View>
        <AppText color="secondary" variant="caption">
          {email
            ? 'We email a 6-digit code to the new address. It becomes your email only after you enter the code.'
            : 'We email a 6-digit code to your current email. Your login mobile changes only after the code matches.'}
        </AppText>
        <TextInput
          autoCapitalize="none"
          editable={!sentTo && !busy}
          keyboardType={email ? 'email-address' : 'phone-pad'}
          onChangeText={setValue}
          placeholder={email ? 'new@email.com' : '10-digit mobile'}
          placeholderTextColor={theme.colors.textMuted}
          style={inputStyle}
          value={value}
        />
        {sentTo ? (
          <>
            <AppText color="muted" variant="caption">
              Code sent to {sentTo}
            </AppText>
            <TextInput
              keyboardType="number-pad"
              maxLength={6}
              onChangeText={setCode}
              placeholder="6-digit code"
              placeholderTextColor={theme.colors.textMuted}
              style={inputStyle}
              value={code}
            />
            <Button fullWidth loading={busy} onPress={() => void confirm()}>
              Confirm
            </Button>
          </>
        ) : (
          <Button fullWidth loading={busy} onPress={() => void send()}>
            Send code
          </Button>
        )}
      </View>
    </KeyboardSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: s(20),
    paddingBottom: vs(16),
    gap: vs(12),
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(12),
    minHeight: ms(48),
    paddingHorizontal: s(14),
    fontSize: ms(16),
  },
});
