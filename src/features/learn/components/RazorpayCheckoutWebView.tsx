/**
 * In-app Razorpay Checkout.js. Live keys only — sandbox uses Pay bypass.
 */

import { Modal, StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';

import { buildRazorpayCheckoutHtml } from '@/features/learn/lib/razorpay-checkout-html';
import type { RazorpayCheckoutPayload } from '@/features/learn/types/course.types';
import { useScreenTopPadding } from '@/shared/lib/safe-area';
import { AppText, Button } from '@/shared/ui';

export type RazorpayCheckoutWebViewProps = {
  payload: RazorpayCheckoutPayload | null;
  visible: boolean;
  onClose: () => void;
  onSuccess: (input: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  onError: (message: string) => void;
};

type CheckoutMessage = {
  ok?: boolean;
  dismissed?: boolean;
  error?: string;
  response?: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
};

/**
 * Full-screen WebView that opens Razorpay’s native-like checkout modal.
 */
export function RazorpayCheckoutWebView({
  payload,
  visible,
  onClose,
  onSuccess,
  onError,
}: RazorpayCheckoutWebViewProps) {
  const topPad = useScreenTopPadding();

  if (!visible || !payload) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
      visible={visible}>
      <View style={styles.frame}>
        <View style={[styles.bar, { paddingTop: topPad }]}>
          <AppText variant="label" weight="bold">
            Razorpay
          </AppText>
          <Button onPress={onClose} size="sm" variant="ghost">
            Close
          </Button>
        </View>
        <WebView
          javaScriptEnabled
          originWhitelist={['*']}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data) as CheckoutMessage;
              if (data.ok && data.response?.razorpay_payment_id) {
                onSuccess({
                  razorpay_order_id: data.response.razorpay_order_id || payload.orderId,
                  razorpay_payment_id: data.response.razorpay_payment_id,
                  razorpay_signature: data.response.razorpay_signature || '',
                });
                return;
              }
              if (data.dismissed) {
                onClose();
                return;
              }
              onError(data.error || 'Payment was not completed');
            } catch {
              onError('Could not read Razorpay response');
            }
          }}
          source={{
            html: buildRazorpayCheckoutHtml(payload),
            baseUrl: 'https://checkout.razorpay.com',
          }}
          style={styles.web}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  web: {
    flex: 1,
  },
});
