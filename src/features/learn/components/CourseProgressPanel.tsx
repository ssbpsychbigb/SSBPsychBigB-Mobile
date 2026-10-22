/**
 * Enrolled assignments + certificate claim — same gates as web.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Award, CheckCircle2 } from 'lucide-react-native';

import { useRootNavigate } from '@/app/navigation/useRootNavigate';
import type { AssignmentItem } from '@/features/learn/api/course-cert.api';
import {
  useCertificateEligibilityQuery,
  useCourseAssignmentsQuery,
  useIssueCertificateMutation,
  useSubmitAssignmentMutation,
} from '@/features/learn/hooks/useCourseCertQueries';
import type { CourseDetails } from '@/features/learn/types/course.types';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

export type CourseProgressPanelProps = {
  course: CourseDetails;
};

function kindLabel(kind?: string) {
  if (kind === 'file') return 'File';
  if (kind === 'mcq') return 'MCQ';
  if (kind === 'descriptive') return 'Written';
  return 'Text';
}

/**
 * Only rendered when the viewer is enrolled.
 */
export function CourseProgressPanel({ course }: CourseProgressPanelProps) {
  const theme = useTheme();
  const goRoot = useRootNavigate();
  const enabled = Boolean(course.enrollment);
  const assignments = useCourseAssignmentsQuery(course.slug, enabled);
  const eligibility = useCertificateEligibilityQuery(course.slug, enabled);
  const submit = useSubmitAssignmentMutation(course.slug);
  const issue = useIssueCertificateMutation(course.slug);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [picks, setPicks] = useState<Record<string, number[]>>({});

  if (!enabled) {
    return null;
  }

  const items = assignments.data?.items ?? [];
  const elig = eligibility.data;

  const send = async (item: AssignmentItem) => {
    const kind = item.kind || 'text';
    const bodyText = (drafts[item.id] || '').trim();
    const answers = picks[item.id] || [];
    if ((kind === 'text' || kind === 'descriptive') && !bodyText) {
      showToast.warning('Write an answer', 'Add your response before submit.');
      return;
    }
    if (kind === 'mcq' && answers.length < (item.questions || []).length) {
      showToast.warning('Incomplete', 'Answer every question.');
      return;
    }
    let file: { uri: string; name: string; type: string } | undefined;
    if (kind === 'file') {
      const picked = await launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: 1,
      });
      const asset = picked.assets?.[0];
      if (!asset?.uri) {
        showToast.warning('Choose a file', 'Pick a photo or video to attach.');
        return;
      }
      file = {
        uri: asset.uri,
        name: asset.fileName || 'submission.jpg',
        type: asset.type || 'image/jpeg',
      };
    }
    submit.mutate(
      { assignmentId: item.id, bodyText, answers, file },
      {
        onSuccess: () => showToast.success('Submitted', 'Faculty can grade this now.'),
        onError: (error) => showErrorToast(error, 'Could not submit'),
      },
    );
  };

  return (
    <View style={styles.block}>
      <AppText variant="label" weight="bold">
        Assignments & certificate
      </AppText>

      {elig?.certificate ? (
        <Pressable
          onPress={() =>
            goRoot('CertificateVerify', {
              code: elig.certificate!.certificateCode,
            })
          }
          style={[styles.cert, { backgroundColor: theme.colors.primaryMuted }]}>
          <Award color={theme.colors.primary} size={ms(18)} />
          <View style={styles.flex}>
            <AppText variant="caption" weight="semibold">
              Certificate issued
            </AppText>
            <AppText color="muted" variant="caption">
              {elig.certificate.certificateCode}
            </AppText>
          </View>
        </Pressable>
      ) : (
        <View style={styles.claim}>
          <AppText color="secondary" variant="caption">
            {elig?.reason ||
              `Need ${elig?.requiredPct ?? 100}% progress to claim.`}
          </AppText>
          <Button
            disabled={!elig?.eligible}
            loading={issue.isPending}
            onPress={() =>
              issue.mutate(undefined, {
                onSuccess: (data) => {
                  showToast.success('Certificate ready', data.certificate.certificateCode);
                  goRoot('CertificateVerify', {
                    code: data.certificate.certificateCode,
                  });
                },
                onError: (error) => showErrorToast(error, 'Could not issue'),
              })
            }
            size="sm">
            Claim certificate
          </Button>
        </View>
      )}

      {items.length === 0 ? (
        <AppText color="muted" variant="caption">
          No assignments on this course.
        </AppText>
      ) : (
        items.map((item) => {
          const kind = item.kind || 'text';
          const sub = item.submission;
          const locked =
            Boolean(sub) &&
            sub?.status !== 'returned' &&
            !item.canResubmit;
          return (
            <View
              key={item.id}
              style={[styles.item, { borderColor: theme.colors.border }]}>
              <View style={styles.itemTop}>
                <AppText style={styles.flex} variant="label" weight="semibold">
                  {item.title}
                </AppText>
                <AppText color="muted" variant="caption">
                  {kindLabel(kind)}
                </AppText>
              </View>
              {item.instructions ? (
                <AppText color="secondary" variant="caption">
                  {item.instructions}
                </AppText>
              ) : null}
              {sub ? (
                <View style={styles.status}>
                  {sub.status === 'graded' ? (
                    <CheckCircle2 color={theme.colors.success} size={ms(14)} />
                  ) : null}
                  <AppText color="muted" variant="caption">
                    {sub.status}
                    {sub.score != null ? ` · ${sub.score}/${item.maxScore}` : ''}
                    {sub.feedback ? ` · ${sub.feedback}` : ''}
                  </AppText>
                </View>
              ) : null}
              {!locked && kind === 'mcq' ? (
                (item.questions || []).map((question, qi) => (
                  <View key={`${item.id}-${qi}`} style={styles.q}>
                    <AppText variant="caption" weight="semibold">
                      {qi + 1}. {question.prompt}
                    </AppText>
                    {question.options.map((option, oi) => {
                      const on = picks[item.id]?.[qi] === oi;
                      return (
                        <Pressable
                          key={`${qi}-${oi}`}
                          onPress={() =>
                            setPicks((prev) => {
                              const next = [...(prev[item.id] || [])];
                              next[qi] = oi;
                              return { ...prev, [item.id]: next };
                            })
                          }>
                          <AppText color={on ? 'brand' : 'secondary'} variant="caption">
                            {on ? '● ' : '○ '}
                            {option}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                ))
              ) : null}
              {!locked && (kind === 'text' || kind === 'descriptive') ? (
                <TextInput
                  multiline
                  onChangeText={(value) =>
                    setDrafts((prev) => ({ ...prev, [item.id]: value }))
                  }
                  placeholder="Your answer"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                      fontFamily: resolveFontFamily('regular'),
                    },
                  ]}
                  value={drafts[item.id] || ''}
                />
              ) : null}
              {!locked ? (
                <Button
                  loading={submit.isPending}
                  onPress={() => void send(item)}
                  size="sm"
                  variant="secondary">
                  {kind === 'file' ? 'Pick file & submit' : 'Submit'}
                </Button>
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: vs(18),
    gap: vs(12),
  },
  cert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    borderRadius: ms(14),
    padding: s(12),
  },
  claim: {
    gap: vs(8),
  },
  item: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(14),
    padding: s(12),
    gap: vs(8),
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
  },
  q: {
    gap: vs(4),
  },
  input: {
    minHeight: vs(72),
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(10),
    paddingVertical: vs(8),
    fontSize: 14,
    textAlignVertical: 'top',
  },
});
