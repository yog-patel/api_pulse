const { createClient } = require("@supabase/supabase-js");
const NotificationService = require("./notificationService");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const notificationService = new NotificationService(supabaseUrl, supabaseKey);

async function executeScheduledTasks() {
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
        await executeTask(task);
      } catch (error) {
        console.error(`Error executing task ${task.id}:`, error);
      }
    }

    console.log(`[${new Date().toISOString()}] Task execution completed`);
  } catch (error) {
    console.error("Fatal error in executeScheduledTasks:", error);
  }
}

async function executeTask(task) {
  const startTime = Date.now();
  let logData = null;

  try {
    console.log(`\n[${new Date().toISOString()}] Executing task: ${task.task_name} (${task.id})`);

    // Build request options
    const requestOptions = {
      method: task.method,
      headers: task.request_headers || {},
    };

    if (task.method === "POST" && task.request_body) {
      requestOptions.body = task.request_body;
      requestOptions.headers["Content-Type"] =
        requestOptions.headers["Content-Type"] || "application/json";
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
      response_headers: responseHeaders,
      response_body: responseBody,
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
    const { error: usageError } = await supabase.rpc('increment_run_count', {
      p_user_id: task.user_id
    });

    if (usageError) {
      console.error(`Error incrementing usage count:`, usageError);
    }

    // Send notifications
    await notificationService.sendTaskNotifications(task, logData);

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
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

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

    // Increment usage count even for failed tasks (they still consume a run)
    const { error: usageError } = await supabase.rpc('increment_run_count', {
      p_user_id: task.user_id
    });

    if (usageError) {
      console.error(`Error incrementing usage count:`, usageError);
    }

    // Send notifications for failed task
    await notificationService.sendTaskNotifications(task, logData);

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

function calculateNextRunTime(baseTime, interval) {
  const next = new Date(baseTime);
  const match = interval.match(/^(\d+)([mhd])$/);

  if (!match) {
    throw new Error(
      "Invalid interval format. Use: 5m, 1h, 1d, etc."
    );
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
      throw new Error(
        "Invalid interval unit. Use: m (minutes), h (hours), d (days)"
      );
  }

  return next;
}

// Run the scheduler
executeScheduledTasks();
