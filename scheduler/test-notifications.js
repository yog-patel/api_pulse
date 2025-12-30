const { createClient } = require("@supabase/supabase-js");
const NotificationService = require("./notificationService");
require("dotenv").config();

/**
 * Test script for notification system
 * Run with: node test-notifications.js
 */

async function testNotifications() {
  console.log("🔔 Testing API Schedulr Notification System\n");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("? Missing Supabase environment variables");
    console.error("   Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const notificationService = new NotificationService(supabaseUrl, supabaseKey);

  try {
  // Test 1: Check database connection
    console.log("1?? Testing database connection...");
    const { data: tasks, error: tasksError } = await supabase
      .from("api_tasks")
      .select("id, task_name, user_id")
      .limit(1);

    if (tasksError) {
      console.error("   ? Database connection failed:", tasksError.message);
      return;
    }
    console.log("   ? Database connected\n");

    // Test 2: Check for integrations
    console.log("2?? Checking for configured integrations...");
    const { data: integrations, error: intError } = await supabase
      .from("user_integrations")
   .select("*")
      .eq("is_active", true);

    if (intError) {
console.error("   ? Error fetching integrations:", intError.message);
      return;
    }

 if (!integrations || integrations.length === 0) {
      console.log("   ??  No active integrations found");
      console.log("   ?? Set up an integration first:");
      console.log("      1. Get a Slack webhook: https://api.slack.com/messaging/webhooks");
      console.log("      2. Add it via API or frontend");
      console.log("      3. Link it to a task\n");
      return;
    }

    console.log(`   ? Found ${integrations.length} active integration(s):`);
    integrations.forEach((int) => {
    console.log(`      - ${int.name} (${int.integration_type})`);
    });
    console.log();

    // Test 3: Check for notification links
    console.log("3?? Checking for notification links...");
    const { data: links, error: linksError } = await supabase
   .from("task_notifications")
      .select(`
        *,
        api_tasks (task_name),
   user_integrations (name, integration_type)
      `);

    if (linksError) {
      console.error("   ? Error fetching notification links:", linksError.message);
      return;
    }

    if (!links || links.length === 0) {
      console.log("   ??  No notification links found");
      console.log("   ?? Link a task to an integration using the API\n");
      return;
}

    console.log(`   ? Found ${links.length} notification link(s):`);
    links.forEach((link) => {
console.log(`      - ${link.api_tasks.task_name} ? ${link.user_integrations.name} (${link.notify_on})`);
    });
    console.log();

    // Test 4: Send test notification
 console.log("4?? Sending test notification...");
  
    // Pick first Slack integration for testing
    const slackIntegration = integrations.find(int => int.integration_type === "slack");
    
    if (!slackIntegration) {
      console.log("   ??  No Slack integration found for testing");
    console.log("   ?? Add a Slack integration to test notifications\n");
      return;
    }

    // Create mock task and log data
    const mockTask = {
      id: "test-task-id",
      task_name: "?? Test Task (Notification System Test)",
      api_url: "https://api.example.com/test",
 method: "GET",
    };

  const mockLog = {
      status_code: 200,
  response_time_ms: 123,
   error_message: null,
      executed_at: new Date().toISOString(),
    };

    console.log(`   ?? Sending test to: ${slackIntegration.name}`);
    await notificationService.sendNotification(slackIntegration, mockTask, mockLog);
  console.log("   ? Test notification sent!\n");

    // Summary
    console.log("? All tests passed!");
    console.log("\n?? Summary:");
    console.log(`   - Active integrations: ${integrations.length}`);
    console.log(`   - Notification links: ${links.length}`);
    console.log(`   - Test notification: Sent to Slack\n`);

  } catch (error) {
    console.error("\n? Test failed:", error.message);
    console.error(error);
  }
}

// Run tests
testNotifications();
