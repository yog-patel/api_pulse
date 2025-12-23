import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
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

    const {
      task_name,
      api_url,
      method = "GET",
      request_headers = {},
      request_body,
      schedule_interval,
    } = await req.json();

    // Validate required fields
    if (!task_name || !api_url || !schedule_interval) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: task_name, api_url, schedule_interval",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user's plan to validate interval
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_id")
      .eq("id", user.id)
      .single();

    const planId = profile?.plan_id || "free";

    // Validate interval based on plan limits
    const intervalMatch = schedule_interval.match(/^(\d+)([mhd])$/);
    if (!intervalMatch) {
      return new Response(
        JSON.stringify({
          error: "Invalid interval format. Use: 5m, 1h, 1d, etc.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const [, count, unit] = intervalMatch;
    const numCount = parseInt(count, 10);
    let intervalMinutes = 0;

    switch (unit) {
      case "m":
        intervalMinutes = numCount;
        break;
      case "h":
        intervalMinutes = numCount * 60;
        break;
      case "d":
        intervalMinutes = numCount * 1440;
        break;
    }

    // Plan limits (matching lib/plans.ts)
    const planLimits: Record<string, number> = {
      free: 60,      // 1 hour
      starter: 15,   // 15 minutes
      pro: 5,         // 5 minutes
    };

    const minIntervalMinutes = planLimits[planId] || 60;

    if (intervalMinutes < minIntervalMinutes) {
      return new Response(
        JSON.stringify({
          error: `Your ${planId} plan requires a minimum interval of ${minIntervalMinutes} minutes. Please increase the interval or upgrade your plan.`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate next_run_at based on schedule_interval
    const now = new Date();
    const nextRunAt = calculateNextRunTime(now, schedule_interval);

    const { data, error } = await supabase.from("api_tasks").insert([
      {
        user_id: user.id,
        task_name,
        api_url,
        method,
        request_headers,
        request_body,
        schedule_interval,
        next_run_at: nextRunAt.toISOString(),
        created_by: user.id,
      },
    ]);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function calculateNextRunTime(baseTime: Date, interval: string): Date {
  const next = new Date(baseTime);

  const match = interval.match(/^(\d+)([mhd])$/);
  if (!match) {
    throw new Error("Invalid interval format. Use: 5m, 1h, 1d, etc.");
  }

  const [, count, unit] = match;
  const numCount = parseInt(count, 10);

  switch (unit) {
    case "m":
      next.setMinutes(next.getMinutes() + numCount);
      break;
    case "h":
      next.setHours(next.getHours() + numCount);
      break;
    case "d":
      next.setDate(next.getDate() + numCount);
      break;
    default:
      throw new Error("Invalid interval unit. Use: m (minutes), h (hours), d (days)");
  }

  return next;
}
