/**
 * Paid checkout — coupon + sandbox Pay bypass or live Razorpay.
 */

import { useMemo, useState } from 'react';
import {
  Image,
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
import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { AuthField, AuthTextInput } from '@/features/auth/components/AuthFields';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { RazorpayCheckoutWebView } from '@/features/learn/components/RazorpayCheckoutWebView';
import {
  useConfirmSandboxPaymentMutation,
  useCouponPreviewQuery,
  useCourseDetailQuery,
  useCreateCheckoutMutation,
  usePaymentStatusQuery,
  useVerifyRazorpayPaymentMutation,
} from '@/features/learn/hooks/useCourseQueries';
import { courseCoverSource } from '@/features/learn/lib/course-cover';
import { formatCoursePrice } from '@/features/learn/lib/format-course';
import type {
  CheckoutResult,
  CourseOrder,
  RazorpayCheckoutPayload,
} from '@/features/learn/types/course.types';
import { useScreenBottomPadding, useScreenTopPadding } from '@/shared/lib/safe-area';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Screen, Spinner } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'CourseCheckout'>;

/**
 * Same account as web `/learn/courses/:slug/checkout`.
 */
export function CourseCheckoutScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const topPad = useScreenTopPadding();
  const dockPad = useScreenBottomPadding(vs(16));
  const { slug } = route.params;
  const token = useAuthStore((state) => state.accessToken);
  const detail = useCourseDetailQuery(slug);
  const payStatus = usePaymentStatusQuery(Boolean(token));
  const checkout = useCreateCheckoutMutation(slug);
  const sandbox = useConfirmSandboxPaymentMutation(slug);
  const verify = useVerifyRazorpayPaymentMutation(slug);

  const [couponCode, setCouponCode] = useState('');
  const [instituteCode, setInstituteCode] = useState('');
  const [joinOpen, setJoinOpen] = useState(false);
  const [order, setOrder] = useState<CourseOrder | null>(null);
  const [couponLabel, setCouponLabel] = useState<string | null>(null);
  const [mode, setMode] = useState('sandbox');
  const [message, setMessage] = useState<string | null>(null);
  const [razorpay, setRazorpay] = useState<RazorpayCheckoutPayload | null>(null);
  const [rzpOpen, setRzpOpen] = useState(false);
  const [paid, setPaid] = useState<CourseOrder | null>(null);

  const course = detail.data;
  const cover = course ? courseCoverSource(course) : null;
  const preview = useCouponPreviewQuery(
    course?.price || 0,
    couponCode,
    Boolean(token) && !order && !paid,
  );

  const firstLessonId = useMemo(() => {
    const lessons = course?.sections.flatMap((section) => section.lessons) ?? [];
    const resume = course?.enrollment?.lastLessonId;
    return lessons.find((lesson) => lesson.id === resume)?.id || lessons[0]?.id || null;
  }, [course]);

  const applyCheckout = (result: CheckoutResult) => {
    setOrder(result.order);
    setCouponLabel(result.couponLabel);
    setMode(result.mode);
    setMessage(result.message);
    setRazorpay(result.razorpay || null);
    if (result.mode === 'free' && result.order.status === 'paid') {
      setPaid(result.order);
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
    if (!order) {
      return;
    }
    sandbox.mutate(order.id, {
      onSuccess: (result) => {
        setPaid(result.order);
        showToast.success('Enrolled', 'This course is in My learning.');
      },
      onError: (error) => showErrorToast(error, 'Payment failed'),
    });
  };

  const onRazorpayVerified = (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    if (!order) {
      return;
    }
    setRzpOpen(false);
    verify.mutate(
      { orderId: order.id, ...payload },
      {
        onSuccess: (result) => {
          setPaid(result.order);
          showToast.success('Enrolled', 'Payment verified.');
        },
        onError: (error) => showErrorToast(error, 'Could not verify payment'),
      },
    );
  };

  const openStart = () => {
    if (firstLessonId) {
      navigation.replace('LessonPlayer', { slug, lessonId: firstLessonId });
      return;
    }
    navigation.replace('CourseDetail', { slug });
  };

  if (detail.isLoading && !course) {
    return (
      <Screen safeBottom={false}>
        <Spinner fullScreen />
      </Screen>
    );
  }

  const enrolled = Boolean(course?.enrollment) || Boolean(paid);
  const live = payStatus.data?.mode === 'razorpay' || mode === 'razorpay';

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
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
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
          {!course ? (
            <AppText color="secondary" variant="body">
              This listing may be unpublished.
            </AppText>
          ) : paid ? (
            <View style={styles.success}>
              <CheckCircle2 color={theme.colors.success} size={ms(36)} />
              <AppText variant="title" weight="bold">
                You’re enrolled
              </AppText>
              <AppText color="secondary" variant="body">
                {paid.course?.title || course.title}
              </AppText>
              {paid.invoiceNo ? (
                <AppText color="muted" variant="caption">
                  Invoice {paid.invoiceNo}
                </AppText>
              ) : null}
              <Button fullWidth onPress={openStart} size="lg">
                Start learning
              </Button>
              <Button
                fullWidth
                onPress={() =>
                  navigation.navigate('App', { screen: 'myCourse' })
                }
                variant="secondary">
                Go to My learning
              </Button>
            </View>
          ) : course.enrollment ? (
            <View style={styles.success}>
              <AppText variant="subtitle" weight="bold">
                You’re already enrolled
              </AppText>
              <Button fullWidth onPress={openStart} size="lg">
                Continue
              </Button>
            </View>
          ) : course.price <= 0 ? (
            <View style={styles.success}>
              <AppText variant="body">This course is free — enroll on the course page.</AppText>
              <Button
                fullWidth
                onPress={() => navigation.replace('CourseDetail', { slug })}
                variant="secondary">
                Back to course
              </Button>
            </View>
          ) : (
            <>
              <View style={styles.hero}>
                <View
                  style={[
                    styles.thumb,
                    { backgroundColor: theme.colors.primaryMuted },
                  ]}>
                  {cover ? (
                    <Image
                      resizeMode="cover"
                      source={cover}
                      style={styles.thumbImage}
                    />
                  ) : null}
                </View>
                <View style={styles.heroCopy}>
                  <AppText numberOfLines={2} variant="label" weight="bold">
                    {course.title}
                  </AppText>
                  <AppText color="muted" variant="caption">
                    Same account as the website
                  </AppText>
                </View>
              </View>

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
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}>
                {!order ? (
                  <>
                    <Row
                      label="Price"
                      value={formatCoursePrice(course.price, course.currency)}
                    />
                    {preview.data?.discountAmount ? (
                      <Row
                        label={
                          preview.data.couponLabel
                            ? `Discount (${preview.data.couponLabel})`
                            : 'Discount'
                        }
                        value={`−${formatCoursePrice(
                          preview.data.discountAmount,
                          course.currency,
                        )}`}
                      />
                    ) : null}
                    <Row
                      bold
                      label="Payable"
                      value={formatCoursePrice(
                        preview.data?.amountPayable ?? course.price,
                        course.currency,
                      )}
                    />
                  </>
                ) : (
                  <>
                    <Row
                      label="Original"
                      value={formatCoursePrice(
                        order.amountOriginal || course.price,
                        order.currency,
                      )}
                    />
                    {(order.discountAmount || 0) > 0 ? (
                      <Row
                        label={
                          couponLabel ? `Discount (${couponLabel})` : 'Discount'
                        }
                        value={`−${formatCoursePrice(
                          order.discountAmount ?? 0,
                          order.currency,
                        )}`}
                      />
                    ) : null}
                    <Row
                      bold
                      label="Payable"
                      value={formatCoursePrice(
                        order.amountPayable,
                        order.currency,
                      )}
                    />
                  </>
                )}
              </View>

              <AppText color="muted" variant="caption">
                {message ||
                  payStatus.data?.message ||
                  (live
                    ? 'Pay with Razorpay. Keys are live on the server.'
                    : 'Sandbox Pay bypass unlocks the course until Razorpay keys are live.')}
              </AppText>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {course && !enrolled && course.price > 0 ? (
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
            <Button
              fullWidth
              loading={checkout.isPending}
              onPress={onContinue}
              size="lg">
              Continue
            </Button>
          ) : mode === 'razorpay' && razorpay ? (
            <Button
              fullWidth
              loading={verify.isPending}
              onPress={() => setRzpOpen(true)}
              size="lg">
              {`Pay · ${formatCoursePrice(order.amountPayable, order.currency)}`}
            </Button>
          ) : (
            <Button
              fullWidth
              loading={sandbox.isPending}
              onPress={onSandboxPay}
              size="lg">
              {order.amountPayable === 0
                ? 'Confirm free unlock'
                : `Pay bypass · ${formatCoursePrice(
                    order.amountPayable,
                    order.currency,
                  )}`}
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
        onSuccess={onRazorpayVerified}
        payload={razorpay}
        visible={rzpOpen}
      />

      <JoinToContinueSheet
        message="Create a BIGB account to buy this course. Enrollment follows the same account on web."
        onClose={() => setJoinOpen(false)}
        title="Join to checkout"
        visible={joinOpen}
      />
    </Screen>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.row}>
      <AppText color={bold ? 'primary' : 'muted'} variant="body" weight={bold ? 'bold' : undefined}>
        {label}
      </AppText>
      <AppText variant="body" weight={bold ? 'bold' : 'semibold'}>
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
    paddingHorizontal: s(12),
    paddingBottom: vs(10),
  },
  back: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: s(16),
    paddingBottom: vs(24),
    gap: vs(12),
  },
  hero: {
    flexDirection: 'row',
    gap: s(12),
    alignItems: 'center',
    marginBottom: vs(8),
  },
  thumb: {
    width: s(64),
    height: vs(64),
    borderRadius: ms(12),
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: vs(4),
  },
  totals: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(14),
    padding: s(14),
    gap: vs(8),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: s(12),
  },
  dock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: s(16),
    paddingTop: vs(12),
  },
  success: {
    gap: vs(12),
    paddingTop: vs(24),
    alignItems: 'flex-start',
  },
});
