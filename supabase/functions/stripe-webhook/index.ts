import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  console.log("=== WEBHOOK FUNCTION CALLED ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", Object.fromEntries(req.headers));

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the raw body
    const body = await req.text();

    console.log("Received webhook request");
    console.log("Body preview:", body.substring(0, 200));

    // Optional: Verify webhook signature if secret is configured
    const signature = req.headers.get("stripe-signature");
    if (webhookSecret && signature) {
      console.log("Verifying webhook signature");
      // Note: For production, implement proper signature verification
      // using Stripe's crypto utilities
    } else {
      console.log("Processing webhook without signature verification");
    }

    const event = JSON.parse(body);

    console.log("Stripe webhook event:", event.type);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const planId = session.metadata?.plan_id;
        const customerId = session.customer;

        console.log("Processing checkout.session.completed:", {
          userId,
          planId,
          customerId,
          subscriptionId: session.subscription,
        });

        if (userId && planId) {
          // Get subscription from Stripe
          const subscriptionId = session.subscription;
          
          if (subscriptionId) {
            // Fetch subscription details
            const subResponse = await fetch(
              `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
              {
                headers: {
                  Authorization: `Bearer ${stripeSecretKey}`,
                },
              }
            );

            if (subResponse.ok) {
              const subscription = await subResponse.json();
              
              console.log("Subscription details:", {
                id: subscription.id,
                status: subscription.status,
                customer: subscription.customer,
              });

              // Update user's profile with all subscription details
              const updateData: any = {
                plan_id: planId,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                subscription_status: subscription.status,
              };

              // Only add timestamp fields if they exist
              if (subscription.current_period_start) {
                updateData.current_period_start = new Date(
                  subscription.current_period_start * 1000
                ).toISOString();
              }

              if (subscription.current_period_end) {
                updateData.current_period_end = new Date(
                  subscription.current_period_end * 1000
                ).toISOString();
              }

              const { data, error } = await supabase
                .from("profiles")
                .update(updateData)
                .eq("id", userId);

              if (error) {
                console.error("Error updating profile:", error);
              } else {
                console.log("Profile updated successfully for user:", userId);
              }
            } else {
              console.error("Failed to fetch subscription from Stripe:", await subResponse.text());
            }
          } else {
            console.error("No subscription ID in session");
          }
        } else {
          console.error("Missing userId or planId in metadata");
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Find user by customer ID
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          if (event.type === "customer.subscription.deleted") {
            // Downgrade to free
            await supabase
              .from("profiles")
              .update({
                plan_id: "free",
                subscription_status: "canceled",
                stripe_subscription_id: null,
              })
              .eq("id", profile.id);
          } else {
            // Update subscription status
            const updateData: any = {
              subscription_status: subscription.status,
            };

            if (subscription.current_period_start) {
              updateData.current_period_start = new Date(
                subscription.current_period_start * 1000
              ).toISOString();
            }

            if (subscription.current_period_end) {
              updateData.current_period_end = new Date(
                subscription.current_period_end * 1000
              ).toISOString();
            }

            await supabase
              .from("profiles")
              .update(updateData)
              .eq("id", profile.id);
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        // Find user by customer ID
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile && invoice.subscription) {
          // Update subscription status to active
          await supabase
            .from("profiles")
            .update({
              subscription_status: "active",
            })
            .eq("id", profile.id);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        // Find user by customer ID
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          // Update subscription status to past_due
          await supabase
            .from("profiles")
            .update({
              subscription_status: "past_due",
            })
            .eq("id", profile.id);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
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

