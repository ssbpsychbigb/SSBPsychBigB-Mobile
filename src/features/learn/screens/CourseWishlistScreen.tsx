/**
 * Saved courses — header destination, not a Learn tab.
 */

import { Heart } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/app/navigation/types';
import { GuestUnlockPanel } from '@/features/auth/components/GuestUnlockPanel';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { CourseSavedCard } from '@/features/learn/components/CourseSavedCard';
import { LearnEmptyState } from '@/features/learn/components/LearnEmptyState';
import { useWishlistQuery } from '@/features/learn/hooks/useCourseEngagementQueries';
import { ms } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { SocialStackChrome, Spinner, usePullToRefresh } from '@/shared/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'CourseWishlist'>;

/**
 * Wishlist list. Background matches the rest of the app — no cream panel.
 */
export function CourseWishlistScreen({ navigation }: Props) {
  const theme = useTheme();
  const token = useAuthStore((state) => state.accessToken);
  const saved = useWishlistQuery(Boolean(token));
  const items = saved.data?.items ?? [];

  const refreshControl = usePullToRefresh(() => saved.refetch());

  return (
    <SocialStackChrome
      refreshControl={refreshControl}
      subtitle="Saved for later. Same list on web."
      title="Wishlist">
      {!token ? (
        <GuestUnlockPanel
          description="Heart a course on the product page and it lands here."
          embedded
          icon={<Heart color={theme.colors.primary} size={ms(32)} />}
          title="Sign in to save"
        />
      ) : saved.isLoading && !saved.data ? (
        <Spinner />
      ) : items.length === 0 ? (
        <LearnEmptyState
          actionLabel="Explore courses"
          description="Open a course and tap the heart. No extra tab — just your saved list."
          icon={<Heart color={theme.colors.textMuted} size={ms(28)} />}
          onAction={() => navigation.navigate('App', { screen: 'myCourse' })}
          title="Nothing saved"
        />
      ) : (
        items.map((item) => (
          <CourseSavedCard
            key={item.course.id}
            course={{ ...item.course, wishlisted: true }}
            onPress={() =>
              navigation.navigate('CourseDetail', { slug: item.course.slug })
            }
          />
        ))
      )}
    </SocialStackChrome>
  );
}
