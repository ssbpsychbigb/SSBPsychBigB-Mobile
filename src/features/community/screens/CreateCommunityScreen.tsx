/**
 * Create club — identity, access, review.
 */

import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, Check, ImagePlus } from 'lucide-react-native';

import type { RootStackParamList } from '@/app/navigation/types';
import { EXAM_GOAL_OPTIONS } from '@/features/auth/constants/exam-goals';
import { pickFeedImage } from '@/features/feed/lib/pick-feed-image';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { communityApi } from '@/features/community/api/community.api';
import {
  useCreateCommunityMutation,
  useInstituteCommunityQuotaQuery,
} from '@/features/community/hooks/useCommunityQueries';
import { canCreateCommunity } from '@/features/community/lib/community-permissions';
import { toCommunityFileForm } from '@/features/community/lib/community-upload';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { ms, s, vs } from '@/shared/lib/responsive';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Screen, ScreenHeader } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateCommunity'>;

const STEPS = ['Identity', 'Access', 'Review'] as const;

function previewSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

/**
 * Wizard for officers, institutes, and permitted educators.
 */
export function CreateCommunityScreen({ navigation }: Props) {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.accessToken);
  const createMutation = useCreateCommunityMutation();
  const quotaQuery = useInstituteCommunityQuotaQuery(Boolean(token));

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [examGoals, setExamGoals] = useState<string[]>([]);
  const [coverPhotoPath, setCoverPhotoPath] = useState('');
  const [avatarPath, setAvatarPath] = useState('');
  const [coAdminUsername, setCoAdminUsername] = useState('');
  const [uploading, setUploading] = useState<'cover' | 'avatar' | null>(null);

  const slug = useMemo(() => previewSlug(name) || 'your-club', [name]);
  const quota = quotaQuery.data;
  const quotaFull =
    Boolean(quota?.applicable) && quota?.remaining != null && quota.remaining <= 0;
  const canNextIdentity = name.trim().length >= 3 && !quotaFull;
  const instituteScoped = Boolean(
    user?.role === 'institute' ||
      user?.role === 'institute_admin' ||
      (user?.role === 'educator' && user.instituteId),
  );

  const allowed = canCreateCommunity(user);

  const uploadBrand = async (kind: 'cover' | 'avatar') => {
    if (!token) {
      return;
    }
    const asset = await pickFeedImage();
    if (!asset) {
      return;
    }
    setUploading(kind);
    try {
      const result = await communityApi.uploadBrand(
        toCommunityFileForm(asset),
        kind,
        token,
      );
      if (kind === 'cover') {
        setCoverPhotoPath(result.path);
      } else {
        setAvatarPath(result.path);
      }
    } catch (error) {
      showErrorToast(error, 'Could not upload image.', 'Community');
    } finally {
      setUploading(null);
    }
  };

  const onCreate = async () => {
    try {
      const community = await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        visibility,
        examGoals,
        coverPhotoPath: coverPhotoPath || undefined,
        avatarPath: avatarPath || undefined,
        coAdminUsername: coAdminUsername.trim() || undefined,
      });
      showToast.success('Community is live');
      navigation.replace('ClubHome', { slug: community.slug });
    } catch (error) {
      showErrorToast(error, 'Could not create this club.', 'Community');
    }
  };

  const inputStyle = [
    styles.input,
    {
      color: theme.colors.text,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      fontFamily: resolveFontFamily('regular'),
    },
  ];

  return (
    <Screen
      padded={false}
      style={{
        backgroundColor:
          theme.mode === 'dark' ? theme.colors.background : theme.palette.primary[50],
      }}>
      <ScreenHeader>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={[
            styles.back,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}>
          <ArrowLeft color={theme.colors.text} size={ms(20)} strokeWidth={2} />
        </Pressable>
        <View style={styles.titles}>
          <AppText variant="subtitle" weight="bold">
            Open a club
          </AppText>
          <AppText color="muted" variant="caption">
            {quota?.applicable
              ? `Quota ${quota.used}/${quota.communityQuota}${quotaFull ? ' — full' : ''}`
              : 'Primary admin is you. Join is never automatic.'}
          </AppText>
        </View>
      </ScreenHeader>

      <View style={styles.steps}>
        {STEPS.map((label, index) => {
          const active = step === index;
          const done = step > index;
          return (
            <Pressable
              key={label}
              onPress={() => {
                if (index < step || (index === 1 && canNextIdentity)) {
                  setStep(index as 0 | 1 | 2);
                }
              }}
              style={[
                styles.step,
                {
                  backgroundColor: active
                    ? theme.colors.background
                    : 'transparent',
                },
              ]}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: done || active ? theme.colors.primary : theme.colors.border,
                  },
                ]}>
                {done ? (
                  <Check color="#FFFFFF" size={ms(10)} strokeWidth={3} />
                ) : (
                  <AppText color="inverse" variant="caption" weight="bold">
                    {index + 1}
                  </AppText>
                )}
              </View>
              <AppText
                color={active ? 'primary' : 'muted'}
                variant="caption"
                weight="semibold">
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {!allowed ? (
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
            ]}>
            <AppText variant="subtitle" weight="bold">
              Create not available
            </AppText>
            <AppText color="muted" variant="caption">
              Officers, institutes, freelancer educators, and institute educators
              with community.create can open a club. You can still join public ones.
            </AppText>
            <Button onPress={() => navigation.goBack()}>Browse communities</Button>
          </View>
        ) : null}

        {allowed && step === 0 ? (
          <View style={styles.stack}>
            <Pressable
              onPress={() => void uploadBrand('cover')}
              style={[
                styles.coverPick,
                { backgroundColor: theme.colors.primaryMuted, borderColor: theme.colors.border },
              ]}>
              {coverPhotoPath ? (
                <Image
                  source={{ uri: resolveUploadUrl(coverPhotoPath) || undefined }}
                  style={styles.coverImage}
                />
              ) : (
                <View style={styles.coverHint}>
                  <ImagePlus color={theme.colors.primary} size={ms(22)} />
                  <AppText color="brand" variant="caption" weight="semibold">
                    {uploading === 'cover' ? 'Uploading…' : 'Add cover'}
                  </AppText>
                </View>
              )}
              <Pressable
                onPress={() => void uploadBrand('avatar')}
                style={[
                  styles.avatarPick,
                  {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.background,
                  },
                ]}>
                {avatarPath ? (
                  <Image
                    source={{ uri: resolveUploadUrl(avatarPath) || undefined }}
                    style={styles.coverImage}
                  />
                ) : (
                  <AppText color="inverse" variant="caption" weight="bold">
                    {uploading === 'avatar' ? '…' : '+'}
                  </AppText>
                )}
              </Pressable>
            </Pressable>

            <View
              style={[
                styles.card,
                { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
              ]}>
              <AppText color="secondary" variant="caption" weight="semibold">
                NAME
              </AppText>
              <TextInput
                maxLength={80}
                onChangeText={setName}
                placeholder="e.g. SSB Psychology Circle"
                placeholderTextColor={theme.colors.textMuted}
                style={inputStyle}
                value={name}
              />
              <AppText color="muted" variant="caption">
                /c/{slug}
              </AppText>
              <AppText color="secondary" variant="caption" weight="semibold">
                ABOUT
              </AppText>
              <TextInput
                multiline
                onChangeText={setDescription}
                placeholder="Who belongs here, and what you practise together."
                placeholderTextColor={theme.colors.textMuted}
                style={[inputStyle, styles.multiline]}
                value={description}
              />
              <AppText color="secondary" variant="caption" weight="semibold">
                EXAM FOCUS
              </AppText>
              <View style={styles.goals}>
                {EXAM_GOAL_OPTIONS.map((goal) => {
                  const on = examGoals.includes(goal.value);
                  return (
                    <Pressable
                      key={goal.value}
                      onPress={() =>
                        setExamGoals((prev) =>
                          on
                            ? prev.filter((item) => item !== goal.value)
                            : [...prev, goal.value],
                        )
                      }
                      style={[
                        styles.goal,
                        {
                          backgroundColor: on
                            ? theme.colors.primary
                            : theme.colors.surface,
                          borderColor: on ? theme.colors.primary : theme.colors.border,
                        },
                      ]}>
                      <AppText
                        color={on ? 'inverse' : 'secondary'}
                        variant="caption"
                        weight="semibold">
                        {goal.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
              {quotaFull ? (
                <AppText color="muted" variant="caption">
                  Institute quota is full. Super Admin must raise it on web.
                </AppText>
              ) : null}
              <Button disabled={!canNextIdentity} onPress={() => setStep(1)}>
                Continue
              </Button>
            </View>
          </View>
        ) : null}

        {allowed && step === 1 ? (
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
            ]}>
            <AppText variant="label" weight="bold">
              Who can see this club?
            </AppText>
            {(['public', 'private'] as const).map((item) => {
              const on = visibility === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => setVisibility(item)}
                  style={[
                    styles.access,
                    {
                      borderColor: on ? theme.colors.primary : theme.colors.border,
                      backgroundColor: on
                        ? theme.colors.primaryMuted
                        : theme.colors.surface,
                    },
                  ]}>
                  <AppText variant="label" weight="semibold">
                    {item === 'public' ? 'Public' : 'Private'}
                  </AppText>
                  <AppText color="muted" variant="caption">
                    {item === 'public'
                      ? 'Anyone can preview posts. Join still needs your approval.'
                      : instituteScoped
                        ? 'Only your institute’s staff and students may request.'
                        : 'Only people you invite may request.'}
                  </AppText>
                </Pressable>
              );
            })}
            <AppText color="secondary" variant="caption" weight="semibold">
              CO-ADMIN USERNAME (OPTIONAL)
            </AppText>
            <TextInput
              autoCapitalize="none"
              onChangeText={setCoAdminUsername}
              placeholder="username"
              placeholderTextColor={theme.colors.textMuted}
              style={inputStyle}
              value={coAdminUsername}
            />
            <View style={styles.row}>
              <Button onPress={() => setStep(0)} variant="secondary">
                Back
              </Button>
              <Button onPress={() => setStep(2)}>Review</Button>
            </View>
          </View>
        ) : null}

        {allowed && step === 2 ? (
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
            ]}>
            <AppText variant="subtitle" weight="bold">
              {name.trim() || 'Untitled club'}
            </AppText>
            <AppText color="muted" variant="caption">
              {visibility === 'public' ? 'Public' : 'Private'} · /c/{slug}
            </AppText>
            {description ? (
              <AppText color="secondary" variant="caption">
                {description}
              </AppText>
            ) : null}
            <AppText color="muted" variant="caption">
              You become Primary Admin. Dual-key archive and delete need a Co-Admin.
            </AppText>
            <View style={styles.row}>
              <Button onPress={() => setStep(1)} variant="secondary">
                Back
              </Button>
              <Button
                disabled={quotaFull}
                loading={createMutation.isPending}
                onPress={() => void onCreate()}>
                Create club
              </Button>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(10),
  },
  titles: {
    flex: 1,
  },
  steps: {
    flexDirection: 'row',
    paddingHorizontal: s(12),
    gap: s(6),
    marginBottom: vs(8),
  },
  step: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(6),
    paddingVertical: vs(8),
    borderRadius: ms(12),
  },
  stepDot: {
    width: ms(18),
    height: ms(18),
    borderRadius: ms(9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: s(16),
    paddingBottom: vs(32),
  },
  stack: {
    gap: vs(12),
  },
  coverPick: {
    height: vs(120),
    borderRadius: ms(20),
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  coverImage: {
    ...StyleSheet.absoluteFill,
  },
  coverHint: {
    alignItems: 'center',
    gap: vs(6),
  },
  avatarPick: {
    position: 'absolute',
    left: s(16),
    bottom: vs(12),
    width: ms(48),
    height: ms(48),
    borderRadius: ms(16),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  card: {
    borderWidth: 1,
    borderRadius: ms(20),
    padding: s(16),
    gap: vs(10),
  },
  input: {
    height: ms(48),
    borderWidth: 1,
    borderRadius: ms(14),
    paddingHorizontal: s(12),
    fontSize: 15,
  },
  multiline: {
    height: vs(96),
    textAlignVertical: 'top',
    paddingTop: vs(10),
  },
  goals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
  },
  goal: {
    borderWidth: 1,
    borderRadius: ms(999),
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
  },
  access: {
    borderWidth: 1,
    borderRadius: ms(16),
    padding: s(14),
    gap: vs(4),
  },
  row: {
    flexDirection: 'row',
    gap: s(10),
  },
});
