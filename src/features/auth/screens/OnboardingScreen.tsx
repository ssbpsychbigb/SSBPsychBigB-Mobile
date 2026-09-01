/**
 * Aspirant onboarding — exam goal, institute code, attempt date / prep stage.
 */

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Target } from 'lucide-react-native';

import {
  AuthField,
  AuthTextInput,
} from '@/features/auth/components/AuthFields';
import {
  EXAM_GOAL_OPTIONS,
  type ExamGoalValue,
} from '@/features/auth/constants/exam-goals';
import {
  completeOnboarding,
  type PrepStage,
} from '@/features/auth/lib/onboarding-storage';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { APP_CONFIG } from '@/shared/constants/config';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Screen } from '@/shared/ui';
import { showToast } from '@/shared/ui/toast';

const PREP_STAGES: Array<{ value: PrepStage; label: string }> = [
  { value: 'just_starting', label: 'Just starting' },
  { value: 'foundation', label: 'Building foundations' },
  { value: 'advanced', label: 'Advanced prep' },
  { value: 'ssb_ready', label: 'SSB-ready' },
];

export type OnboardingScreenProps = {
  /** Called after local onboarding is persisted (RootNavigator remounts App). */
  onComplete?: () => void;
};

/**
 * Multi-step aspirant onboarding (ONB-002 → ONB-006).
 */
export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);

  const initialGoal = useMemo(() => {
    const fromUser = user?.examGoal;
    if (
      fromUser &&
      EXAM_GOAL_OPTIONS.some((option) => option.value === fromUser)
    ) {
      return fromUser as ExamGoalValue;
    }
    return '' as ExamGoalValue | '';
  }, [user?.examGoal]);

  const [step, setStep] = useState(0);
  const [examGoal, setExamGoal] = useState<ExamGoalValue | ''>(initialGoal);
  const [instituteCode, setInstituteCode] = useState('');
  const [skippedInstitute, setSkippedInstitute] = useState(false);
  const [attemptDate, setAttemptDate] = useState('');
  const [prepStage, setPrepStage] = useState<PrepStage | ''>('');
  const [error, setError] = useState<string | null>(null);

  const finish = (didSkipInstitute: boolean) => {
    if (!user?.id) {
      return;
    }

    completeOnboarding({
      userId: user.id,
      examGoal,
      instituteCode: didSkipInstitute
        ? ''
        : instituteCode.trim().toUpperCase(),
      skippedInstituteCode: didSkipInstitute || !instituteCode.trim(),
      attemptDate: attemptDate.trim(),
      prepStage,
      completedAt: new Date().toISOString(),
    });
    showToast.success('Welcome aboard', 'Your command center is ready.');
    onComplete?.();
  };

  const goNext = () => {
    setError(null);

    if (step === 0 && !examGoal) {
      const message = 'Select your primary exam goal.';
      setError(message);
      showToast.warning('Almost there', message);
      return;
    }

    if (step === 1) {
      const code = instituteCode.trim();
      if (code && code.length < 4) {
        const message =
          'Institute code must be at least 4 characters, or skip.';
        setError(message);
        showToast.warning('Invalid code', message);
        return;
      }
    }

    if (step === 2) {
      if (!prepStage) {
        const message = 'Select your preparation stage.';
        setError(message);
        showToast.warning('Almost there', message);
        return;
      }
      if (attemptDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(attemptDate.trim())) {
        const message = 'Use attempt date as YYYY-MM-DD, or leave blank.';
        setError(message);
        showToast.warning('Invalid date', message);
        return;
      }
      finish(skippedInstitute || !instituteCode.trim());
      return;
    }

    setStep((prev) => prev + 1);
  };

  return (
    <Screen contentStyle={styles.content} scroll>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: theme.colors.primaryMuted },
        ]}>
        <Target color={theme.colors.primary} size={ms(28)} />
      </View>
      <AppText color="brand" style={styles.brand} variant="title">
        {APP_CONFIG.appName}
      </AppText>
      <AppText style={styles.heading} variant="subtitle">
        {step === 0
          ? 'Your exam goal'
          : step === 1
            ? 'Institute code'
            : 'Prep plan'}
      </AppText>
      <AppText color="secondary" style={styles.copy} variant="body">
        {step === 0
          ? 'Tell us what you are preparing for so we can personalize your home.'
          : step === 1
            ? 'If a coaching institute shared a BIGB code, enter it to link your account. You can skip.'
            : 'Optional attempt date and where you are in prep.'}
      </AppText>

      <AppText color="muted" style={styles.step} variant="caption">
        Step {step + 1} of 3
      </AppText>

      {step === 0 ? (
        <View style={styles.chips}>
          {EXAM_GOAL_OPTIONS.map((option) => {
            const selected = examGoal === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setExamGoal(option.value)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected
                      ? theme.colors.primaryMuted
                      : theme.colors.surface,
                    borderColor: selected
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}>
                <AppText
                  color={selected ? 'brand' : 'primary'}
                  variant="label">
                  {option.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {step === 1 ? (
        <AuthField label="Institute code (optional)">
          <AuthTextInput
            autoCapitalize="characters"
            onChangeText={setInstituteCode}
            placeholder="e.g. BIGB1234"
            value={instituteCode}
          />
        </AuthField>
      ) : null}

      {step === 2 ? (
        <View style={styles.stepTwo}>
          <AuthField label="Target attempt date (optional)">
            <AuthTextInput
              onChangeText={setAttemptDate}
              placeholder="YYYY-MM-DD"
              value={attemptDate}
            />
          </AuthField>
          <AppText color="secondary" variant="caption">
            Preparation stage
          </AppText>
          <View style={styles.chips}>
            {PREP_STAGES.map((option) => {
              const selected = prepStage === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setPrepStage(option.value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected
                        ? theme.colors.primaryMuted
                        : theme.colors.surface,
                      borderColor: selected
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}>
                  <AppText
                    color={selected ? 'brand' : 'primary'}
                    variant="caption">
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {error ? (
        <AppText color="danger" variant="caption">
          {error}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        <Button fullWidth onPress={goNext}>
          {step === 2 ? 'Finish & open home' : 'Continue'}
        </Button>
        {step === 1 ? (
          <Button
            fullWidth
            onPress={() => {
              setInstituteCode('');
              setSkippedInstitute(true);
              setStep(2);
            }}
            variant="secondary">
            Skip for now
          </Button>
        ) : null}
        {step > 0 ? (
          <Button fullWidth onPress={() => setStep((s) => s - 1)} variant="ghost">
            Back
          </Button>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: vs(32),
    paddingBottom: vs(40),
    gap: ms(12),
  },
  iconWrap: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  brand: {
    textAlign: 'center',
    letterSpacing: 1,
  },
  heading: {
    textAlign: 'center',
  },
  copy: {
    textAlign: 'center',
  },
  step: {
    textAlign: 'center',
    marginBottom: vs(4),
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ms(8),
  },
  chip: {
    borderWidth: 1,
    borderRadius: ms(999),
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
  },
  stepTwo: {
    gap: ms(12),
  },
  actions: {
    gap: ms(10),
    marginTop: vs(12),
  },
});
