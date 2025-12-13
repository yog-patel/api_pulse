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

    // GET: List all notification links for a task
 if (req.method === "GET") {
      const url = new URL(req.url);
      const taskId = url.searchParams.get("task_id");

      if (!taskId) {
        return new Response(
          JSON.stringify({ error: "Task ID required" }),
          {
            status: 400,
headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
 );
      }

      // Verify task belongs to user
      const { data: task } = await supabase
     .from("api_tasks")
        .select("id")
        .eq("id", taskId)
    .eq("user_id", user.id)
      .single();

   if (!task) {
 return new Response(JSON.stringify({ error: "Task not found" }), {
       status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
   }

      const { data: notifications, error } = await supabase
        .from("task_notifications")
        .select(`
  *,
       user_integrations (
            id,
            integration_type,
      name,
  is_active
          )
        `)
        .eq("task_id", taskId);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
      }

return new Response(JSON.stringify(notifications), {
        status: 200,
     headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
    }

    // POST: Link task to integration
    if (req.method === "POST") {
      const { task_id, integration_id, notify_on, include_response } = await req.json();

      if (!task_id || !integration_id) {
        return new Response(
     JSON.stringify({ error: "task_id and integration_id are required" }),
          {
      status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
  }
   );
      }

      // Verify task belongs to user
      const { data: task } = await supabase
        .from("api_tasks")
        .select("id, user_id")
        .eq("id", task_id)
    .eq("user_id", user.id)
      .single();

      if (!task) {
      return new Response(
       JSON.stringify({ error: "Task not found or unauthorized" }),
          {
 status: 404,
     headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
      }

      // Verify integration belongs to user
      const { data: integration } = await supabase
      .from("user_integrations")
        .select("id")
        .eq("id", integration_id)
        .eq("user_id", user.id)
 .single();

 if (!integration) {
      return new Response(
          JSON.stringify({ error: "Integration not found or unauthorized" }),
          {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
   }
        );
      }

      // Insert the link
      const { data: link, error } = await supabase
 .from("task_notifications")
  .insert([
    {
task_id,
       integration_id,
       notify_on: notify_on || "always",
   include_response: include_response || false,
          },
   ])
        .select()
  .single();

  if (error) {
        // Check for duplicate
        if (error.code === "23505") {
     return new Response(
 JSON.stringify({ error: "This integration is already linked to this task" }),
    {
       status: 400,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
 }
     );
        }

  return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
      }

      return new Response(JSON.stringify(link), {
     status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE: Unlink task from integration
    if (req.method === "DELETE") {
      const url = new URL(req.url);
      const linkId = url.pathname.split("/").pop();

      if (!linkId || linkId === "link-task-notification") {
 return new Response(
       JSON.stringify({ error: "Link ID required" }),
   {
       status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

      // Verify the link belongs to user's task
      const { data: link } = await supabase
        .from("task_notifications")
        .select(`
          id,
       api_tasks!inner (user_id)
    `)
 .eq("id", linkId)
        .single();

      if (!link || link.api_tasks.user_id !== user.id) {
        return new Response(
     JSON.stringify({ error: "Link not found or unauthorized" }),
 {
            status: 404,
   headers: { ...corsHeaders, "Content-Type": "application/json" },
  }
      );
  }

      const { error } = await supabase
        .from("task_notifications")
        .delete()
        .eq("id", linkId);

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
