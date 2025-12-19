const { createClient } = require("@supabase/supabase-js");
const { generateSuccessEmail, generateFailureEmail } = require("./emailTemplates");

/**
 * Notification Service
 * Handles sending notifications via different channels (Slack, Email, SMS)
 */

class NotificationService {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    // Store Resend configuration for email notifications
    this.resendApiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.FROM_EMAIL || 'notifications@apipulse.dev';
  }

  /**
   * Send notifications for a task execution
   * @param {Object} task - The task object
   * @param {Object} log - The execution log object
   */
  async sendTaskNotifications(task, log) {
    try {
      // Get all active notification links for this task
      const { data: notifications, error } = await this.supabase
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

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      if (!notifications || notifications.length === 0) {
        console.log(`No notifications configured for task ${task.id}`);
      return;
 }

      // Filter active integrations and check notify_on rules
      const activeNotifications = notifications.filter((notif) => {
        if (!notif.user_integrations?.is_active) return false;

        // Check notify_on condition
  if (notif.notify_on === "always") return true;
        if (notif.notify_on === "failure_only" && (!log.status_code || log.status_code >= 400)) return true;
      if (notif.notify_on === "timeout" && log.error_message) return true;

   return false;
      });

      if (activeNotifications.length === 0) {
        console.log(`No active notifications to send for task ${task.id}`);
   return;
      }

      console.log(`Sending ${activeNotifications.length} notification(s) for task: ${task.task_name}`);

      // Send notifications in parallel
      const notificationPromises = activeNotifications.map((notif) =>
     this.sendNotification(
       notif.user_integrations, 
       task, 
log,
    notif.include_response || false
        )
      );

      await Promise.allSettled(notificationPromises);
    } catch (error) {
      console.error("Error in sendTaskNotifications:", error);
    }
  }

  /**
   * Send a single notification
   * @param {Object} integration - The integration object with credentials
   * @param {Object} task - The task object
   * @param {Object} log - The execution log object
   * @param {boolean} includeResponse - Whether to include response body
   */
  async sendNotification(integration, task, log, includeResponse = false) {
    try {
 // Store includeResponse flag for use in notification methods
 this.includeResponse = includeResponse;
      
      switch (integration.integration_type) {
        case "slack":
          await this.sendSlackNotification(integration, task, log);
          break;
     case "discord":
   await this.sendDiscordNotification(integration, task, log);
       break;
     case "email":
await this.sendEmailNotification(integration, task, log);
          break;
        case "sms":
          await this.sendSMSNotification(integration, task, log);
       break;
        case "webhook":
          await this.sendWebhookNotification(integration, task, log);
  break;
  default:
     console.log(`Unsupported integration type: ${integration.integration_type}`);
      }
 } catch (error) {
      console.error(`Error sending ${integration.integration_type} notification:`, error);
    }
  }

  /**
   * Send Slack notification
   */
  async sendSlackNotification(integration, task, log) {
    const webhookUrl = integration.credentials.webhook_url;

    if (!webhookUrl) {
 console.error("Slack webhook URL not found");
      return;
    }

    const isSuccess = log.status_code && log.status_code >= 200 && log.status_code < 400;
    const emoji = isSuccess ? "?" : "?";
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
     text: `*Task Name:*\n${task.task_name}`,
    },
 {
type: "mrkdwn",
            text: `*Status Code:*\n${log.status_code || "N/A"}`,
       },
  {
          type: "mrkdwn",
             text: `*Response Time:*\n${log.response_time_ms}ms`,
     },
         {
    type: "mrkdwn",
 text: `*Method:*\n${task.method}`,
   },
   ],
   },
 {
  type: "section",
 text: {
    type: "mrkdwn",
  text: `*Endpoint:*\n\`${task.api_url}\``,
  },
    },
     ],
  },
      ],
  };

    // Add error message if present
    if (log.error_message) {
  payload.attachments[0].blocks.push({
        type: "section",
        text: {
  type: "mrkdwn",
  text: `*Error:*\n\`\`\`${log.error_message}\`\`\``,
        },
      });
    }

    // Add response body if requested (new feature!)
 if (this.includeResponse && log.response_body) {
      let responsePreview = log.response_body;
      
      // Truncate long responses to avoid Slack limits (max 3000 chars for code blocks)
      const maxLength = 2000;
      if (responsePreview.length > maxLength) {
        responsePreview = responsePreview.substring(0, maxLength) + '\n\n... (truncated)';
      }

      // Try to format JSON nicely
      try {
     const jsonObj = JSON.parse(responsePreview);
        responsePreview = JSON.stringify(jsonObj, null, 2);
      } catch (e) {
  // Not JSON, use as-is
      }

      payload.attachments[0].blocks.push({
        type: "section",
  text: {
 type: "mrkdwn",
          text: `*Response Body:*\n\`\`\`${responsePreview}\`\`\``,
        },
      });
    }

    // Add timestamp
    payload.attachments[0].blocks.push({
   type: "context",
  elements: [
     {
          type: "mrkdwn",
          text: `Executed at: <!date^${Math.floor(new Date(log.executed_at).getTime() / 1000)}^{date_short_pretty} at {time}|${log.executed_at}>`,
        },
      ],
    });

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
"Content-Type": "application/json",
    },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    console.log(`? Slack notification sent for task: ${task.task_name}`);
  }

  /**
   * Send Discord notification
   */
  async sendDiscordNotification(integration, task, log) {
    const webhookUrl = integration.credentials.webhook_url;

    if (!webhookUrl) {
      console.error("Discord webhook URL not found");
      return;
    }

    const isSuccess = log.status_code && log.status_code >= 200 && log.status_code < 400;
    const emoji = isSuccess ? "?" : "?";
    const status = isSuccess ? "Success" : "Failed";
    const color = isSuccess ? 0x36a64f : 0xff0000; // Green or Red in decimal

    // Build embed fields
    const fields = [
    {
      name: "Task Name",
        value: task.task_name,
     inline: true,
      },
      {
    name: "Status Code",
    value: String(log.status_code || "N/A"),
        inline: true,
      },
      {
        name: "Response Time",
      value: `${log.response_time_ms}ms`,
        inline: true,
      },
      {
name: "Method",
 value: task.method,
    inline: true,
      },
      {
     name: "Endpoint",
    value: `\`${task.api_url}\`",
        inline: false,
      },
    ];

    // Add error message if present
    if (log.error_message) {
      fields.push({
        name: "Error",
        value: `\`\`\`${log.error_message.substring(0, 1000)}\`\`\``,
        inline: false,
      });
    }

    // Add response body if requested
    if (this.includeResponse && log.response_body) {
      let responsePreview = log.response_body;
      
      // Truncate long responses (Discord field limit is 1024 chars)
      const maxLength = 1000;
  if (responsePreview.length > maxLength) {
        responsePreview = responsePreview.substring(0, maxLength) + '\n\n... (truncated)';
      }

      // Try to format JSON nicely
      try {
   const jsonObj = JSON.parse(responsePreview);
        responsePreview = JSON.stringify(jsonObj, null, 2);
   } catch (e) {
  // Not JSON, use as-is
      }

      fields.push({
        name: "Response Body",
    value: `\`\`\`json\n${responsePreview}\`\`\``,
        inline: false,
      });
    }

    const payload = {
      embeds: [
{
          title: `${emoji} API Task ${status}: ${task.task_name}`,
   color: color,
      fields: fields,
          footer: {
   text: `Executed at ${new Date(log.executed_at).toLocaleString()}`,
          },
          timestamp: log.executed_at,
        },
      ],
    };

    const response = await fetch(webhookUrl, {
 method: "POST",
  headers: {
    "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

  if (!response.ok) {
   const errorText = await response.text();
      throw new Error(`Discord API error: ${response.status} - ${errorText}`);
    }

    console.log(`?? Discord notification sent for task: ${task.task_name}`);
  }

  /**
   * Send Email notification via Resend REST API
   */
  async sendEmailNotification(integration, task, log) {
    if (!this.resendApiKey) {
      console.error("Resend not configured. Set RESEND_API_KEY in .env");
   return;
    }

    const toEmail = integration.credentials.email;

    if (!toEmail) {
      console.error("Email address not found in integration credentials");
      return;
    }

  try {
    const isSuccess = log.status_code && log.status_code >= 200 && log.status_code < 400;
      const subject = isSuccess 
        ? `? API Task Success: ${task.task_name}`
        : `? API Task Failed: ${task.task_name}`;

      // Generate HTML email based on success/failure
      const htmlContent = isSuccess
        ? generateSuccessEmail(task, log)
   : generateFailureEmail(task, log);

      // Send email via Resend REST API
      const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
     'Content-Type': 'application/json'
      },
        body: JSON.stringify({
      from: this.fromEmail,
    to: [toEmail],
          subject: subject,
  html: htmlContent
     })
      });

   if (!response.ok) {
  const errorData = await response.json();
        throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
  }

      const data = await response.json();
      console.log(`? Email notification sent for task: ${task.task_name} (ID: ${data.id})`);
    } catch (error) {
      console.error(`Error sending email notification:`, error);
      throw error;
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMSNotification(integration, task, log) {
    // TODO: Implement SMS sending using Twilio or another provider
    console.log(`SMS notification would be sent to: ${integration.credentials.phone_number}`);
    console.log(`Task: ${task.task_name}, Status: ${log.status_code}`);
  }

/**
   * Send Webhook notification
   */
  async sendWebhookNotification(integration, task, log) {
    const webhookUrl = integration.credentials.webhook_url;

    if (!webhookUrl) {
   console.error("Webhook URL not found");
      return;
    }

    const payload = {
      task_id: task.id,
      task_name: task.task_name,
      api_url: task.api_url,
      method: task.method,
      status_code: log.status_code,
      response_time_ms: log.response_time_ms,
      error_message: log.error_message,
      executed_at: log.executed_at,
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
  "Content-Type": "application/json",
},
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status}`);
  }

 console.log(`? Webhook notification sent for task: ${task.task_name}`);
  }
}

module.exports = NotificationService;
