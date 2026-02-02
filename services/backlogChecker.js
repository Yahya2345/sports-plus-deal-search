const cron = require('node-cron');
const backlog = require('./backlog');
const sportsInc = require('./sportsInc');
const email = require('./email');

/**
 * Check all backlogged POs and process them
 */
async function checkBacklogPOs() {
  try {
    console.log('\n🔍 Starting daily backlog check...');
    console.log('⏰ Time:', new Date().toLocaleString());

    // Get all backlogged POs
    const backlogItems = await backlog.getBacklogList();

    if (backlogItems.length === 0) {
      console.log('📋 Backlog is empty - nothing to check');
      return;
    }

    console.log(`📋 Checking ${backlogItems.length} POs in backlog...`);

    let foundCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;

    // Check each PO
    for (const item of backlogItems) {
      const poNumber = item.poNumber;
      console.log(`\n🔎 Checking PO: ${poNumber}`);

      try {
        // Search in Sports Inc API
        const invoices = await sportsInc.getAllInvoices(poNumber);

        // Check if PO was found (getAllInvoices returns array directly)
        if (invoices && invoices.length > 0) {
          console.log(`✅ PO ${poNumber} FOUND! Processing...`);
          foundCount++;

          // Send notification email
          await sendBacklogResolvedEmail(poNumber, invoices);

          // Remove from backlog
          await backlog.removeFromBacklog(poNumber);

          console.log(`✅ PO ${poNumber} processed and removed from backlog`);

        } else {
          console.log(`⏳ PO ${poNumber} still not found`);
          notFoundCount++;

          // Update last checked timestamp
          await backlog.updateLastChecked(poNumber);
        }

        // Small delay between checks to avoid rate limiting
        await sleep(1000);

      } catch (error) {
        console.error(`❌ Error checking PO ${poNumber}:`, error.message);
        errorCount++;
      }
    }

    // Summary
    console.log('\n📊 Backlog Check Summary:');
    console.log(`   ✅ Found: ${foundCount}`);
    console.log(`   ⏳ Not Found: ${notFoundCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('✅ Daily backlog check completed\n');

  } catch (error) {
    console.error('❌ Error in daily backlog check:', error.message);
  }
}

/**
 * Send email notification when backlogged PO is found
 * @param {string} poNumber - PO Number
 * @param {Array} invoices - Array of invoices from Sports Inc API
 */
async function sendBacklogResolvedEmail(poNumber, invoices) {
  try {
    const recipients = 'sam@sportsplusteam.com, tricia@sportsplusteam.com, travis@sportsplusteam.com';
    
    const portalUrl = process.env.PORTAL_URL || 'https://sportsplus-recieving-portal.growlyze.cloud';
    const searchUrl = `${portalUrl}?po=${encodeURIComponent(poNumber)}`;

    const invoiceCount = invoices?.length || 0;
    const totalLineItems = invoices?.reduce((sum, inv) => {
      return sum + (inv._lineItems?.length || 0);
    }, 0) || 0;

    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #28a745; color: white; padding: 20px; border-radius: 5px; text-align: center; }
    .content { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .info-row { padding: 10px 0; border-bottom: 1px solid #dee2e6; }
    .info-row:last-child { border-bottom: none; }
    .label { font-weight: bold; color: #495057; }
    .value { color: #212529; }
    .button { 
      display: inline-block; 
      background: #007bff; 
      color: white !important; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 5px; 
      margin: 20px 0;
      font-weight: bold;
    }
    .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>✅ PO Now Available in Portal</h2>
    </div>
    
    <div class="content">
      <h3>Good news! A backlogged PO has been found:</h3>
      
      <div class="info-row">
        <span class="label">PO Number:</span>
        <span class="value">${poNumber}</span>
      </div>
      
      <div class="info-row">
        <span class="label">Invoices Found:</span>
        <span class="value">${invoiceCount}</span>
      </div>
      
      <div class="info-row">
        <span class="label">Total Line Items:</span>
        <span class="value">${totalLineItems}</span>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${searchUrl}" class="button">View in Portal →</a>
      </div>
      
      <p style="margin-top: 20px; color: #6c757d; font-size: 14px;">
        This PO was in the backlog and has been automatically removed now that it's available.
      </p>
    </div>
    
    <div class="footer">
      <p>Sports Plus Receiving Portal - Automated Backlog Alert</p>
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'Sports Plus Portal'} <${process.env.EMAIL_USER}>`,
      to: recipients,
      subject: `✅ PO ${poNumber} Now Available in Portal`,
      html: emailBody,
    };

    const info = await email.transporter.sendMail(mailOptions);
    console.log(`✅ Backlog resolved email sent for PO ${poNumber}:`, info.messageId);

  } catch (error) {
    console.error('❌ Error sending backlog resolved email:', error.message);
    throw error;
  }
}

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Start the cron job for daily backlog checks
 * Runs every day at 9:00 AM
 */
function startBacklogChecker() {
  console.log('🔄 Starting backlog checker cron job...');
  console.log('⏰ Schedule: Daily at 9:00 AM');

  // Schedule: 0 9 * * * = Every day at 9:00 AM
  // Format: minute hour day month weekday
  cron.schedule('0 9 * * *', async () => {
    await checkBacklogPOs();
  });

  console.log('✅ Backlog checker is running');

  // Optional: Run check immediately on startup for testing
  // Uncomment the line below if you want to test immediately
  // setTimeout(() => checkBacklogPOs(), 5000);
}

module.exports = {
  startBacklogChecker,
  checkBacklogPOs // Export for manual testing
};
