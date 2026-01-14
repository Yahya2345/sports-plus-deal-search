require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

// Import our services
const googleSheets = require('./services/googleSheets');
const sportsInc = require('./services/sportsInc');
const email = require('./services/email');

const app = express();
const PORT = process.env.PORT || 8888;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint for Docker
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

function hasRealLineItems(invoice) {
  if (!invoice || !invoice._lineItems || invoice._lineItems.length === 0) return false;
  const firstDesc = invoice._lineItems[0]?.description || '';
  return !firstDesc.toUpperCase().includes('SEE VENDOR INVOICE');
}

// ========================================
// UNIFIED SEARCH ENDPOINT
// ========================================
/**
 * Main search endpoint that combines:
 * 1. Invoice data from Sports Inc (with Google Sheets caching)
 * 2. Google Sheets cached data
 */
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    console.log(`\n=== Unified Search for: ${query} ===`);

    // Fetch ALL invoices (active + historical) for this PO
    let invoices = [];
    try {
      invoices = await sportsInc.getAllInvoices(query);
    } catch (err) {
      console.error('Sports Inc fetch error:', err.message);
    }

    // NOTE: OCR extraction disabled - Sports Inc PDFs require authentication
    // The VendorInvoicePDF.aspx endpoint requires an active user session
    // To re-enable OCR, we would need either:
    // 1. Authentication cookies from a logged-in browser session
    // 2. A direct PDF download endpoint that doesn't require login
    // 3. Users to manually upload PDFs for extraction
    
    for (const invoice of invoices) {
      const missingLines = !hasRealLineItems(invoice);
      if (missingLines) {
        console.log('Invoice missing line items (OCR disabled - requires PDF access)', {
          po: invoice['PO Number'],
          siDoc: invoice['SI Doc Number'],
          lineItems: invoice._lineItems?.length || 0,
          note: 'Sports Inc PDFs require authentication to access'
        });
      }
    }

    // Best-effort: save SI invoice line items to Google Sheet (non-blocking)
    try {
      const savedCount = await googleSheets.saveLineItemsForPO(query, invoices);
      console.log(`✓ Saved ${savedCount} line item row(s) to Google Sheet for PO ${query}`);
    } catch (sheetErr) {
      console.warn('Google Sheet save skipped:', sheetErr.message);
    }

    // Return results with all invoices and cached data
    res.json({
      success: true,
      query,
      invoices: invoices, // Array of all invoices
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// GOOGLE SHEETS ENDPOINTS
// ========================================

/**
 * Get all cached invoices from Google Sheets
 */
app.get('/api/cache/invoices', async (req, res) => {
  try {
    const invoices = await googleSheets.getAllInvoices();
    res.json({
      success: true,
      count: invoices.length,
      invoices
    });
  } catch (error) {
    console.error('Get invoices error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Manually refresh cache for a specific PO Number
 */
app.post('/api/cache/refresh', async (req, res) => {
  try {
    const { poNumber } = req.body;

    if (!poNumber) {
      return res.status(400).json({ error: 'poNumber is required' });
    }

    // Force fetch from Sports Inc API
    const invoiceData = await sportsInc.getInvoiceFromSportsInc(poNumber);

    if (!invoiceData) {
      return res.status(404).json({ error: 'Invoice not found in Sports Inc API' });
    }

    // Update cache
    await googleSheets.saveInvoiceToSheet(invoiceData);

    res.json({
      success: true,
      invoice: invoiceData
    });

  } catch (error) {
    console.error('Cache refresh error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Test email service
 * GET /api/testEmail
 */
app.get('/api/testEmail', async (req, res) => {
  try {
    await email.testEmailConnection();
    
    // Send a test email
    const testLineItem = {
      'PO Number': 'TEST-PO-123',
      'SI Doc Number': 'TEST-DOC-456',
      'Line Item Index': '1',
      'Item Description': 'Test Item for Email Verification',
      'Quantity Shipped': '10',
      'Inspector': 'Test Inspector',
      'Inspection Status': 'Incomplete',
      'Inspection Notes': 'This is a test email from the Sports Plus system.'
    };
    
    await email.sendIncompleteAlert(testLineItem);
    
    res.json({
      success: true,
      message: 'Test email sent successfully! Check inbox at ' + process.env.EMAIL_TO
    });
  } catch (error) {
    console.error('Test email error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update line item fields in Google Sheet
 * POST /api/updateLineItem
 * Body: { poNumber, siDocNumber, lineItemIndex, updates: { fieldName: value, ... } }
 */
app.post('/api/updateLineItemsBulk', async (req, res) => {
  try {
    const { poNumber, siDocNumber, updates } = req.body;
    console.log(`🔵 /api/updateLineItemsBulk called: PO=${poNumber}, SIDoc=${siDocNumber}, updates count=${updates?.length || 0}`);

    if (!poNumber || !siDocNumber || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'poNumber, siDocNumber, and updates array are required' });
    }

    // Capture pre-update statuses to detect newly flagged items
    const beforeItems = await googleSheets.getLineItemsForPO(poNumber);
    const statusBefore = new Map();
    beforeItems.forEach(item => {
      const key = `${item['PO Number']}|${item['SI Doc Number']}|${item['Line Item Index']}`;
      statusBefore.set(key, (item['Inspection Status'] || '').trim());
    });

    let updatedCount = 0;
    for (const upd of updates) {
      if (!upd || !upd.lineItemIndex || !upd.updates) continue;
      const ok = await googleSheets.updateLineItemInSheet(
        poNumber,
        siDocNumber,
        Number(upd.lineItemIndex),
        upd.updates
      );
      if (ok) updatedCount += 1;
    }

    // Fetch post-update data
    const afterItems = await googleSheets.getLineItemsForPO(poNumber);
    const newlyFlagged = afterItems.filter(item => {
      const key = `${item['PO Number']}|${item['SI Doc Number']}|${item['Line Item Index']}`;
      const prev = statusBefore.get(key) || '';
      const curr = (item['Inspection Status'] || '').trim();
      // Check for Incorrect or Missing status (not Incomplete/Defective)
      return (curr === 'Incorrect' || curr === 'Missing') && curr !== prev;
    });

    console.log(`📧 Email check: newlyFlagged=${newlyFlagged.length}, statuses: ${newlyFlagged.map(i => i['Inspection Status']).join(', ')}`);

    let digestSent = false;
    if (newlyFlagged.length > 0) {
      digestSent = await email.sendStatusDigest(poNumber, afterItems, newlyFlagged);
    }

    let completionEmailSent = false;
    const poCompletion = await googleSheets.checkPOCompletion(poNumber);
    if (poCompletion.allComplete && poCompletion.lineItems.length > 0) {
      completionEmailSent = await email.sendPOCompletionEmail(poNumber, poCompletion.lineItems);
    }

    res.json({
      success: true,
      updated: updatedCount,
      digestSent,
      completionEmailSent,
    });
  } catch (error) {
    console.error('Bulk update error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update line item fields in Google Sheet
 * POST /api/updateLineItem
 * Body: { poNumber, siDocNumber, lineItemIndex, updates: { fieldName: value, ... } }
 */
app.post('/api/updateLineItem', async (req, res) => {
  try {
    const { poNumber, siDocNumber, lineItemIndex, updates } = req.body;

    if (!poNumber || !siDocNumber || !lineItemIndex || !updates) {
      return res.status(400).json({ error: 'poNumber, siDocNumber, lineItemIndex, and updates are required' });
    }

    console.log(`➡️ Update request: PO=${poNumber}, SIDoc=${siDocNumber}, Index=${lineItemIndex}`, updates);

    const success = await googleSheets.updateLineItemInSheet(
      poNumber,
      siDocNumber,
      Number(lineItemIndex),
      updates
    );

    if (!success) {
      return res.status(404).json({ error: 'Line item not found' });
    }

    // Get the updated line item data for email notification
    const lineItemData = await googleSheets.getLineItemData(
      poNumber,
      siDocNumber,
      Number(lineItemIndex)
    );

    // Check inspection status and send appropriate emails
    if (lineItemData) {
      const inspectionStatus = lineItemData['Inspection Status'] || '';
      console.log(`🔎 Inspection Status after update: ${inspectionStatus}`);

      // Send alert for Incomplete
      if (inspectionStatus === 'Incomplete') {
        setTimeout(() => {
          email.sendIncompleteAlert(lineItemData).catch(err => {
            console.error('Error in sendIncompleteAlert:', err);
          });
        }, 100);
      }

      // Send alert for Defective
      if (inspectionStatus === 'Defective') {
        setTimeout(() => {
          email.sendDefectiveAlert(lineItemData).catch(err => {
            console.error('Error in sendDefectiveAlert:', err);
          });
        }, 100);
      }

      // Check if ALL line items for this PO are now Complete
      if (inspectionStatus === 'Complete') {
        setTimeout(async () => {
          const poCompletion = await googleSheets.checkPOCompletion(poNumber);
          if (poCompletion.allComplete && poCompletion.lineItems.length > 0) {
            email.sendPOCompletionEmail(poNumber, poCompletion.lineItems).catch(err => {
              console.error('Error in sendPOCompletionEmail:', err);
            });
          }
        }, 100);
      }
    }

    res.json({
      success: true,
      message: `Updated line item: PO=${poNumber}, SIDoc=${siDocNumber}, Index=${lineItemIndex}`
    });

  } catch (error) {
    console.error('Update line item error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// SERVER
// ========================================

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   POST /api/search - Search invoices by PO Number`);
  console.log(`   POST /api/updateLineItemsBulk - Bulk update line items and send digest`);
  console.log(`   POST /api/updateLineItem - Update line item fields in Google Sheet`);
  console.log(`   GET  /api/testEmail - Test email service and send test email`);
  console.log(`   GET  /api/cache/invoices - Get all cached invoices`);
  console.log(`   POST /api/cache/refresh - Refresh cache for PO Number`);
  console.log(`\n✓ Google Sheets: ${process.env.GOOGLE_SHEETS_ID ? 'Configured' : 'NOT CONFIGURED'}`);
  console.log(`✓ Sports Inc API: ${process.env.SPORTSINC_API_KEY ? 'Configured' : 'NOT CONFIGURED'}`);
  console.log(`\n✅ Server is listening and ready for requests!\n`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});
