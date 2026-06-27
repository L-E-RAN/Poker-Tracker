// Edge Function: grow-create-payment
// Builds a Grow (משולם / Meshulam) hosted payment-process link for a recurring
// monthly subscription and returns its URL. The client redirects the user there.
//
// Required function secrets (set with `supabase secrets set` or via dashboard):
//   GROW_BASE_URL   e.g. https://secure.meshulam.co.il/api/light/server/1.0/
//                   (sandbox: https://sandbox.meshulam.co.il/api/light/server/1.0/)
//   GROW_PAGE_CODE  your page code from the Grow dashboard
//   GROW_API_KEY    your API key from the Grow dashboard
//   PUBLIC_SITE_URL the deployed frontend origin, e.g. https://poker.example.com
//
// NOTE: Field names follow the Meshulam "Light Server" API. Verify each field
// against your Grow account documentation before going live.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PRICE_ILS = 10;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    // Authenticate the caller via their Supabase JWT.
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return json({ error: 'unauthorized' }, 401);
    }

    const baseUrl = Deno.env.get('GROW_BASE_URL')!;
    const pageCode = Deno.env.get('GROW_PAGE_CODE')!;
    const apiKey = Deno.env.get('GROW_API_KEY')!;
    const siteUrl = Deno.env.get('PUBLIC_SITE_URL') ?? '';

    // Meshulam Light Server: createPaymentProcess (form-urlencoded).
    // chargeType / recurring: a "direct debit" (הוראת קבע) page issues a token
    // and charges monthly. Configure the page in Grow as a recurring page, or
    // store the returned token and re-charge monthly (see grow-rebill).
    const params = new URLSearchParams({
      pageCode,
      apiKey,
      sum: String(PRICE_ILS),
      currency: '1', // 1 = ILS
      description: 'מנוי חודשי - מעקב פוקר',
      paymentNum: '1',
      maxPaymentNum: '1',
      saveCardToCustomer: '1',         // tokenize for recurring billing
      cField1: user.id,               // echo back in webhook to map the user
      successUrl: `${siteUrl}/?paid=1`,
      cancelUrl: `${siteUrl}/?canceled=1`,
      // notifyUrl is the server-to-server webhook (see grow-webhook):
      notifyUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/grow-webhook`,
    });

    const res = await fetch(`${baseUrl}createPaymentProcess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const data = await res.json();

    // Meshulam returns { status:1, data:{ url, processId, processToken } }
    const url = data?.data?.url;
    if (data?.status !== 1 || !url) {
      console.error('Grow createPaymentProcess failed', data);
      return json({ error: 'grow_error', detail: data }, 502);
    }

    return json({ url });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
