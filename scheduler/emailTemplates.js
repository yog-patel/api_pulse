/**
 * Email Templates for API Schedulr Notifications
 * Generates HTML email content for task execution notifications
 */

/**
 * Generate success email HTML
 */
function generateSuccessEmail(task, log) {
  const executedAt = new Date(log.executed_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Task Success</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .status-badge {
      display: inline-block;
      background: #d1fae5;
      color: #065f46;
   padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .info-grid {
      background: #f9fafb;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #6b7280;
    }
  .info-value {
      color: #111827;
    }
    .endpoint {
    background: #f3f4f6;
      padding: 12px;
    border-radius: 4px;
      font-family: monospace;
      font-size: 14px;
      word-break: break-all;
      margin: 15px 0;
    }
    .response-body {
    background: #1f2937;
      color: #f9fafb;
      padding: 16px;
 border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      overflow-x: auto;
   margin: 15px 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .footer {
      text-align: center;
      padding: 20px;
  color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .badge-success {
      background: #d1fae5;
      color: #065f46;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>? API Task Success</h1>
    </div>
    
    <div class="content">
   <div class="status-badge badge-success">
        Successfully Executed
      </div>
      
      <h2 style="margin-top: 0;">${task.task_name}</h2>
   
      <div class="info-grid">
  <div class="info-row">
       <span class="info-label">Status Code:</span>
       <span class="info-value">${log.status_code}</span>
        </div>
        <div class="info-row">
<span class="info-label">Response Time:</span>
  <span class="info-value">${log.response_time_ms}ms</span>
        </div>
        <div class="info-row">
          <span class="info-label">Method:</span>
          <span class="info-value">${task.method}</span>
        </div>
        <div class="info-row">
      <span class="info-label">Executed At:</span>
          <span class="info-value">${executedAt}</span>
        </div>
      </div>
      
      <p><strong>Endpoint:</strong></p>
    <div class="endpoint">${task.api_url}</div>
      
      ${log.response_body ? `
      <p><strong>Response Body:</strong></p>
    <div class="response-body">${escapeHtml(truncateResponse(log.response_body))}</div>
      ` : ''}
    </div>
    
    <div class="footer">
      <p>This is an automated notification from API Schedulr</p>
      <p style="font-size: 12px; color: #9ca3af;">
  You're receiving this because you have notifications enabled for this task
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate failure email HTML
 */
function generateFailureEmail(task, log) {
  const executedAt = new Date(log.executed_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Task Failed</title>
  <style>
    body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
 color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .status-badge {
   display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      margin-bottom: 20px;
  }
 .badge-error {
      background: #fee2e2;
      color: #991b1b;
    }
    .info-grid {
      background: #f9fafb;
    border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
   padding: 10px 0;
   border-bottom: 1px solid #e5e7eb;
 }
    .info-row:last-child {
      border-bottom: none;
  }
    .info-label {
      font-weight: 600;
      color: #6b7280;
    }
 .info-value {
   color: #111827;
    }
    .endpoint {
      background: #f3f4f6;
      padding: 12px;
      border-radius: 4px;
      font-family: monospace;
 font-size: 14px;
      word-break: break-all;
      margin: 15px 0;
    }
    .error-box {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 16px;
      border-radius: 4px;
      margin: 15px 0;
    }
    .error-box strong {
      color: #991b1b;
    }
    .response-body {
      background: #1f2937;
 color: #f9fafb;
      padding: 16px;
      border-radius: 6px;
    font-family: 'Courier New', monospace;
      font-size: 13px;
      overflow-x: auto;
      margin: 15px 0;
      white-space: pre-wrap;
   word-wrap: break-word;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
  }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>? API Task Failed</h1>
    </div>
    
    <div class="content">
      <div class="status-badge badge-error">
        Execution Failed
      </div>
      
  <h2 style="margin-top: 0;">${task.task_name}</h2>
    
      ${log.error_message ? `
        <div class="error-box">
    <strong>Error Message:</strong><br>
          ${escapeHtml(log.error_message)}
        </div>
      ` : ''}
      
      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">Status Code:</span>
          <span class="info-value">${log.status_code || 'N/A'}</span>
  </div>
 <div class="info-row">
          <span class="info-label">Response Time:</span>
    <span class="info-value">${log.response_time_ms}ms</span>
        </div>
    <div class="info-row">
  <span class="info-label">Method:</span>
          <span class="info-value">${task.method}</span>
        </div>
        <div class="info-row">
     <span class="info-label">Executed At:</span>
      <span class="info-value">${executedAt}</span>
        </div>
      </div>
      
      <p><strong>Endpoint:</strong></p>
      <div class="endpoint">${task.api_url}</div>
      
      ${log.response_body ? `
      <p><strong>Response Body:</strong></p>
        <div class="response-body">${escapeHtml(truncateResponse(log.response_body))}</div>
      ` : ''}
    </div>
    
    <div class="footer">
 <p>This is an automated notification from API Schedulr</p>
  <p style="font-size: 12px; color: #9ca3af;">
        Please investigate this failure as soon as possible
      </p>
  </div>
  </div>
</body>
</html>
  `;
}

/**
 * Helper: Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Helper: Truncate response to prevent huge emails
 */
function truncateResponse(response) {
  const maxLength = 2000;
  if (response.length > maxLength) {
    return response.substring(0, maxLength) + '\n\n... (truncated)';
  }
  return response;
}

module.exports = {
  generateSuccessEmail,
  generateFailureEmail
};
