/**
 * Public certificate verify — in-app, no browser.
 */

import { StyleSheet, View } from 'react-native';
import { Award, BadgeCheck, BadgeX } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/app/navigation/types';
import { useVerifyCertificateQuery } from '@/features/learn/hooks/useCourseCertQueries';
import { ms, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, SocialStackChrome, Spinner } from '@/shared/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'CertificateVerify'>;

/**
 * Anyone with the code can confirm a BIGB certificate.
 */
export function CertificateVerifyScreen({ route }: Props) {
  const theme = useTheme();
  const code = String(route.params.code || '').trim().toUpperCase();
  const query = useVerifyCertificateQuery(code);
  const data = query.data;
  const valid = Boolean(data?.valid);

  return (
    <SocialStackChrome
      subtitle={code || 'Public record'}
      title="Verify certificate">
      {query.isLoading ? (
        <Spinner />
      ) : (
        <View style={styles.block}>
          <View
            style={[
              styles.seal,
              {
                backgroundColor: valid
                  ? theme.colors.primaryMuted
                  : theme.colors.surface,
              },
            ]}>
            {valid ? (
              <BadgeCheck color={theme.colors.success} size={ms(40)} />
            ) : (
              <BadgeX color={theme.colors.danger} size={ms(40)} />
            )}
          </View>
          <AppText style={styles.center} variant="subtitle" weight="bold">
            {valid ? 'Valid certificate' : 'Not found'}
          </AppText>
          {valid ? (
            <>
              <AppText color="secondary" style={styles.center} variant="body">
                {data?.learnerName}
              </AppText>
              <AppText style={styles.center} variant="label" weight="semibold">
                {data?.courseTitle}
              </AppText>
              <AppText color="muted" style={styles.center} variant="caption">
                {data?.certificateCode}
                {data?.issuedAt
                  ? ` · ${new Date(data.issuedAt).toLocaleDateString('en-IN')}`
                  : ''}
              </AppText>
            </>
          ) : (
            <AppText color="secondary" style={styles.center} variant="caption">
              This code is not on BIGB records. Check the letters and try again.
            </AppText>
          )}
          <Award color={theme.colors.textMuted} size={ms(18)} />
        </View>
      )}
    </SocialStackChrome>
  );
}

const styles = StyleSheet.create({
  block: {
    alignItems: 'center',
    paddingTop: vs(36),
    gap: vs(10),
  },
  seal: {
    width: ms(88),
    height: ms(88),
    borderRadius: ms(44),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(8),
  },
  center: {
    textAlign: 'center',
  },
});
