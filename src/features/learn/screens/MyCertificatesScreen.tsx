/**
 * Issued certificates for this account.
 */

import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Award } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/app/navigation/types';
import { GuestUnlockPanel } from '@/features/auth/components/GuestUnlockPanel';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { LearnEmptyState } from '@/features/learn/components/LearnEmptyState';
import { useMyCertificatesQuery } from '@/features/learn/hooks/useCourseCertQueries';
import { formatRelativeTime } from '@/features/learn/lib/format-course';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, SocialStackChrome, Spinner } from '@/shared/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'MyCertificates'>;

/**
 * My certificates. Tap opens the public verify screen.
 */
export function MyCertificatesScreen({ navigation }: Props) {
  const theme = useTheme();
  const token = useAuthStore((state) => state.accessToken);
  const mine = useMyCertificatesQuery(Boolean(token));
  const items = mine.data?.items ?? [];

  return (
    <SocialStackChrome
      refreshControl={
        <RefreshControl
          onRefresh={() => void mine.refetch()}
          refreshing={Boolean(mine.isRefetching)}
          tintColor={theme.colors.primary}
        />
      }
      subtitle="Share the verify link with anyone."
      title="Certificates">
      {!token ? (
        <GuestUnlockPanel
          description="Finish a course to issue a certificate on this account."
          embedded
          icon={<Award color={theme.colors.primary} size={ms(32)} />}
          title="Sign in for certificates"
        />
      ) : mine.isLoading && !mine.data ? (
        <Spinner />
      ) : items.length === 0 ? (
        <LearnEmptyState
          description="Claim from a finished course. Eligibility uses the same rules as web."
          icon={<Award color={theme.colors.textMuted} size={ms(28)} />}
          title="No certificates yet"
        />
      ) : (
        items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() =>
              navigation.navigate('CertificateVerify', {
                code: item.certificateCode,
              })
            }
            style={[styles.row, { borderColor: theme.colors.border }]}>
            <Award color={theme.colors.primary} size={ms(20)} />
            <View style={styles.copy}>
              <AppText numberOfLines={2} variant="label" weight="semibold">
                {item.courseTitle}
              </AppText>
              <AppText color="muted" variant="caption">
                {item.certificateCode}
                {item.issuedAt ? ` · ${formatRelativeTime(item.issuedAt)}` : ''}
              </AppText>
            </View>
          </Pressable>
        ))
      )}
    </SocialStackChrome>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: vs(14),
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: vs(2),
  },
});
