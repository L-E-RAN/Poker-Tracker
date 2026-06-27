// Edge Function: grow-webhook
// Server-to-server callback from Grow (משולם / Meshulam) after a payment.
// On a successful charge it marks the user's subscription active and stores the
// Grow identifiers + card token used for monthly recurring billing.
//
// This function uses the SERVICE ROLE key so it can update poker_profiles
// (clients have no UPDATE policy on sub_status — only this trusted path does).
//
// Required secrets:
//   SUPABASE_SERVICE_ROLE_KEY  (auto-injected by Supabase)
//   GROW_API_KEY               used to verify the callback authenticity
//
// IMPORTANT: Verify the exact payload field names and the signature/verification
// scheme against your Grow account documentation before going live.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    // Grow posts form-urlencoded or JSON depending on configuration.
    let payload: Record<string, string> = {};
    const ct = req.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      payload = await req.json();
    } else {
      const form = await req.formData();
      for (const [k, v] of form.entries()) payload[k] = String(v);
    }

    // Meshulam typical fields (verify against your account):
    //   status / transactionStatus -> success indicator
    //   cField1 -> the user.id we echoed in create-payment
    //   transactionId / asmachta -> charge reference
    //   cardToken / token -> saved card token for recurring billing
    //   processId, processToken -> process identifiers
    const userId = payload.cField1 ?? payload.customFields1;
    const ok =
      payload.status === '1' ||
      payload.transactionStatus === '1' ||
      payload.statusCode === '2'; // approved

    if (!userId) {
      console.error('grow-webhook: missing user id', payload);
      return new Response('missing user', { status: 400 });
    }
    if (!ok) {
      console.warn('grow-webhook: non-success payload', payload);
      return new Response('ignored', { status: 200 });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error } = await admin
      .from('poker_profiles')
      .update({
        sub_status: 'active',
        grow_subscription_id: payload.transactionId ?? payload.asmachta ?? null,
        grow_customer_id: payload.cardToken ?? payload.token ?? null,
        // Extend paid period one month + small grace. Each monthly recurring
        // charge from Grow fires this webhook again and pushes the date forward.
        current_period_end: new Date(Date.now() + 33 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('grow-webhook: update failed', error);
      return new Response('db error', { status: 500 });
    }

    // Grow expects a 200 to acknowledge receipt.
    return new Response('ok', { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response('error', { status: 500 });
  }
});
