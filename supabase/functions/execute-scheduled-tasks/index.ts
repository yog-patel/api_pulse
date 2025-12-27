import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseKey);

interface Task {
  id: string;
  task_name: string;
  user_id: string;
  api_url: string;
  method: string;
  request_headers: Record<string, string> | null;
  request_body: string | null;
  schedule_interval: string;
  is_active: boolean;
  next_run_at: string;
  last_run_at: string | null;
  include_response: boolean;
}

interface LogData {
  task_id: string;
  user_id: string;
  status_code: number | null;
  response_headers: Record<string, string> | null;
  response_body: string | null;
  response_time_ms: number;
  error_message: string | null;
  executed_at: string;
}

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

async function executeTask(task: Task): Promise<void> {
  const startTime = Date.now();
  let logData: LogData | null = null;

  try {
    console.log(`[${new Date().toISOString()}] Executing task: ${task.task_name} (${task.id})`);

    // Build request options
    const requestOptions: RequestInit = {
      method: task.method,
      headers: task.request_headers || {},
    };

    if (task.method === "POST" && task.request_body) {
      requestOptions.body = task.request_body;
      if (!requestOptions.headers) {
        requestOptions.headers = {};
      }
      (requestOptions.headers as Record<string, string>)["Content-Type"] =
        (requestOptions.headers as Record<string, string>)["Content-Type"] || "application/json";
    }

    // Execute the HTTP request
    const response = await fetch(task.api_url, requestOptions);
    const responseTime = Date.now() - startTime;

    // Read response body
    const responseBody = await response.text();

    // Extract response headers
    const responseHeaders = Object.fromEntries(response.headers.entries());

    // Prepare log data
    logData = {
      task_id: task.id,
      user_id: task.user_id,
      status_code: response.status,
      response_headers: task.include_response ? responseHeaders : null,
      response_body: task.include_response ? responseBody : null,
      response_time_ms: responseTime,
      error_message: null,
      executed_at: new Date().toISOString(),
    };

    // Save the log
    const { error: logError } = await supabase.from("api_task_logs").insert([logData]);

    if (logError) {
      console.error(`Error saving log for task ${task.id}:`, logError);
    } else {
      console.log(
        `✓ Task executed: ${task.task_name} - Status: ${response.status} - Time: ${responseTime}ms`
      );
    }

    // Increment usage count for the user
    const { error: usageIncrementError } = await supabase.rpc("increment_run_count", {
      p_user_id: task.user_id,
    });

    if (usageIncrementError) {
      console.error(`Error incrementing usage count:`, usageIncrementError);
    }

    // Calculate next run time
    const nextRunAt = calculateNextRunTime(new Date(), task.schedule_interval);

    // Update task with last_run_at and next_run_at
    const { error: updateError } = await supabase
      .from("api_tasks")
      .update({
        last_run_at: new Date().toISOString(),
        next_run_at: nextRunAt.toISOString(),
      })
      .eq("id", task.id);

    if (updateError) {
      console.error(`Error updating task ${task.id}:`, updateError);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.error(`✗ Task failed: ${task.task_name} - ${errorMessage}`);

    // Prepare error log data
    logData = {
      task_id: task.id,
      user_id: task.user_id,
      status_code: null,
      response_headers: null,
      response_body: null,
      response_time_ms: responseTime,
      error_message: errorMessage,
      executed_at: new Date().toISOString(),
    };

    // Save error log
    const { error: logError } = await supabase.from("api_task_logs").insert([logData]);

    if (logError) {
      console.error(`Error saving error log for task ${task.id}:`, logError);
    }

    // Increment usage count even for failed tasks
    const { error: usageIncrementError } = await supabase.rpc("increment_run_count", {
      p_user_id: task.user_id,
    });

    if (usageIncrementError) {
      console.error(`Error incrementing usage count:`, usageIncrementError);
    }

    // Update task with last_run_at
    const nextRunAt = calculateNextRunTime(new Date(), task.schedule_interval);
    const { error: updateError } = await supabase
      .from("api_tasks")
      .update({
        last_run_at: new Date().toISOString(),
        next_run_at: nextRunAt.toISOString(),
      })
      .eq("id", task.id);

    if (updateError) {
      console.error(`Error updating task ${task.id}:`, updateError);
    }
  }
}

async function executeScheduledTasks(): Promise<void> {
  try {
    console.log(`[${new Date().toISOString()}] Starting task execution...`);

    // Get all active tasks where next_run_at <= now
    const now = new Date();
    const { data: tasks, error: tasksError } = await supabase
      .from("api_tasks")
      .select("*")
      .eq("is_active", true)
      .lte("next_run_at", now.toISOString());

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      return;
    }

    if (!tasks || tasks.length === 0) {
      console.log("No tasks to execute");
      return;
    }

    console.log(`Found ${tasks.length} tasks to execute`);

    for (const task of tasks) {
      try {
        await executeTask(task as Task);
      } catch (error) {
        console.error(`Error executing task:`, error);
      }
    }

    console.log(`[${new Date().toISOString()}] Task execution completed`);
  } catch (error) {
    console.error("Fatal error in executeScheduledTasks:", error);
  }
}

serve(async (req) => {
  // Allow only POST requests
  if (req.method !== "POST") {
    return new Response("Only POST requests are allowed", { status: 405 });
  }

  try {
    // Execute the scheduler
    await executeScheduledTasks();

    return new Response(JSON.stringify({ success: true, message: "Scheduler executed" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
