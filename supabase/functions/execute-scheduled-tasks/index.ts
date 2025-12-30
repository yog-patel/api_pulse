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

async function sendNotifications(task: Task, logData: LogData): Promise<void> {
  try {
    // Get all active notification links for this task
    const { data: notifications, error: notificationsError } = await supabase
      .from("task_notifications")
      .select(`
        *,
        user_integrations (
          id,
          integration_type,
          name,
          credentials,
          is_active
        )
      `)
      .eq("task_id", task.id);

    if (notificationsError) {
      console.error("Error fetching notifications:", notificationsError);
      return;
    }

    if (!notifications || notifications.length === 0) {
      console.log(`No notifications configured for task ${task.id}`);
      return;
    }

    // Filter active integrations and check notify_on rules
    const activeNotifications = notifications.filter((notif: any) => {
      if (!notif.user_integrations?.is_active) return false;

      // Check notify_on condition
      if (notif.notify_on === "always") return true;
      if (notif.notify_on === "failure_only" && (!logData.status_code || logData.status_code >= 400)) return true;
      if (notif.notify_on === "timeout" && logData.error_message) return true;

      return false;
    });

    if (activeNotifications.length === 0) {
      console.log(`No active notifications to send for task ${task.id}`);
      return;
    }

    console.log(`Sending ${activeNotifications.length} notification(s) for task: ${task.task_name}`);

    // Send each notification
    for (const notif of activeNotifications) {
      try {
        await sendNotification(notif.user_integrations, task, logData, notif.include_response || false);
      } catch (error) {
        console.error(`Error sending ${notif.user_integrations.integration_type} notification:`, error);
      }
    }
  } catch (error) {
    console.error("Error in sendNotifications:", error);
  }
}

async function sendNotification(
  integration: any,
  task: Task,
  logData: LogData,
  includeResponse: boolean = false
): Promise<void> {
  try {
    switch (integration.integration_type) {
      case "slack":
        await sendSlackNotification(integration, task, logData);
        break;
      case "discord":
        await sendDiscordNotification(integration, task, logData);
        break;
      case "webhook":
        await sendWebhookNotification(integration, task, logData, includeResponse);
        break;
      case "email":
        await sendEmailNotification(integration, task, logData, includeResponse);
        break;
      default:
        console.log(`Unsupported integration type: ${integration.integration_type}`);
    }
  } catch (error) {
    console.error(`Error in sendNotification:`, error);
  }
}

async function sendSlackNotification(integration: any, task: Task, logData: LogData): Promise<void> {
  const webhookUrl = integration.credentials?.webhook_url;
  if (!webhookUrl) {
    console.error("Slack webhook URL not found");
    return;
  }

  const isSuccess = logData.status_code && logData.status_code >= 200 && logData.status_code < 400;
  const emoji = isSuccess ? "✅" : "❌";
  const status = isSuccess ? "Success" : "Failed";
  const color = isSuccess ? "#36a64f" : "#ff0000";

  const payload = {
    attachments: [
      {
        color: color,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `${emoji} API Task ${status}: ${task.task_name}`,
              emoji: true,
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Status Code:*\n${logData.status_code || "N/A"}`,
              },
              {
                type: "mrkdwn",
                text: `*Response Time:*\n${logData.response_time_ms}ms`,
              },
              {
                type: "mrkdwn",
                text: `*Task ID:*\n${task.id}`,
              },
              {
                type: "mrkdwn",
                text: `*Timestamp:*\n${new Date(logData.executed_at).toLocaleString()}`,
              },
            ],
          },
          ...(logData.error_message
            ? [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `*Error:*\n\`\`\`${logData.error_message}\`\`\``,
                  },
                },
              ]
            : []),
        ],
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.statusText}`);
  }

  console.log(`✓ Slack notification sent for task ${task.id}`);
}

async function sendDiscordNotification(integration: any, task: Task, logData: LogData): Promise<void> {
  const webhookUrl = integration.credentials?.webhook_url;
  if (!webhookUrl) {
    console.error("Discord webhook URL not found");
    return;
  }

  const isSuccess = logData.status_code && logData.status_code >= 200 && logData.status_code < 400;
  const emoji = isSuccess ? "✅" : "❌";
  const status = isSuccess ? "Success" : "Failed";
  const color = isSuccess ? 3381759 : 16711680; // Green : Red

  const payload = {
    embeds: [
      {
        title: `${emoji} API Task ${status}: ${task.task_name}`,
        color: color,
        fields: [
          {
            name: "Status Code",
            value: String(logData.status_code || "N/A"),
            inline: true,
          },
          {
            name: "Response Time",
            value: `${logData.response_time_ms}ms`,
            inline: true,
          },
          {
            name: "Task ID",
            value: task.id,
            inline: true,
          },
          {
            name: "Executed At",
            value: new Date(logData.executed_at).toLocaleString(),
            inline: true,
          },
          ...(logData.error_message
            ? [
                {
                  name: "Error",
                  value: `\`\`\`${logData.error_message}\`\`\``,
                  inline: false,
                },
              ]
            : []),
        ],
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Discord API error: ${response.statusText}`);
  }

  console.log(`✓ Discord notification sent for task ${task.id}`);
}

async function sendWebhookNotification(
  integration: any,
  task: Task,
  logData: LogData,
  includeResponse: boolean = false
): Promise<void> {
  const webhookUrl = integration.credentials?.webhook_url;
  if (!webhookUrl) {
    console.error("Webhook URL not found");
    return;
  }

  const payload = {
    event: "task_execution",
    task_id: task.id,
    task_name: task.task_name,
    status_code: logData.status_code,
    response_time_ms: logData.response_time_ms,
    error_message: logData.error_message || null,
    executed_at: logData.executed_at,
    ...(includeResponse && logData.response_body ? { response_body: logData.response_body } : {}),
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook error: ${response.statusText}`);
  }

  console.log(`✓ Webhook notification sent for task ${task.id}`);
}

async function sendEmailNotification(
  integration: any,
  task: Task,
  logData: LogData,
  includeResponse: boolean = false
): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("RESEND_API_KEY environment variable not set");
    return;
  }

  const recipientEmail = integration.credentials?.email;
  if (!recipientEmail) {
    console.error("Recipient email not found in integration credentials");
    return;
  }

  const isSuccess = logData.status_code && logData.status_code >= 200 && logData.status_code < 400;
  const subject = isSuccess
    ? `✅ API Task Completed: ${task.task_name}`
    : `❌ API Task Failed: ${task.task_name}`;

  const htmlContent = `
    <h2>${isSuccess ? "✅ Success" : "❌ Failed"}</h2>
    <p><strong>Task:</strong> ${task.task_name}</p>
    <p><strong>Status Code:</strong> ${logData.status_code || "N/A"}</p>
    <p><strong>Response Time:</strong> ${logData.response_time_ms}ms</p>
    <p><strong>Executed At:</strong> ${new Date(logData.executed_at).toLocaleString()}</p>
    ${logData.error_message ? `<p><strong>Error:</strong> ${logData.error_message}</p>` : ""}
    ${includeResponse && logData.response_body ? `<pre>${logData.response_body}</pre>` : ""}
  `;

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("FROM_EMAIL") || "notifications@api-schedulr.com",
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
    }),
  });

  if (!emailResponse.ok) {
    throw new Error(`Email API error: ${emailResponse.statusText}`);
  }

  console.log(`✓ Email notification sent for task ${task.id}`);
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

      // Send notifications
      await sendNotifications(task, logData);
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
    } else {
      // Send notifications for failed task
      await sendNotifications(task, logData);
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
