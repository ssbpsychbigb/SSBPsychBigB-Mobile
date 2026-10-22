/**
 * Paid test checkout. Same coupon, sandbox bypass, and Razorpay WebView as courses.
 * A paid order is what unlocks Start on the test.
 */

import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';

import type { RootStackParamList } from '@/app/navigation/types';
import {
  useAssessmentCheckoutMutation,
  useAssessmentDetailQuery,
  useConfirmAssessmentPaymentMutation,
  useVerifyAssessmentPaymentMutation,
} from '@/features/assessments/hooks/useAssessmentQueries';
import { formatAssessmentPrice } from '@/features/assessments/lib/assessment-format';
import type {
  AssessmentCheckoutOrder,
  AssessmentCheckoutResult,
} from '@/features/assessments/types/assessment.types';
import { AuthField, AuthTextInput } from '@/features/auth/components/AuthFields';
import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { RazorpayCheckoutWebView } from '@/features/learn/components/RazorpayCheckoutWebView';
import { useCouponPreviewQuery, usePaymentStatusQuery } from '@/features/learn/hooks/useCourseQueries';
import type { RazorpayCheckoutPayload } from '@/features/learn/types/course.types';
import { useScreenBottomPadding, useScreenTopPadding } from '@/shared/lib/safe-area';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Screen, Spinner } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentCheckout'>;

/**
 * Buy a published test. Already purchased returns to the test.
 */
export function AssessmentCheckoutScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const topPad = useScreenTopPadding();
  const dockPad = useScreenBottomPadding(vs(16));
  const { slug } = route.params;
  const token = useAuthStore((state) => state.accessToken);
  const detail = useAssessmentDetailQuery(slug);
  const payStatus = usePaymentStatusQuery(Boolean(token));
  const checkout = useAssessmentCheckoutMutation(slug);
  const sandbox = useConfirmAssessmentPaymentMutation(slug);
  const verify = useVerifyAssessmentPaymentMutation(slug);

  const [couponCode, setCouponCode] = useState('');
  const [instituteCode, setInstituteCode] = useState('');
  const [joinOpen, setJoinOpen] = useState(false);
  const [order, setOrder] = useState<AssessmentCheckoutOrder | null>(null);
  const [couponLabel, setCouponLabel] = useState<string | null>(null);
  const [mode, setMode] = useState('sandbox');
  const [message, setMessage] = useState<string | null>(null);
  const [razorpay, setRazorpay] = useState<RazorpayCheckoutPayload | null>(null);
  const [rzpOpen, setRzpOpen] = useState(false);
  const [paid, setPaid] = useState(false);

  const item = detail.data;
  const price = item?.priceInr || 0;
  const preview = useCouponPreviewQuery(price, couponCode, Boolean(token) && !order && !paid);
  const unlocked = Boolean(item?.my?.purchased || item?.my?.isAuthor || paid);
  const live = payStatus.data?.mode === 'razorpay' || mode === 'razorpay';

  const applyCheckout = (result: AssessmentCheckoutResult) => {
    setOrder(result.order);
    setCouponLabel(result.couponLabel);
    setMode(result.mode);
    setMessage(result.message);
    setRazorpay(result.razorpay || null);
    if (result.mode === 'free' && result.order.status === 'paid') {
      setPaid(true);
    }
  };

  const onContinue = () => {
    if (!token) {
      setJoinOpen(true);
      return;
    }
    checkout.mutate(
      {
        couponCode: couponCode.trim() || undefined,
        instituteCode: instituteCode.trim() || undefined,
      },
      {
        onSuccess: applyCheckout,
        onError: (error) => showErrorToast(error, 'Could not start checkout'),
      },
    );
  };

  const onSandboxPay = () => {
    if (!order) return;
    sandbox.mutate(order.id, {
      onSuccess: () => {
        setPaid(true);
        showToast.success('Test unlocked', 'You can start it now.');
      },
      onError: (error) => showErrorToast(error, 'Payment failed'),
    });
  };

  const openTest = () => {
    navigation.replace('AssessmentDetail', { slug });
  };

  if (detail.isLoading && !item) {
    return (
      <Screen safeBottom={false}>
        <Spinner fullScreen />
      </Screen>
    );
  }

  return (
    <Screen
      padded={false}
      safeBottom={false}
      safeTop={false}
      style={{ backgroundColor: theme.colors.background }}>
      <View style={[styles.topBar, { paddingTop: topPad }]}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={[
            styles.back,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}>
          <ArrowLeft color={theme.colors.text} size={ms(20)} strokeWidth={2} />
        </Pressable>
        <AppText variant="label" weight="bold">
          Checkout
        </AppText>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {!item ? (
            <AppText color="secondary" variant="body">
              This test is not available.
            </AppText>
          ) : unlocked || price <= 0 ? (
            <View style={styles.success}>
              <CheckCircle2 color={theme.colors.success} size={ms(36)} />
              <AppText variant="title" weight="bold">
                {price <= 0 && !paid ? 'This test is free' : 'Test unlocked'}
              </AppText>
              <AppText color="secondary" variant="body">
                {item.title}
              </AppText>
              {order?.invoiceNo ? (
                <AppText color="muted" variant="caption">
                  {`Invoice ${order.invoiceNo}`}
                </AppText>
              ) : null}
              <Button fullWidth onPress={openTest} size="lg">
                {price <= 0 && !paid ? 'Back to test' : 'Start test'}
              </Button>
            </View>
          ) : (
            <View style={styles.column}>
              <AppText variant="subtitle" weight="bold">
                {item.title}
              </AppText>
              <AppText color="muted" variant="caption">
                One purchase on this account. The same order shows on the website.
              </AppText>

              <AuthField label="Coupon">
                <AuthTextInput
                  autoCapitalize="characters"
                  editable={!order}
                  onChangeText={(value) => setCouponCode(value.toUpperCase())}
                  placeholder="BIGB10"
                  value={couponCode}
                />
              </AuthField>
              <AppText color="muted" variant="caption">
                Try BIGB10, BIGB100, or DEFENCE20
              </AppText>
              <AuthField label="Institute code (optional)">
                <AuthTextInput
                  autoCapitalize="characters"
                  editable={!order}
                  onChangeText={(value) => setInstituteCode(value.toUpperCase())}
                  placeholder="INST code"
                  value={instituteCode}
                />
              </AuthField>

              <View
                style={[
                  styles.totals,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}>
                <TotalRow label="Price" value={formatAssessmentPrice(order?.amountOriginal ?? price)} />
                {(order ? order.discountAmount : preview.data?.discountAmount || 0) > 0 ? (
                  <TotalRow label="Discount" value={`−${formatAssessmentPrice(
                      order?.discountAmount ?? preview.data?.discountAmount ?? 0,
                    )}`}
                  />
                ) : null}
                <TotalRow
                  bold
                  label="Payable"
                  value={formatAssessmentPrice(
                    order?.amountPayable ?? preview.data?.amountPayable ?? price,
                  )}
                />
              </View>
              <AppText color="muted" variant="caption">
                {message ||
                  payStatus.data?.message ||
                  (live
                    ? 'Pay with Razorpay. Keys are live on the server.'
                    : 'Sandbox Pay bypass unlocks the test until Razorpay keys are live.')}
              </AppText>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {item && !unlocked && price > 0 ? (
        <View
          style={[
            styles.dock,
            {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border,
              paddingBottom: dockPad,
            },
          ]}>
          {!order ? (
            <Button fullWidth loading={checkout.isPending} onPress={onContinue} size="lg">
              Continue
            </Button>
          ) : mode === 'razorpay' && razorpay ? (
            <Button
              fullWidth
              loading={verify.isPending}
              onPress={() => setRzpOpen(true)}
              size="lg">
              {`Pay · ${formatAssessmentPrice(order.amountPayable)}`}
            </Button>
          ) : (
            <Button fullWidth loading={sandbox.isPending} onPress={onSandboxPay} size="lg">
              {order.amountPayable === 0
                ? 'Confirm free unlock'
                : `Pay bypass · ${formatAssessmentPrice(order.amountPayable)}`}
            </Button>
          )}
        </View>
      ) : null}

      <RazorpayCheckoutWebView
        onClose={() => setRzpOpen(false)}
        onError={(msg) => {
          setRzpOpen(false);
          showToast.error('Payment', msg);
        }}
        onSuccess={(payload) => {
          if (!order) return;
          setRzpOpen(false);
          verify.mutate(
            { orderId: order.id, ...payload },
            {
              onSuccess: () => {
                setPaid(true);
                showToast.success('Test unlocked', 'Payment verified.');
              },
              onError: (error) => showErrorToast(error, 'Could not verify payment'),
            },
          );
        }}
        payload={razorpay}
        visible={rzpOpen}
      />
      <JoinToContinueSheet
        message="Purchases stay on this account, including tests you bought on the web."
        onClose={() => setJoinOpen(false)}
        title="Sign in to buy"
        visible={joinOpen}
      />
    </Screen>
  );
}

function TotalRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.totalRow}>
      <AppText color={bold ? 'primary' : 'muted'} variant="caption" weight={bold ? 'semibold' : 'regular'}>
        {label}
      </AppText>
      <AppText variant="label" weight="bold">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    paddingHorizontal: s(16),
    paddingBottom: vs(8),
  },
  back: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: s(16),
    paddingBottom: vs(28),
    flexGrow: 1,
  },
  column: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: vs(12),
  },
  success: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    alignItems: 'flex-start',
    gap: vs(10),
    paddingTop: vs(24),
  },
  totals: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(18),
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    gap: vs(2),
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(8),
    gap: s(12),
  },
  dock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: vs(12),
    paddingHorizontal: s(16),
  },
});
