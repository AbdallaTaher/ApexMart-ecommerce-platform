# Stripe CLI Webhook Simulation & Testing Guide

This guide walks you through setting up and running real-time Stripe Webhook simulations for **ApexMart E-Commerce Platform**, verifying payment reconciliation, idempotency, and automatic inventory stock rollbacks (Security Modules 04 & 05).

---

## 1. Prerequisites & Stripe CLI Installation

The [Stripe CLI](https://stripe.com/docs/stripe-cli) lets you listen for and trigger webhook events directly on your local `localhost:5000` development server.

### Windows (Option A - Scoop / Chocolatey)
```powershell
# Using Scoop
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Or using Chocolatey
choco install stripe-cli
```

### Windows (Option B - Direct Binary)
1. Download the latest `stripe_X.X.X_windows_x86_64.zip` from the [official Stripe CLI GitHub releases](https://github.com/stripe/stripe-cli/releases/latest).
2. Extract `stripe.exe` and place it in a folder in your `PATH` (e.g. `C:\Windows\System32` or your development tools folder).

### macOS
```bash
brew install stripe/stripe-cli/stripe
```

### Linux
```bash
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt-get update
sudo apt-get install stripe
```

---

## 2. Authentication with Stripe

Run the following command in your terminal to pair the CLI with your free Stripe account (Test Mode):

```bash
stripe login
```

- Follow the on-screen link in your browser and click **"Allow access"**.
- Your CLI will be authenticated to generate test events against your test environment.

---

## 3. Forwarding Webhooks to ApexMart Backend

ApexMart's webhook listener is mounted at:
`http://localhost:5000/api/v1/orders/webhook-checkout`

In a new terminal window, start forwarding:

```bash
stripe listen --forward-to localhost:5000/api/v1/orders/webhook-checkout
```

### Sample Output:
```text
> Ready! You are using Stripe API Version [2024-04-10].
> Your webhook signing secret is whsec_4d99c43a8549... (^C to quit)
```

> [!IMPORTANT]
> Copy the `whsec_...` signing secret printed by the CLI and update `STRIPE_WEBHOOK_SECRET` in `backend/config.env`:
> ```env
> STRIPE_WEBHOOK_SECRET=whsec_4d99c43a8549...
> ```
> Nodemon will automatically restart the backend with your active secret.

---

## 4. Simulating Webhook Events

Open a separate terminal window and run the commands below to simulate payment scenarios:

### Scenario A: Successful Payment (`payment_intent.succeeded`)
```bash
stripe trigger payment_intent.succeeded
```
**What happens in the system:**
1. Stripe generates a valid HMAC signature and delivers the event to `/api/v1/orders/webhook-checkout`.
2. The listener verifies the signature cryptographically.
3. The order payment status is updated from `pending` $\rightarrow$ `paid`.
4. The order status is advanced to `processing`.
5. The `paidAt` timestamp is recorded.
6. The server returns `200 {"received": true}`.

---

### Scenario B: Payment Failure & Inventory Restitution (`payment_intent.payment_failed`)
```bash
stripe trigger payment_intent.payment_failed
```
**What happens in the system (ACID Stock Rollback):**
1. Stripe delivers the failure event.
2. The order is reconciled to `paymentStatus: failed` and `orderStatus: cancelled`.
3. The exact decline reason (`paymentIntent.last_payment_error.message`) is saved to `cancellationReason`.
4. **Automatic Stock Rollback:** The quantity of all reserved items is atomically incremented back into inventory (`$inc: { stock: quantity }`).
5. **Catalog Cache Eviction:** `catalogCache.clear()` is triggered so the restored stock is immediately purchasable on the storefront.
6. **Idempotency Guard:** If Stripe retries the failed event, the system detects the order is already cancelled and prevents duplicate stock restitution.

---

## 5. Postman Direct Simulation (Without Stripe CLI)

If you don't have the Stripe CLI installed, you can still test signature verification directly in Postman:

1. **Method:** `POST`
2. **URL:** `http://localhost:5000/api/v1/orders/webhook-checkout`
3. **Headers:**
   - `Content-Type: application/json`
   - `stripe-signature: t=123,v1=tampered_signature`
4. **Body (Raw JSON):**
   ```json
   {
     "type": "payment_intent.succeeded",
     "data": {
       "object": {
         "id": "pi_12345"
       }
     }
   }
   ```
5. **Expected Response:**
   - Status: `400 Bad Request`
   - Message: `Webhook Signature Verification Error: No signatures found matching the expected signature for payload...`
