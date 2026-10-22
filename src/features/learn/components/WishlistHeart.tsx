/**
 * Save / unsave a course. Same account as web wishlist.
 */

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Heart } from 'lucide-react-native';

import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useToggleWishlistMutation } from '@/features/learn/hooks/useCourseEngagementQueries';
import { ms } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { showErrorToast, showToast } from '@/shared/ui/toast';

export type WishlistHeartProps = {
  slug: string;
  wishlisted?: boolean;
  size?: number;
  light?: boolean;
};

/**
 * Heart on cards and course detail. Guest tap opens join sheet.
 */
export function WishlistHeart({
  slug,
  wishlisted = false,
  size = 18,
  light = false,
}: WishlistHeartProps) {
  const theme = useTheme();
  const token = useAuthStore((state) => state.accessToken);
  const toggle = useToggleWishlistMutation(slug);
  const [joinOpen, setJoinOpen] = useState(false);
  const [on, setOn] = useState(wishlisted);

  useEffect(() => {
    setOn(wishlisted);
  }, [wishlisted]);
  const ink = light ? '#FFFFFF' : theme.colors.text;
  const fill = on ? theme.colors.danger : 'transparent';
  const stroke = on ? theme.colors.danger : ink;

  return (
    <>
      <Pressable
        accessibilityLabel={on ? 'Remove from wishlist' : 'Save to wishlist'}
        accessibilityRole="button"
        hitSlop={ms(8)}
        onPress={() => {
          if (!token) {
            setJoinOpen(true);
            return;
          }
          const next = !on;
          setOn(next);
          toggle.mutate(on, {
            onError: (error) => {
              setOn(on);
              showErrorToast(error, 'Could not update wishlist');
            },
            onSuccess: () => {
              showToast.success(
                next ? 'Saved' : 'Removed',
                next ? 'In your wishlist.' : 'Taken off the wishlist.',
              );
            },
          });
        }}
        style={styles.hit}>
        <Heart
          color={stroke}
          fill={fill}
          size={ms(size)}
          strokeWidth={2}
        />
      </Pressable>
      <JoinToContinueSheet
        message="Save courses to your wishlist and pick them up on phone or web."
        onClose={() => setJoinOpen(false)}
        title="Join to save"
        visible={joinOpen}
      />
    </>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: ms(40),
    height: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
