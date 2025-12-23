import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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

    const url = new URL(req.url);
    const integrationId = url.pathname.split("/").pop();

// GET: List all integrations for the user
    if (req.method === "GET") {
      const { data: integrations, error } = await supabase
        .from("user_integrations")
      .select("*")
 .eq("user_id", user.id)
    .order("created_at", { ascending: false });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(integrations), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST: Create new integration
    if (req.method === "POST") {
      const { integration_type, name, credentials } = await req.json();

  // Validate required fields
      if (!integration_type || !name || !credentials) {
        return new Response(
     JSON.stringify({ error: "Missing required fields" }),
        {
      status: 400,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     }
   );
      }

      // Validate integration type
      const validTypes = ["email", "slack", "webhook", "discord"];
    if (!validTypes.includes(integration_type)) {
        return new Response(
          JSON.stringify({ error: "Invalid integration type" }),
  {
status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
 );
  }

      // Fetch user's plan to check restrictions
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("plan_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch user plan" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const planId = profile.plan_id || "free";

      // Check plan restrictions for email integration (Pro only)
      if (integration_type === "email") {
        if (planId !== "pro") {
          return new Response(
            JSON.stringify({ 
              error: "Email notifications are only available on the Pro plan. Please upgrade to use this feature." 
            }),
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      // Check plan restrictions for Slack and Discord (Starter+ only)
      if (integration_type === "slack" || integration_type === "discord") {
        if (planId === "free") {
          return new Response(
            JSON.stringify({ 
              error: `${integration_type.charAt(0).toUpperCase() + integration_type.slice(1)} notifications are only available on Starter and Pro plans. Please upgrade to use this feature.` 
            }),
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      // Check plan restrictions for custom webhooks (Pro only)
      if (integration_type === "webhook") {
        if (planId !== "pro") {
          return new Response(
            JSON.stringify({ 
              error: "Custom webhooks are only available on the Pro plan. Please upgrade to use this feature." 
            }),
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      // Validate credentials based on type
      if (integration_type === "slack" && !credentials.webhook_url) {
        return new Response(
          JSON.stringify({ error: "Slack webhook URL is required" }),
   {
       status: 400,
     headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
   );
      }

      if (integration_type === "discord" && !credentials.webhook_url) {
     return new Response(
 JSON.stringify({ error: "Discord webhook URL is required" }),
          {
       status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
   }
);
    }

      if (integration_type === "webhook" && !credentials.webhook_url) {
        return new Response(
          JSON.stringify({ error: "Webhook URL is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

    if (integration_type === "email" && !credentials.email) {
        return new Response(
      JSON.stringify({ error: "Email address is required" }),
    {
   status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
  }

      // Validate email format
      if (integration_type === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(credentials.email)) {
   return new Response(
            JSON.stringify({ error: "Invalid email address format" }),
     {
       status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
     }
          );
   }
 }

      // Test the integration before saving (for Slack)
      if (integration_type === "slack") {
        try {
          const testResponse = await fetch(credentials.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
  text: "?? API Pulse integration test successful! Your notifications are now active.",
     }),
  });

          if (!testResponse.ok) {
      return new Response(
       JSON.stringify({
     error: "Invalid Slack webhook URL. Please check and try again.",
         }),
 {
          status: 400,
     headers: { ...corsHeaders, "Content-Type": "application/json" },
         }
);
          }
        } catch (error) {
          return new Response(
 JSON.stringify({
error: "Failed to test Slack webhook. Please verify the URL.",
          }),
            {
           status: 400,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
   }
          );
        }
      }

      // Test the integration before saving (for Discord)
      if (integration_type === "discord") {
        try {
          const testResponse = await fetch(credentials.webhook_url, {
    method: "POST",
     headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
   content: "?? API Pulse integration test successful! Your Discord notifications are now active.",
     }),
  });

   if (!testResponse.ok) {
       const errorText = await testResponse.text();
          console.error("Discord webhook test failed:", testResponse.status, errorText);
 return new Response(
       JSON.stringify({
  error: `Invalid Discord webhook URL. Status: ${testResponse.status}. Please check and try again.`,
}),
     {
              status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
   );
    }
        } catch (error) {
   console.error("Discord webhook test error:", error);
          return new Response(
  JSON.stringify({
  error: `Failed to test Discord webhook: ${error instanceof Error ? error.message : 'Unknown error'}. Please verify the URL.`,
     }),
         {
      status: 400,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
     );
        }
      }

      // Test the integration before saving (for Custom Webhooks)
      if (integration_type === "webhook") {
        try {
          const testPayload = {
            test: true,
            message: "API Pulse webhook integration test successful! Your notifications are now active.",
            timestamp: new Date().toISOString(),
          };

          const testResponse = await fetch(credentials.webhook_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(testPayload),
          });

          if (!testResponse.ok) {
            const errorText = await testResponse.text();
            console.error("Webhook test failed:", testResponse.status, errorText);
            return new Response(
              JSON.stringify({
                error: `Invalid webhook URL. Status: ${testResponse.status}. Please check and try again.`,
              }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        } catch (error) {
          console.error("Webhook test error:", error);
          return new Response(
            JSON.stringify({
              error: `Failed to test webhook: ${error instanceof Error ? error.message : 'Unknown error'}. Please verify the URL.`,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      // Insert integration
      const { data: integration, error } = await supabase
        .from("user_integrations")
        .insert([
          {
   user_id: user.id,
  integration_type,
    name,
    credentials,
       is_active: true,
          },
        ])
   .select()
   .single();

 if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

      return new Response(JSON.stringify(integration), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE: Remove integration
    if (req.method === "DELETE") {
      if (!integrationId || integrationId === "manage-integrations") {
        return new Response(
          JSON.stringify({ error: "Integration ID required" }),
   {
            status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
 );
      }

      const { error } = await supabase
        .from("user_integrations")
        .delete()
    .eq("id", integrationId)
        .eq("user_id", user.id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
   }

      return new Response(JSON.stringify({ success: true }), {
    status: 200,
     headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
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
