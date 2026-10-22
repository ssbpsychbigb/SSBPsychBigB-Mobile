/**
 * Catalogue row — cover, kind, title, length, price.
 */

import { Image, Pressable, StyleSheet, View } from 'react-native';
import { ClipboardList } from 'lucide-react-native';

import {
  asmtKindLabel,
  formatAssessmentDuration,
  formatAssessmentPrice,
} from '@/features/assessments/lib/assessment-format';
import type { AssessmentCard } from '@/features/assessments/types/assessment.types';
import { ms, s, vs } from '@/shared/lib/responsive';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type AssessmentPreviewCardProps = {
  item: AssessmentCard;
  onPress: () => void;
};

/**
 * Quiet list row. Same rhythm as a course catalogue card.
 */
export function AssessmentPreviewCard({
  item,
  onPress,
}: AssessmentPreviewCardProps) {
  const theme = useTheme();
  const cover = resolveUploadUrl(item.coverUrl);
  const questions =
    item.itemCount === 1 ? '1 question' : `${item.itemCount} questions`;

  return (
    <Pressable
      accessibilityHint="Opens the test"
      accessibilityLabel={item.title}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.92 : 1 }]}>
      <View style={[styles.cover, { backgroundColor: theme.colors.primaryMuted }]}>
        {cover ? (
          <Image
            resizeMode="cover"
            source={{ uri: cover }}
            style={styles.coverImage}
          />
        ) : (
          <View style={styles.coverFallback}>
            <ClipboardList
              color={theme.colors.primary}
              size={ms(22)}
              strokeWidth={1.8}
            />
          </View>
        )}
      </View>

      <View style={styles.body}>
        <AppText color="brand" variant="caption" weight="semibold">
          {item.official ? `BIGB · ${asmtKindLabel(item.kind)}` : asmtKindLabel(item.kind)}
        </AppText>
        <AppText numberOfLines={2} variant="label" weight="bold">
          {item.title}
        </AppText>
        <AppText color="secondary" numberOfLines={1} variant="caption">
          {questions} · {formatAssessmentDuration(item.durationSec)}
          {item.my?.lastScorePct != null ? ` · last ${item.my.lastScorePct}%` : ''}
        </AppText>
        <AppText variant="label" weight="bold">
          {formatAssessmentPrice(item.priceInr)}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: s(12),
    marginBottom: vs(18),
  },
  cover: {
    width: s(112),
    height: vs(84),
    borderRadius: ms(12),
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: vs(2),
  },
});
