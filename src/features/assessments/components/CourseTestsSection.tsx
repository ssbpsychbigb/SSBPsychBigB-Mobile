/**
 * Tests linked to a course. Locked until the learner is enrolled.
 */

import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, ClipboardList, Lock } from 'lucide-react-native';

import { useCourseAssessmentsQuery } from '@/features/assessments/hooks/useAssessmentQueries';
import { asmtKindLabel } from '@/features/assessments/lib/assessment-format';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type CourseTestsSectionProps = {
  slug: string;
  onOpen: (slug: string) => void;
};

/**
 * Course page section. Hidden when the course has no published tests.
 */
export function CourseTestsSection({ slug, onOpen }: CourseTestsSectionProps) {
  const theme = useTheme();
  const query = useCourseAssessmentsQuery(slug);
  const data = query.data;
  const items = data?.items ?? [];

  if (query.isLoading && !data) {
    return (
      <View style={styles.block}>
        <AppText variant="label" weight="bold">
          Course tests
        </AppText>
        <AppText color="muted" variant="caption">
          Loading tests…
        </AppText>
      </View>
    );
  }

  if (query.isError) {
    return null;
  }

  if (data?.locked) {
    return (
      <View style={styles.block}>
        <AppText variant="label" weight="bold">
          Course tests
        </AppText>
        <View
          style={[
            styles.locked,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}>
          <Lock color={theme.colors.textMuted} size={ms(16)} strokeWidth={2} />
          <AppText color="secondary" style={styles.flex} variant="caption">
            Enroll to unlock the tests on this course. Passing a required test can unlock the certificate.
          </AppText>
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.block}>
      <AppText variant="label" weight="bold">
        Course tests
      </AppText>
      <AppText color="muted" variant="caption">
        Enrolled learners sit these. A required test can gate the certificate.
      </AppText>
      {items.map((item) => {
        const passed = data?.passedIds?.includes(item.id);
        const meta = [
          asmtKindLabel(item.kind),
          item.requiredForCertificate ? 'Required for certificate' : '',
          item.requireCoursePct ? `${item.requireCoursePct}% progress` : '',
          passed ? 'Passed' : '',
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() => onOpen(item.slug || item.id)}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.92 : 1,
              },
            ]}>
            <View style={[styles.icon, { backgroundColor: theme.colors.primaryMuted }]}>
              <ClipboardList color={theme.colors.primary} size={ms(16)} strokeWidth={2} />
            </View>
            <View style={styles.copy}>
              <AppText numberOfLines={2} variant="label" weight="semibold">
                {item.title}
              </AppText>
              <AppText color="muted" numberOfLines={2} variant="caption">
                {meta}
              </AppText>
            </View>
            <ChevronRight color={theme.colors.textMuted} size={ms(18)} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: vs(10),
  },
  locked: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s(10),
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(16),
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(16),
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
  },
  icon: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: vs(2),
  },
  flex: {
    flex: 1,
  },
});
