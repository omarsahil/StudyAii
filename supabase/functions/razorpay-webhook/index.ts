import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Set your Razorpay secret in the Edge Function environment variables
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

// Helper: Verify Razorpay signature (optional, but recommended for security)
function verifySignature(body: string, signature: string, secret: string) {
  const encoder = new TextEncoder();
  const cryptoKey = encoder.encode(secret);
  const hmac = new Uint8Array(
    Array.from(
      crypto.subtle
        .importKey("raw", cryptoKey, { name: "HMAC", hash: "SHA-256" }, false, [
          "sign",
          "verify",
        ])
        .then((key) => crypto.subtle.sign("HMAC", key, encoder.encode(body)))
    )
  );
  // You can implement signature verification here if needed
  // For now, this is a placeholder (Razorpay sends x-razorpay-signature header)
  return true;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Read the raw body for signature verification
  const rawBody = await req.text();
  const body = JSON.parse(rawBody);

  // Optional: Verify Razorpay signature
  // const signature = req.headers.get("x-razorpay-signature") || "";
  // if (!verifySignature(rawBody, signature, RAZORPAY_KEY_SECRET!)) {
  //   return new Response("Invalid signature", { status: 400 });
  // }

  // Extract info from Razorpay webhook payload
  // You must pass Clerk user_id and plan in the notes field when creating the order
  const { payload } = body;
  const payment = payload?.payment?.entity;
  const razorpay_payment_id = payment?.id;
  const notes = payment?.notes || {};
  const status = payment?.status;

  if (!notes.user_id || !notes.plan) {
    return new Response("Missing user_id or plan in notes", { status: 400 });
  }

  if (status !== "captured") {
    return new Response("Payment not captured", { status: 400 });
  }

  // Update user_plans table in Supabase
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const { createClient } = await import(
    "https://esm.sh/@supabase/supabase-js@2.39.7"
  );
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase.from("user_plans").upsert(
    {
      user_id: notes.user_id,
      plan: notes.plan,
      razorpay_payment_id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return new Response("Database error: " + error.message, { status: 500 });
  }

  return new Response("OK", { status: 200 });
});
