import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;

    console.log("=== Stripe Checkout Session Request ===");
    console.log("Supabase URL configured:", !!supabaseUrl);
    console.log("Supabase Key configured:", !!supabaseKey);
    console.log("Stripe Secret Key configured:", !!stripeSecretKey);

    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Stripe secret key not configured. Please add STRIPE_SECRET_KEY to Netlify environment variables." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { priceId, planId } = await req.json();

    if (!priceId || !planId) {
      return new Response(
        JSON.stringify({ error: "priceId and planId are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate plan
    const validPlans = ["starter", "pro"];
    if (!validPlans.includes(planId)) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .single();

    // Create or get Stripe customer
    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      console.log("Creating new Stripe customer for user:", user.id);
      // Create Stripe customer
      const customerResponse = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: profile?.email || user.email || "",
          "metadata[user_id]": user.id,
        }),
      });

      if (!customerResponse.ok) {
        const error = await customerResponse.text();
        console.error("Stripe customer creation failed:", error);
        return new Response(
          JSON.stringify({ error: `Failed to create Stripe customer: ${error}` }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const customer = await customerResponse.json();
      customerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Create checkout session
    const sessionResponse = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          customer: customerId,
          mode: "subscription",
          "line_items[0][price]": priceId,
          "line_items[0][quantity]": "1",
          success_url: `${Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://api-pulse.netlify.app"}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://api-pulse.netlify.app"}`,
          "metadata[user_id]": user.id,
          "metadata[plan_id]": planId,
        }),
      }
    );

    if (!sessionResponse.ok) {
      const error = await sessionResponse.text();
      console.error("Stripe checkout error status:", sessionResponse.status);
      console.error("Stripe checkout error response:", error);
      console.error("Request body was:", {
        customer: customerId,
        mode: "subscription",
        priceId,
        planId,
      });
      return new Response(
        JSON.stringify({ error: `Failed to create checkout session: ${error}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const session = await sessionResponse.json();

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

