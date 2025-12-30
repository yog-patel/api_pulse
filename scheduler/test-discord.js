/**
 * Test Discord Notifications
 * 
 * This script tests Discord webhook notifications independently
 * Usage: node scheduler/test-discord.js <webhook-url>
 */

const DISCORD_WEBHOOK_URL = process.argv[2] || process.env.DISCORD_WEBHOOK_URL;

if (!DISCORD_WEBHOOK_URL) {
  console.error('? Error: Please provide a Discord webhook URL');
  console.error('Usage: node test-discord.js <webhook-url>');
  console.error('Or set DISCORD_WEBHOOK_URL environment variable');
  process.exit(1);
}

// Test success notification
async function testSuccessNotification() {
  console.log('?? Sending success notification to Discord...');

  const payload = {
    embeds: [
      {
title: '? API Task Success: Production Health Check',
  color: 0x36a64f, // Green
        fields: [
   {
            name: 'Task Name',
        value: 'Production Health Check',
         inline: true,
          },
{
            name: 'Status Code',
            value: '200',
            inline: true,
          },
          {
          name: 'Response Time',
 value: '145ms',
            inline: true,
     },
          {
          name: 'Method',
            value: 'GET',
  inline: true,
          },
   {
   name: 'Endpoint',
        value: '`https://api.example.com/health`',
            inline: false,
          },
          {
name: 'Response Body',
         value: '```json\n{\n  "status": "ok",\n  "uptime": 12345\n}\n```',
    inline: false,
          },
  ],
  footer: {
          text: `Executed at ${new Date().toLocaleString()}`,
     },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
     'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

 if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord API error: ${response.status} - ${errorText}`);
    }

    console.log('? Success notification sent!');
    return true;
  } catch (error) {
    console.error('? Failed to send success notification:', error.message);
    return false;
  }
}

// Test failure notification
async function testFailureNotification() {
  console.log('?? Sending failure notification to Discord...');

  const payload = {
    embeds: [
      {
        title: '? API Task Failed: Payment Gateway',
    color: 0xff0000, // Red
        fields: [
     {
 name: 'Task Name',
         value: 'Payment Gateway',
         inline: true,
          },
 {
    name: 'Status Code',
value: '500',
 inline: true,
        },
          {
          name: 'Response Time',
      value: '3200ms',
         inline: true,
          },
          {
        name: 'Method',
 value: 'POST',
            inline: true,
          },
          {
          name: 'Endpoint',
            value: '`https://api.payment.com/charge`',
            inline: false,
          },
          {
name: 'Error',
            value: '```Internal Server Error - Database connection timeout```',
          inline: false,
          },
      ],
footer: {
          text: `Executed at ${new Date().toLocaleString()}`,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
  method: 'POST',
    headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
   const errorText = await response.text();
      throw new Error(`Discord API error: ${response.status} - ${errorText}`);
    }

    console.log('? Failure notification sent!');
    return true;
} catch (error) {
    console.error('? Failed to send failure notification:', error.message);
    return false;
  }
}

// Test simple message
async function testSimpleMessage() {
  console.log('?? Sending simple test message to Discord...');

  const payload = {
    content: '🔔 **API Schedulr Discord Integration Test**\n\nIf you can see this message, your Discord webhook is working correctly!',
  };

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

  if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord API error: ${response.status} - ${errorText}`);
    }

    console.log('? Simple message sent!');
    return true;
  } catch (error) {
    console.error('? Failed to send simple message:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('?? Testing Discord Webhook Integration');
  console.log('=====================================\n');

  let successCount = 0;
  const totalTests = 3;

  // Test 1: Simple message
  if (await testSimpleMessage()) {
    successCount++;
  }
  
  // Wait a bit between messages to avoid rate limits
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Success notification
  if (await testSuccessNotification()) {
    successCount++;
  }

  // Wait a bit between messages
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: Failure notification
  if (await testFailureNotification()) {
    successCount++;
  }

  console.log('\n=====================================');
  console.log(`?? Results: ${successCount}/${totalTests} tests passed`);

  if (successCount === totalTests) {
    console.log('? All tests passed! Discord integration is working correctly.');
    console.log('?? Check your Discord channel to see the test messages.');
  } else {
    console.log('?? Some tests failed. Please check the errors above.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('? Unexpected error:', error);
  process.exit(1);
});
