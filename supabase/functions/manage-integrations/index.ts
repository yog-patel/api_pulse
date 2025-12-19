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
      const validTypes = ["email", "slack", "sms", "webhook", "discord"];
    if (!validTypes.includes(integration_type)) {
        return new Response(
          JSON.stringify({ error: "Invalid integration type" }),
  {
status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
 );
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
  text: "? API Pulse integration test successful! Your notifications are now active.",
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
      if (integration_type === "discord" && credentials.webhook_url) {
        try {
          const testResponse = await fetch(credentials.webhook_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
       content: "?? API Pulse integration test successful! Your Discord notifications are now active.",
     }),
  });

          if (!testResponse.ok) {
 return new Response(
       JSON.stringify({
  error: "Invalid Discord webhook URL. Please check and try again.",
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
      error: "Failed to test Discord webhook. Please verify the URL.",
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
