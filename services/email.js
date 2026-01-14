const nodemailer = require('nodemailer');

// Initialize Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD, // App password, not Gmail password
  },
});

// Test connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter error:', error.message);
  } else {
    console.log('✅ Email transporter ready. USER:', process.env.EMAIL_USER);
  }
});

// PO Number initials to email mapping
const PO_INITIALS_TO_EMAIL = {
  'JT': 'jim@sportsplusteam.com',
  'JD': 'john@sportsplusteam.com',
  'JP': 'sportsplus.john@gmail.com',
  'JG': 'sportsplus.jim@gmail.com',
  'BO': 'weoehm@comcast.net',
  'KS': 'katie@sportsplusteam.com',
  'MC': 'sportsplus.mac@gmail.com',
  'SMR': 'coachsteve@sportsplusteam.com',
  'SN': 'sportsplus.shawn@gmail.com',
  'MA': 'mark@sportsplusteam.com',
  'WA': 'wade@sportsplusteam.com'
};

/**
 * Extract initials from PO number and build recipient list
 * @param {string} poNumber - PO Number (e.g., "JG25-252", "SMR-123")
 * @returns {string} Comma-separated email list
 */
function getEmailRecipients(poNumber) {
  // Always include base recipients
  const baseRecipients = process.env.EMAIL_TO || 'zaeemshahzad95@gmail.com, ken@sportsplusteam.com';
  const recipients = baseRecipients.split(',').map(e => e.trim());
  
  if (!poNumber) return recipients.join(', ');
  
  // Extract initials (letters before first number or hyphen)
  const initialsMatch = poNumber.match(/^([A-Z]+)/i);
  if (!initialsMatch) return recipients.join(', ');
  
  const initials = initialsMatch[1].toUpperCase();
  
  // Check for exact match or check if PO starts with any key
  let matchedEmail = PO_INITIALS_TO_EMAIL[initials];
  
  // If no exact match, try matching shorter initials (e.g., "JG" from "JG25")
  if (!matchedEmail) {
    for (const [key, email] of Object.entries(PO_INITIALS_TO_EMAIL)) {
      if (initials.startsWith(key)) {
        matchedEmail = email;
        break;
      }
    }
  }
  
  // Add matched email if found and not already in list
  if (matchedEmail && !recipients.includes(matchedEmail)) {
    recipients.push(matchedEmail);
    console.log(`✉️ PO ${poNumber} initials "${initials}" matched to ${matchedEmail}`);
  }
  
  return recipients.join(', ');
}

/**
 * Send email for incorrect line item
 * @param {object} lineItemData - Line item data with all columns A-S
 */
async function sendIncorrectAlert(lineItemData) {
  try {
    const po = lineItemData['PO Number'] || 'N/A';
    const siDoc = lineItemData['SI Doc Number'] || 'N/A';
    const itemDesc = lineItemData['Item Description'] || 'Unnamed Item';
    const liIndex = lineItemData['Line Item Index'] || 'N/A';
    const inspector = lineItemData['Inspector'] || 'Not assigned';
    const notes = lineItemData['Inspection Notes'] || 'No notes';
    const supplier = lineItemData['Supplier Name'] || 'Unknown';
    const qty = lineItemData['Quantity Shipped'] || 'N/A';
    const price = lineItemData['Unit Price'] || '0';
    const total = lineItemData['Line Item Total'] || '0';

    const emailBody = `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6;">
<h2 style="color: #ff6b35;">INSPECTION STATUS: INCORRECT</h2>

<p><strong>PO Number:</strong> <strong style="font-size: 1.1em;">${po}</strong></p>
<p><strong>SI Doc Number:</strong> ${siDoc}</p>
<p><strong>Line Item Index:</strong> <strong style="font-size: 1.1em;">${liIndex}</strong></p>
<p><strong>Item Description:</strong> ${itemDesc}</p>
<p><strong>Quantity Shipped:</strong> ${qty}</p>
<p><strong>Unit Price:</strong> $${price}</p>
<p><strong>Line Item Total:</strong> $${total}</p>

<h3>Inspection Details</h3>
<p><strong>Inspector:</strong> ${inspector}</p>
<p><strong>Received Date:</strong> ${lineItemData['Actual Shipping Date'] || 'Not set'}</p>
<p><strong>Inspection Notes:</strong> ${notes}</p>
<p><strong>Inspector Note:</strong> ${lineItemData['Inspector Note'] || 'No additional notes'}</p>
<p><strong>Moved to Other Shelf:</strong> ${lineItemData['Moved to Other Shelf'] || 'Not set'}</p>

<h3>Supplier Information</h3>
<p><strong>Supplier:</strong> ${supplier}</p>
<p><strong>SI Doc Date:</strong> ${lineItemData['SI Doc Date'] || 'N/A'}</p>
<p><strong>Ship Date:</strong> ${lineItemData['Ship Date'] || 'N/A'}</p>
<p><strong>Invoice Total:</strong> $${lineItemData['Invoice Total'] || '0'}</p>

<p style="color: #ff6b35; font-weight: bold;">ACTION REQUIRED: Please review this incorrect line item.</p>
<p><em>Last Updated: ${lineItemData['Last Updated'] || new Date().toISOString()}</em></p>

<hr>
<p><em>Sports Plus Inspection System</em></p>
</body>
</html>
    `;

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
      to: getEmailRecipients(po),
      subject: `⚠️ INCORRECT - PO: ${po} | Line Item #${liIndex}`,
      html: emailBody,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Incorrect Alert Email Sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending incorrect alert email:', error.message);
    return false;
  }
}

/**
 * Send email for missing line item
 * @param {object} lineItemData - Line item data with all columns A-S
 */
async function sendMissingAlert(lineItemData) {
  try {
    const po = lineItemData['PO Number'] || 'N/A';
    const siDoc = lineItemData['SI Doc Number'] || 'N/A';
    const itemDesc = lineItemData['Item Description'] || 'Unnamed Item';
    const liIndex = lineItemData['Line Item Index'] || 'N/A';
    const inspector = lineItemData['Inspector'] || 'Not assigned';
    const notes = lineItemData['Inspection Notes'] || 'No notes';
    const supplier = lineItemData['Supplier Name'] || 'Unknown';
    const qty = lineItemData['Quantity Shipped'] || 'N/A';
    const price = lineItemData['Unit Price'] || '0';
    const total = lineItemData['Line Item Total'] || '0';

    const emailBody = `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6;">
<h2 style="color: #dc3545;">INSPECTION STATUS: MISSING</h2>

<p><strong>PO Number:</strong> <strong style="font-size: 1.1em;">${po}</strong></p>
<p><strong>SI Doc Number:</strong> ${siDoc}</p>
<p><strong>Line Item Index:</strong> <strong style="font-size: 1.1em;">${liIndex}</strong></p>
<p><strong>Item Description:</strong> ${itemDesc}</p>
<p><strong>Quantity Shipped:</strong> ${qty}</p>
<p><strong>Unit Price:</strong> $${price}</p>
<p><strong>Line Item Total:</strong> $${total}</p>

<h3>Inspection Details</h3>
<p><strong>Inspector:</strong> ${inspector}</p>
<p><strong>Received Date:</strong> ${lineItemData['Actual Shipping Date'] || 'Not set'}</p>
<p><strong>Inspection Notes:</strong> ${notes}</p>
<p><strong>Inspector Note:</strong> ${lineItemData['Inspector Note'] || 'No additional notes'}</p>
<p><strong>Moved to Other Shelf:</strong> ${lineItemData['Moved to Other Shelf'] || 'Not set'}</p>

<h3>Supplier Information</h3>
<p><strong>Supplier:</strong> ${supplier}</p>
<p><strong>SI Doc Date:</strong> ${lineItemData['SI Doc Date'] || 'N/A'}</p>
<p><strong>Ship Date:</strong> ${lineItemData['Ship Date'] || 'N/A'}</p>
<p><strong>Invoice Total:</strong> $${lineItemData['Invoice Total'] || '0'}</p>

<p style="color: #dc3545; font-weight: bold;">🚨 ACTION REQUIRED: Missing items need immediate attention.</p>
<p><em>Last Updated: ${lineItemData['Last Updated'] || new Date().toISOString()}</em></p>

<hr>
<p><em>Sports Plus Inspection System</em></p>
</body>
</html>
    `;

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
      to: getEmailRecipients(po),
      subject: `🚨 MISSING - PO: ${po} | Line Item #${liIndex}`,
      html: emailBody,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Missing Alert Email Sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending missing alert email:', error.message);
    return false;
  }
}

/**
 * Send email for incomplete line item
 * @param {object} lineItemData - Line item data with all columns A-S
 */
async function sendIncompleteAlert(lineItemData) {
  try {
    const po = lineItemData['PO Number'] || 'N/A';
    const siDoc = lineItemData['SI Doc Number'] || 'N/A';
    const itemDesc = lineItemData['Item Description'] || 'Unnamed Item';
    const liIndex = lineItemData['Line Item Index'] || 'N/A';
    const inspector = lineItemData['Inspector'] || 'Not assigned';
    const notes = lineItemData['Inspection Notes'] || 'No notes';

    const emailBody = `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6;">
<h2 style="color: #ffc107;">INSPECTION STATUS: INCOMPLETE</h2>

<p><strong>PO Number:</strong> <strong style="font-size: 1.1em;">${po}</strong></p>
<p><strong>SI Doc Number:</strong> ${siDoc}</p>
<p><strong>Line Item Index:</strong> <strong style="font-size: 1.1em;">${liIndex}</strong></p>
<p><strong>Item Description:</strong> ${itemDesc}</p>

<h3>Inspection Details</h3>
<p><strong>Inspector:</strong> ${inspector}</p>
<p><strong>Inspection Notes:</strong> ${notes}</p>

<p style="color: #ffc107; font-weight: bold;">⚠️ ACTION REQUIRED: This line item is marked as incomplete.</p>
<p><em>Last Updated: ${lineItemData['Last Updated'] || new Date().toISOString()}</em></p>

<hr>
<p><em>Sports Plus Inspection System</em></p>
</body>
</html>
    `;

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
      to: getEmailRecipients(po),
      subject: `⚠️ INCOMPLETE - PO: ${po} | Line Item #${liIndex}`,
      html: emailBody,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Incomplete Alert Email Sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending incomplete alert email:', error.message);
    return false;
  }
}

/**
 * Send aggregated status digest for Incorrect/Missing line items
 * @param {string} poNumber
 * @param {Array<Object>} allLineItems - all line items for the PO (post-update)
 * @param {Array<Object>} newlyFlagged - line items that just became Incorrect/Missing
 */
async function sendStatusDigest(poNumber, allLineItems = [], newlyFlagged = []) {
  try {
    console.log(`📧 sendStatusDigest called: PO=${poNumber}, allLineItems=${allLineItems.length}, newlyFlagged=${newlyFlagged.length}`);
    if (!allLineItems.length) {
      console.log('No line items provided, skipping email');
      return false;
    }

    const supplier = allLineItems[0]['Supplier Name'] || 'Unknown';
    const siDoc = allLineItems[0]['SI Doc Number'] || 'N/A';

    const summarize = (item, idx) => {
      const desc = item['Item Description'] || 'Unnamed Item';
      const status = item['Inspection Status'] || 'N/A';
      const inspector = item['Inspector'] || 'Unknown';
      const qty = item['Quantity Shipped'] || '0';
      const asd = item['Actual Shipping Date'] || 'Not set';
      const notes = item['Inspection Notes'] || 'No notes';
      return `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Line ${idx + 1}</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${desc}</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${status}</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${qty}</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${asd}</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${inspector}</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${notes}</td></tr>`;
    };

    const summary = allLineItems.map((item, idx) => summarize(item, idx)).join('');
    const newly = newlyFlagged.map((item) => {
      const desc = item['Item Description'] || 'Unnamed Item';
      const status = item['Inspection Status'] || 'N/A';
      const idx = item['Line Item Index'] || 'N/A';
      return `<li><strong>Line ${idx}:</strong> ${desc} &rarr; ${status}</li>`;
    }).join('');

    const emailBody = `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6;">
<h2 style="color: #ff6b35;">INSPECTION ALERT DIGEST</h2>

<p><strong>PO Number:</strong> <strong style="font-size: 1.2em;">${poNumber}</strong></p>
<p><strong>Supplier:</strong> ${supplier}</p>
<p><strong>SI Doc Number:</strong> ${siDoc}</p>

<h3 style="color: #dc3545;">Triggered by new Incorrect/Missing updates:</h3>
<ul style="line-height: 2;">
${newly || '<li>No newly flagged items</li>'}
</ul>

<h3>All Line Items:</h3>
<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
<thead>
<tr style="background: #f5f5f5;">
<th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Line</th>
<th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Description</th>
<th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Status</th>
<th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Qty</th>
<th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Received Date</th>
<th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Inspector</th>
<th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Inspection Notes</th>
</tr>
</thead>
<tbody>
${summary}
</tbody>
</table>

<hr>
<p><em>Sports Plus Inspection System</em></p>
</body>
</html>
    `;

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
      to: getEmailRecipients(poNumber),
      subject: `⚠️ PO ${poNumber} - Incorrect/Missing Digest`,
      html: emailBody,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Status Digest Email Sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending status digest email:', error.message);
    return false;
  }
}

/**
 * Send email when all line items for a PO are complete
 * @param {string} poNumber - PO Number
 * @param {array} allLineItems - All line items for this PO from Google Sheet
 */
async function sendPOCompletionEmail(poNumber, allLineItems) {
  try {
    console.log(`📧 sendPOCompletionEmail called: PO=${poNumber}, lineItems=${allLineItems?.length || 0}`);
    if (!allLineItems || allLineItems.length === 0) {
      console.log('No line items to include in completion email');
      return false;
    }

    // Build line item summary
    let lineItemSummary = '';
    allLineItems.forEach((item, idx) => {
      const desc = item['Item Description'] || 'Unnamed Item';
      const qty = item['Quantity Shipped'] || '0';
      const total = item['Line Item Total'] || '0';
      const inspector = item['Inspector'] || 'Unknown';
      lineItemSummary += `\nLine Item ${idx + 1}: ${desc} - ${qty} units - $${total} (Inspector: ${inspector})`;
    });

    const supplier = allLineItems[0]['Supplier Name'] || 'Unknown';
    const siDoc = allLineItems[0]['SI Doc Number'] || 'N/A';
    const invoiceTotal = allLineItems[0]['Invoice Total'] || '0';
    const totalItems = allLineItems.length;

    const emailBody = `
ALL LINE ITEMS INSPECTED AND APPROVED

PO Number: ${poNumber}
Supplier: ${supplier}
SI Doc Number: ${siDoc}
Invoice Total: $${invoiceTotal}
Total Line Items: ${totalItems}

All items have been inspected and marked as COMPLETE.

Line Item Summary:${lineItemSummary}

This PO is ready to close.

---
Sports Plus Inspection System
    `;

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
      to: getEmailRecipients(poNumber),
      subject: `✅ ORDER COMPLETE - PO: ${poNumber}`,
      text: emailBody,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ PO Completion Email Sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending PO completion email:', error.message);
    return false;
  }
}

/**
 * Test email connection
 */
async function testEmailConnection() {
  try {
    await transporter.verify();
    console.log('✅ Email service connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Email service connection failed:', error.message);
    return false;
  }
}

module.exports = {
  sendIncorrectAlert,
  sendMissingAlert,
  sendIncompleteAlert,
  sendStatusDigest,
  sendPOCompletionEmail,
  testEmailConnection,
};
