# 💳 Payment Setup Guide - Step by Step

This guide will walk you through setting up Stripe payments for API Pulse.

## Prerequisites

- ✅ Code pushed to repository
- ✅ Supabase project set up
- ✅ Stripe account (create one at [stripe.com](https://stripe.com) if needed)

---

## Step 1: Create Stripe Products & Prices

1. **Go to Stripe Dashboard**
   - Visit [https://dashboard.stripe.com](https://dashboard.stripe.com)
   - Make sure you're in **Test mode** for development (toggle in top right)

2. **Create Starter Plan Product**
   - Click **Products** in left sidebar
   - Click **+ Add product**
   - Name: `Starter Plan`
   - Description: `Great for small teams and startups`
   - Pricing model: **Recurring**
   - Price: `$9.00 USD`
   - Billing period: **Monthly**
   - Click **Save product**
   - **Copy the Price ID** (starts with `price_...`) - you'll need this!

3. **Create Pro Plan Product**
   - Click **+ Add product** again
   - Name: `Pro Plan`
   - Description: `Full-featured for production monitoring`
   - Pricing model: **Recurring**
   - Price: `$15.00 USD`
   - Billing period: **Monthly**
   - Click **Save product**
   - **Copy the Price ID** (starts with `price_...`) - you'll need this!

---

## Step 2: Get Stripe API Keys

1. **Go to API Keys**
   - In Stripe Dashboard, click **Developers** → **API keys**

2. **Copy Keys**
   - **Publishable key** (starts with `pk_test_...` or `pk_live_...`)
   - **Secret key** (starts with `sk_test_...` or `sk_live_...`)
     - Click **Reveal test key** to see it
     - ⚠️ Keep this secret! Never commit it to git.

---

## Step 3: Set Up Stripe Webhook

1. **Go to Webhooks**
   - In Stripe Dashboard, click **Developers** → **Webhooks**
   - Click **+ Add endpoint**

2. **Configure Webhook**
   - **Endpoint URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
     - Replace `YOUR_PROJECT_REF` with your Supabase project reference
     - You can find it in Supabase Dashboard → Settings → API → Project URL
     - Example: `https://abcdefghijklmnop.supabase.co/functions/v1/stripe-webhook`

3. **Select Events**
   - Click **Select events**
   - Choose these events:
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`
   - Click **Add events**

4. **Save and Copy Secret**
   - Click **Add endpoint**
   - Click on the webhook you just created
   - Click **Reveal** next to "Signing secret"
   - **Copy the signing secret** (starts with `whsec_...`) - you'll need this!

---

## Step 4: Deploy Edge Functions

### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy checkout function
supabase functions deploy create-checkout-session

# Deploy webhook handler
supabase functions deploy stripe-webhook
```

### Option B: Using Supabase Dashboard

1. **Go to Edge Functions**
   - In Supabase Dashboard → **Edge Functions**

2. **Deploy create-checkout-session**
   - Click **Create a new function**
   - Name: `create-checkout-session`
   - Copy contents from `supabase/functions/create-checkout-session/index.ts`
   - Paste into the editor
   - Click **Deploy**

3. **Deploy stripe-webhook**
   - Click **Create a new function**
   - Name: `stripe-webhook`
   - Copy contents from `supabase/functions/stripe-webhook/index.ts`
   - Paste into the editor
   - Click **Deploy**

---

## Step 5: Set Environment Variables

### In Supabase Dashboard

1. **Go to Project Settings**
   - Supabase Dashboard → **Settings** → **Edge Functions**

2. **Add Secrets**
   - Click **Add new secret**
   - Add these secrets:
     - **Name**: `STRIPE_SECRET_KEY`
     - **Value**: Your Stripe secret key (from Step 2)
     - Click **Save**

     - **Name**: `STRIPE_WEBHOOK_SECRET`
     - **Value**: Your webhook signing secret (from Step 3)
     - Click **Save**

### In Frontend (Vercel/Netlify or .env.local)

1. **Add to `.env.local` (for local development)**
   ```bash
   NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_...
   NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

2. **Add to Vercel/Netlify Environment Variables (for production)**
   - Go to your deployment platform's environment variables
   - Add the same variables as above
   - For production, set `NEXT_PUBLIC_SITE_URL` to your actual domain

---

## Step 6: Test the Integration

### Test Mode (Recommended First)

1. **Use Test Mode**
   - Make sure Stripe Dashboard is in **Test mode** (toggle in top right)
   - Use test API keys (start with `sk_test_` and `pk_test_`)

2. **Test Checkout Flow**
   - Go to your app's pricing page
   - Click "Get Started" on Starter or Pro plan
   - You should be redirected to Stripe Checkout
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date (e.g., 12/34)
   - Any 3-digit CVC
   - Any ZIP code
   - Complete the checkout

3. **Verify Webhook**
   - Go to Stripe Dashboard → **Developers** → **Webhooks**
   - Click on your webhook
   - Check **Events** tab - you should see events being received
   - Check for any errors

4. **Verify Database Update**
   - Go to Supabase Dashboard → **Table Editor** → `profiles`
   - Find your user
   - Check that `plan_id` is updated to `starter` or `pro`
   - Check that `stripe_customer_id` and `stripe_subscription_id` are set
   - Check that `subscription_status` is `active`

5. **Test Billing Page**
   - Go to `/dashboard/billing`
   - You should see your current plan
   - Subscription details should be displayed

---

## Step 7: Switch to Production (When Ready)

1. **Switch Stripe to Live Mode**
   - In Stripe Dashboard, toggle to **Live mode**
   - Create products again in Live mode (or copy from Test)
   - Get Live API keys

2. **Update Environment Variables**
   - Update `STRIPE_SECRET_KEY` to live key (starts with `sk_live_`)
   - Update webhook endpoint to use live mode
   - Update frontend price IDs to live price IDs

3. **Update Webhook**
   - Create a new webhook endpoint for Live mode
   - Or update existing one to handle both test and live

---

## Troubleshooting

### Checkout Not Working

- ✅ Check that `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID` and `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` are set
- ✅ Check browser console for errors
- ✅ Verify Edge Function is deployed
- ✅ Check Supabase Edge Function logs for errors

### Webhook Not Receiving Events

- ✅ Verify webhook URL is correct
- ✅ Check that webhook secret is set in Supabase
- ✅ Check Stripe Dashboard → Webhooks → Events for delivery status
- ✅ Check Supabase Edge Function logs

### Subscription Not Updating

- ✅ Check webhook events in Stripe Dashboard
- ✅ Check Supabase Edge Function logs
- ✅ Verify database permissions (RLS policies)
- ✅ Check that `stripe-webhook` function has service role access

### Common Errors

**"Stripe secret key not configured"**
- Solution: Add `STRIPE_SECRET_KEY` to Supabase Edge Function secrets

**"Invalid price ID"**
- Solution: Check that price IDs match your Stripe products

**"Webhook signature verification failed"**
- Solution: Verify `STRIPE_WEBHOOK_SECRET` is correct

---

## Quick Checklist

- [ ] Created Stripe products (Starter & Pro)
- [ ] Copied Price IDs
- [ ] Got Stripe API keys
- [ ] Set up webhook endpoint
- [ ] Copied webhook signing secret
- [ ] Deployed `create-checkout-session` function
- [ ] Deployed `stripe-webhook` function
- [ ] Added `STRIPE_SECRET_KEY` to Supabase secrets
- [ ] Added `STRIPE_WEBHOOK_SECRET` to Supabase secrets
- [ ] Added price IDs to frontend `.env.local`
- [ ] Added `NEXT_PUBLIC_SITE_URL` to frontend `.env.local`
- [ ] Tested checkout flow with test card
- [ ] Verified webhook events are received
- [ ] Verified database updates correctly

---

## Need Help?

- Check Supabase Edge Function logs: Dashboard → Edge Functions → Select function → Logs
- Check Stripe Dashboard → Developers → Logs for API errors
- Check browser console for frontend errors
- Review the [Stripe Documentation](https://stripe.com/docs)

---

## Next Steps After Setup

Once payments are working:
1. Test upgrade/downgrade flows
2. Test subscription cancellation
3. Set up email notifications for payment events (optional)
4. Monitor subscription metrics in Stripe Dashboard
5. Set up Stripe billing portal for customer self-service (optional)

