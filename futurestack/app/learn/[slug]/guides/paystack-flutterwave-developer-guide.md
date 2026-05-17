## African Payments: The Developer Landscape in 2026

Integrating payments into a web or mobile application for African markets means choosing between (or combining) two dominant platforms: **Paystack** and **Flutterwave**. Both provide excellent APIs, extensive documentation, and broad African coverage — but they differ in important ways that affect your architecture decisions.

This guide covers both platforms with practical code examples, covers edge cases specific to African payment contexts, and helps you decide which (or both) to use.

---

## Paystack vs. Flutterwave: When to Use Which

### Paystack
- **Best coverage:** Nigeria, Ghana, Kenya, South Africa
- **API quality:** Excellent, clean, well-documented
- **Standout features:** Subscriptions, invoicing, payment pages, splits, transfers
- **Transaction fees (Nigeria):** 1.5% + ₦100 (capped at ₦2,000), international cards: 3.9% + ₦100
- **Owned by:** Stripe (acquired 2020)
- **Use when:** Building for NGN/GHS/KES/ZAR markets with card, bank transfer, or USSD

### Flutterwave
- **Best coverage:** 30+ African countries, plus international
- **API quality:** Good, occasionally more complex than Paystack
- **Standout features:** Mobile money (M-Pesa, MTN, Airtel), broader African reach, USD accounts
- **Transaction fees:** ~1.4% for local cards; varies by country and method
- **Use when:** Building pan-African products, need mobile money, or need USD business accounts

**The common choice:** Use Paystack for your core market (Nigeria or Ghana), add Flutterwave for mobile money and additional countries.

---

## Getting Started with Paystack

### 1. Account Setup and API Keys

Create an account at paystack.com. Navigate to **Settings → API Keys & Webhooks** to get your keys.

You'll have two sets:
- **Test keys** (prefix `sk_test_` and `pk_test_`) — for development
- **Live keys** (prefix `sk_live_` and `pk_live_`) — for production

**Never expose your secret key (`sk_`) in client-side code.** Only your public key (`pk_`) goes in the browser.

### 2. Installing the Paystack Package

```bash
npm install @paystack/inline-js
# or for server-side
npm install paystack
```

### 3. Basic Payment Initialization (Node.js)

```javascript
const https = require('https');

const initializePayment = async (email, amount, currency = 'NGN') => {
  const params = JSON.stringify({
    email,
    amount: amount * 100, // Paystack uses kobo (NGN), pesewas (GHS), or cents (ZAR)
    currency,
    callback_url: 'https://yourapp.com/payment/verify',
    metadata: {
      order_id: 'ORD-001',
      custom_fields: [{
        display_name: 'Order ID',
        variable_name: 'order_id',
        value: 'ORD-001'
      }]
    }
  });

  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/transaction/initialize',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': params.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(params);
    req.end();
  });
};
```

### 4. Frontend Integration (React)

```jsx
import { usePaystackPayment } from 'react-paystack';

const PaymentButton = ({ email, amount, onSuccess, onClose }) => {
  const config = {
    reference: `ref-${Date.now()}`,
    email,
    amount: amount * 100, // in kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_KEY,
    currency: 'NGN',
  };

  const initializePayment = usePaystackPayment(config);

  return (
    <button
      onClick={() => {
        initializePayment(onSuccess, onClose);
      }}
      className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium"
    >
      Pay ₦{amount.toLocaleString()}
    </button>
  );
};
```

### 5. Verifying Payments (Critical Step)

Never trust the frontend to confirm a payment. Always verify on your server using the reference:

```javascript
const verifyPayment = async (reference) => {
  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: `/transaction/verify/${reference}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const response = JSON.parse(data);
        if (response.data.status === 'success') {
          resolve(response.data);
        } else {
          reject(new Error('Payment verification failed'));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
};
```

---

## Webhooks: The Most Important Part

Webhooks are how Paystack tells your server about payment events asynchronously. This is critical for handling:
- Delayed bank transfers
- Subscription renewals
- Refunds
- Chargebacks

### Setting Up Webhooks

In your Paystack dashboard: **Settings → API Keys & Webhooks → Webhook URL**. Set your endpoint URL.

### Webhook Handler (Express.js)

```javascript
const crypto = require('crypto');
const express = require('express');
const router = express.Router();

router.post('/webhook/paystack', express.raw({ type: 'application/json' }), async (req, res) => {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(req.body)
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).send('Unauthorized');
  }

  const event = JSON.parse(req.body);

  switch (event.event) {
    case 'charge.success':
      await handleSuccessfulPayment(event.data);
      break;
    case 'transfer.success':
      await handleSuccessfulTransfer(event.data);
      break;
    case 'subscription.create':
      await handleNewSubscription(event.data);
      break;
    case 'subscription.disable':
      await handleCancelledSubscription(event.data);
      break;
    default:
      console.log(`Unhandled event: ${event.event}`);
  }

  res.status(200).send('OK');
});
```

---

## Flutterwave Integration

### Basic Setup

```bash
npm install flutterwave-node-v3
```

```javascript
const Flutterwave = require('flutterwave-node-v3');
const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);
```

### Initiating a Mobile Money Payment (M-Pesa)

```javascript
const initiateMpesaPayment = async (phone, amount, email) => {
  const payload = {
    type: 'mpesa',
    amount,
    currency: 'KES',
    email,
    phone_number: phone, // format: 0722000000
    fullname: 'Customer Name',
    client_ip: '192.168.0.1',
    device_fingerprint: 'fingerprint',
    meta: {
      order_id: 'ORD-001'
    },
    redirect_url: 'https://yourapp.com/payment/complete'
  };

  try {
    const response = await flw.MobileMoney.mpesa(payload);
    return response;
  } catch (error) {
    throw new Error(`M-Pesa payment failed: ${error.message}`);
  }
};
```

---

## Handling African Payment Edge Cases

### 1. Bank Transfer Delays
African bank transfers (especially USSD-initiated) can take 15 minutes to 24 hours to confirm. Never block user experience waiting for confirmation. Instead:
- Show "Payment Pending" state immediately
- Process via webhook when payment confirms
- Send SMS/email confirmation to user when payment arrives

### 2. Currency Handling
**Always store amounts in the smallest currency unit** (kobo for NGN, pesewas for GHS, cents for USD). This avoids floating point errors.

```javascript
// Safe: store in kobo
const amountInKobo = Math.round(nairaAmount * 100);

// Dangerous: never do this
const amountInNaira = 1500.50; // floating point issues
```

### 3. Idempotency
Prevent duplicate charges by using unique, deterministic references:

```javascript
// Good: order-based reference
const reference = `order-${orderId}-${timestamp}`;

// Bad: random reference (can't detect duplicates)
const reference = Math.random().toString(36).substring(7);
```

### 4. Test Mode Thoroughly
Paystack provides test card numbers for different scenarios:
- **Successful payment:** 4084 0840 8408 4081
- **Declined:** 4084 0840 8408 4084
- **Insufficient funds:** 4084 0840 8408 4085

Always test failed payments — they're more common than developers expect in African markets.

---

## Going Live Checklist

Before switching to live keys:

- [ ] All webhook events handled (charge.success, failed, reversed)
- [ ] Payment verification implemented server-side (not just frontend callback)
- [ ] Currency stored as integers (kobo/pesewas/cents), not decimals
- [ ] Error states displayed clearly to users
- [ ] Retry logic for network timeouts
- [ ] Live keys in environment variables, not hardcoded
- [ ] Webhook endpoint secured with signature verification
- [ ] Test all payment methods you intend to support (card, bank transfer, USSD)
- [ ] Payout/transfer account configured in dashboard
