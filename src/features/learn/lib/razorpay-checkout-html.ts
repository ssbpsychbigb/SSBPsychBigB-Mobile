/**
 * Standard Razorpay Checkout.js page for an in-app WebView.
 */

import type { RazorpayCheckoutPayload } from '@/features/learn/types/course.types';

export function buildRazorpayCheckoutHtml(
  payload: RazorpayCheckoutPayload,
): string {
  const options = {
    key: payload.keyId,
    amount: payload.amountPaise,
    currency: payload.currency || 'INR',
    name: payload.name,
    description: payload.description,
    order_id: payload.orderId,
    prefill: payload.prefill || {},
    theme: { color: '#1877F2' },
  };

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <title>Pay</title>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  </head>
  <body style="margin:0;background:#F7F8FA;font-family:system-ui,sans-serif;">
    <p id="status" style="padding:24px;color:#555;font-size:15px;">Opening Razorpay…</p>
    <script>
      function send(payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }
      try {
        var options = ${JSON.stringify(options)};
        options.handler = function (response) {
          send({ ok: true, response: response });
        };
        options.modal = {
          ondismiss: function () {
            send({ ok: false, dismissed: true });
          }
        };
        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          send({
            ok: false,
            error: (resp && resp.error && resp.error.description) || 'Payment failed',
          });
        });
        rzp.open();
        document.getElementById('status').textContent = 'Complete payment in the Razorpay sheet.';
      } catch (err) {
        send({ ok: false, error: String(err && err.message ? err.message : err) });
      }
    </script>
  </body>
</html>`;
}
