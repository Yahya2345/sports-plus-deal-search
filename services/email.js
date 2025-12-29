const nodemailer = require('nodemailer');

// Initialize Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD, // App password, not Gmail password
  },
});

/**
 * Send email for incomplete line item
 * @param {object} lineItemData - Line item data with all columns A-U
 */
async function sendIncompleteAlert(lineItemData) {
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
    const shelfLoc = lineItemData['Shelf Location'] || 'Not assigned';

    const emailBody = `
INSPECTION STATUS: INCOMPLETE

PO Number: ${po}
SI Doc Number: ${siDoc}
Line Item Index: ${liIndex}
Item Description: ${itemDesc}
Quantity Shipped: ${qty}
Unit Price: $${price}
Line Item Total: $${total}

Inspector: ${inspector}
Actual Shipping Date: ${lineItemData['Actual Shipping Date'] || 'Not set'}
Inspection Notes: ${notes}
Shelf Location: ${shelfLoc}
Moved to Other Shelf: ${lineItemData['Moved to Other Shelf'] || 'Not set'}
New Shelf Location: ${lineItemData['New Shelf Location'] || 'Not set'}

Supplier: ${supplier}
SI Doc Date: ${lineItemData['SI Doc Date'] || 'N/A'}
Ship Date: ${lineItemData['Ship Date'] || 'N/A'}
Invoice Total: $${lineItemData['Invoice Total'] || '0'}

ACTION REQUIRED: Please review this incomplete line item.
Last Updated: ${lineItemData['Last Updated'] || new Date().toISOString()}

---
Sports Plus Inspection System
    `;

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      subject: `⚠️ INCOMPLETE - PO: ${po} | Line Item #${liIndex}`,
      text: emailBody,
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
 * Send email for defective line item
 * @param {object} lineItemData - Line item data with all columns A-U
 */
async function sendDefectiveAlert(lineItemData) {
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
    const shelfLoc = lineItemData['Shelf Location'] || 'Not assigned';

    const emailBody = `
INSPECTION STATUS: DEFECTIVE

PO Number: ${po}
SI Doc Number: ${siDoc}
Line Item Index: ${liIndex}
Item Description: ${itemDesc}
Quantity Shipped: ${qty}
Unit Price: $${price}
Line Item Total: $${total}

Inspector: ${inspector}
Actual Shipping Date: ${lineItemData['Actual Shipping Date'] || 'Not set'}
Inspection Notes: ${notes}
Shelf Location: ${shelfLoc}
Moved to Other Shelf: ${lineItemData['Moved to Other Shelf'] || 'Not set'}
New Shelf Location: ${lineItemData['New Shelf Location'] || 'Not set'}

Supplier: ${supplier}
SI Doc Date: ${lineItemData['SI Doc Date'] || 'N/A'}
Ship Date: ${lineItemData['Ship Date'] || 'N/A'}
Invoice Total: $${lineItemData['Invoice Total'] || '0'}

ACTION REQUIRED: Defective items need immediate attention.
Last Updated: ${lineItemData['Last Updated'] || new Date().toISOString()}

---
Sports Plus Inspection System
    `;

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      subject: `🚨 DEFECTIVE - PO: ${po} | Line Item #${liIndex}`,
      text: emailBody,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Defective Alert Email Sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending defective alert email:', error.message);
    return false;
  }
}

/**
 * Send aggregated status digest for Incomplete/Defective line items
 * @param {string} poNumber
 * @param {Array<Object>} allLineItems - all line items for the PO (post-update)
 * @param {Array<Object>} newlyFlagged - line items that just became Incomplete/Defective
 */
async function sendStatusDigest(poNumber, allLineItems = [], newlyFlagged = []) {
  try {
    if (!allLineItems.length) return false;

    const supplier = allLineItems[0]['Supplier Name'] || 'Unknown';
    const siDoc = allLineItems[0]['SI Doc Number'] || 'N/A';

    const summarize = (item, idx) => {
      const desc = item['Item Description'] || 'Unnamed Item';
      const status = item['Inspection Status'] || 'N/A';
      const inspector = item['Inspector'] || 'Unknown';
      const qty = item['Quantity Shipped'] || '0';
      const notes = item['Inspection Notes'] || 'No notes';
      return `Line ${idx + 1}: ${desc}\nStatus: ${status}\nQty: ${qty}\nInspector: ${inspector}\nNotes: ${notes}\n`;
    };

    const summary = allLineItems.map(summarize).join('\n');
    const newly = newlyFlagged.map((item) => {
      const desc = item['Item Description'] || 'Unnamed Item';
      const status = item['Inspection Status'] || 'N/A';
      const idx = item['Line Item Index'] || 'N/A';
      return `• Line ${idx}: ${desc} -> ${status}`;
    }).join('\n');

    const emailBody = `
INSPECTION ALERT DIGEST

PO Number: ${poNumber}
Supplier: ${supplier}
SI Doc Number: ${siDoc}

Triggered by new Incomplete/Defective updates:
${newly || 'No newly flagged items'}

All Line Items:
${summary}
---
Sports Plus Inspection System
    `;

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      subject: `⚠️ PO ${poNumber} - Incomplete/Defective Digest`,
      text: emailBody,
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
      to: process.env.EMAIL_TO,
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
  sendIncompleteAlert,
  sendDefectiveAlert,
  sendStatusDigest,
  sendPOCompletionEmail,
  testEmailConnection,
};
