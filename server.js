require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

// Import our services
const googleSheets = require('./services/googleSheets');
const sportsInc = require('./services/sportsInc');
const email = require('./services/email');
const backlog = require('./services/backlog');
const backlogChecker = require('./services/backlogChecker');

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

    // Merge editable fields from Google Sheets back into invoices
    try {
      const sheetLineItems = await googleSheets.getLineItemsForPO(query);
      console.log(`✓ Retrieved ${sheetLineItems.length} line item(s) from Google Sheet for merge`);
      
      if (sheetLineItems.length > 0) {
        console.log('📋 Sample sheet data:', JSON.stringify(sheetLineItems[0], null, 2));
      }
      
      // Merge editable fields into each invoice's line items
      for (const invoice of invoices) {
        if (!invoice._lineItems || !Array.isArray(invoice._lineItems)) {
          console.log(`⚠️ No line items array for invoice ${invoice['SI Doc Number']}`);
          continue;
        }
        
        console.log(`🔍 Processing invoice ${invoice['SI Doc Number']} with ${invoice._lineItems.length} line items`);
        
        for (let idx = 0; idx < invoice._lineItems.length; idx++) {
          const lineItem = invoice._lineItems[idx];
          const lineItemIndex = idx + 1; // 1-based index for Google Sheets
          
          // Normalize for comparison (convert to string and trim)
          const invPO = String(invoice['PO Number']).trim();
          const invSIDoc = String(invoice['SI Doc Number']).trim();
          const invIdx = String(lineItemIndex).trim();
          
          console.log(`🔍 Looking for: PO="${invPO}" SIDoc="${invSIDoc}" Idx="${invIdx}"`);
          
          // Find matching row in Google Sheets by PO, SI Doc, and Line Item Index
          const sheetMatch = sheetLineItems.find(sl => {
            const sheetPO = String(sl['PO Number'] || '').trim();
            const sheetSIDoc = String(sl['SI Doc Number'] || '').trim();
            const sheetIdx = String(sl['Line Item Index'] || '').trim();
            
            const match = sheetPO === invPO && sheetSIDoc === invSIDoc && sheetIdx === invIdx;
            
            if (!match && sheetPO === invPO) {
              console.log(`  ❌ Mismatch: Sheet SIDoc="${sheetSIDoc}" vs Inv="${invSIDoc}", Sheet Idx="${sheetIdx}" vs Inv="${invIdx}"`);
            }
            
            return match;
          });
          
          if (sheetMatch) {
            // Merge editable fields from Google Sheets
            lineItem.actualShippingDate = sheetMatch['Actual Shipping Date'] || '';
            lineItem.inspector = sheetMatch['Inspector'] || '';
            lineItem.inspectionStatus = sheetMatch['Inspection Status'] || '';
            lineItem.inspectionNotes = sheetMatch['Inspection Notes'] || '';
            lineItem.movedToOtherShelf = sheetMatch['Moved to Other Shelf'] || '';
            lineItem.trackingNumber = sheetMatch['Tracking Number'] || '';
            
            console.log(`✅ Merged line item ${lineItemIndex}: Status="${lineItem.inspectionStatus}", Shelf="${lineItem.movedToOtherShelf}", Tracking="${lineItem.trackingNumber}", Notes="${lineItem.inspectionNotes}"`);
          } else {
            console.log(`⚠️ No sheet match for PO="${invPO}" SIDoc="${invSIDoc}" Idx=${invIdx}"`);
          }
        }
      }
    } catch (mergeErr) {
      console.error('❌ Google Sheet merge error:', mergeErr.message);
    }

    // Return results with all invoices and cached data
    res.json({
      success: true,
      query,
      invoices: invoices, // Array of all invoices with merged editable fields
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
 * POST /api/updateTrackingNumber
 * Update tracking number for all line items of a specific invoice
 */
app.post('/api/updateTrackingNumber', async (req, res) => {
  try {
    const { poNumber, siDocNumber, trackingNumber } = req.body;
    
    if (!poNumber || !siDocNumber) {
      return res.status(400).json({ error: 'poNumber and siDocNumber are required' });
    }

    console.log(`📦 Updating tracking number for PO: ${poNumber}, SI Doc: ${siDocNumber}, Tracking: ${trackingNumber}`);

    // Get all line items for this specific invoice
    const allItems = await googleSheets.getLineItemsForPO(poNumber);
    const invoiceItems = allItems.filter(item => 
      item['SI Doc Number'] === siDocNumber
    );

    if (invoiceItems.length === 0) {
      return res.status(404).json({ error: 'No line items found for this invoice' });
    }

    // Update tracking number for all line items of this invoice
    const updates = invoiceItems.map((item, idx) => ({
      lineItemIndex: item['Line Item Index'] || (idx + 1),
      updates: { 'Tracking Number': trackingNumber }
    }));

    const updatedCount = await googleSheets.updateLineItemsBulkInSheet(
      poNumber,
      siDocNumber,
      updates
    );

    console.log(`✅ Updated tracking number for ${updatedCount} line items`);

    res.json({
      success: true,
      updated: updatedCount,
      message: `Tracking number updated for ${updatedCount} line items`
    });

  } catch (error) {
    console.error('Update tracking number error:', error.message);
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
 * POST /api/checkAndSendAlerts
 * Check for flagged items and send email alerts after all updates are complete
 */
app.post('/api/checkAndSendAlerts', async (req, res) => {
  try {
    const { poNumber } = req.body;
    console.log(`📧 /api/checkAndSendAlerts called: PO=${poNumber}`);

    if (!poNumber) {
      return res.status(400).json({ error: 'poNumber is required' });
    }

    // Get all current line items for this PO
    const allItems = await googleSheets.getLineItemsForPO(poNumber);
    
    // Find all items with Incorrect or Missing status
    const flaggedItems = allItems.filter(item => {
      const status = (item['Inspection Status'] || '').trim();
      return status === 'Incorrect' || status === 'Missing';
    });

    console.log(`📧 Email check for PO ${poNumber}: flaggedItems=${flaggedItems.length}, total items=${allItems.length}`);
    console.log(`📧 Flagged statuses: ${flaggedItems.map(i => i['Inspection Status']).join(', ')}`);

    let digestSent = false;
    if (flaggedItems.length > 0) {
      const recipients = email.getEmailRecipients ? email.getEmailRecipients(poNumber) : 'default recipients';
      console.log(`📧 Sending digest email for ${flaggedItems.length} flagged items to: ${recipients}`);
      digestSent = await email.sendStatusDigest(poNumber, allItems, flaggedItems);
    }

    let completionEmailSent = false;
    const poCompletion = await googleSheets.checkPOCompletion(poNumber);
    if (poCompletion.allComplete && poCompletion.lineItems.length > 0) {
      console.log(`📧 PO ${poNumber} is complete, sending completion email`);
      completionEmailSent = await email.sendPOCompletionEmail(poNumber, poCompletion.lineItems);
    }

    res.json({
      success: true,
      digestSent,
      completionEmailSent,
      flaggedCount: flaggedItems.length
    });
  } catch (error) {
    console.error('Check alerts error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update line item fields in Google Sheet
 * POST /api/updateLineItemsBulk
 * Body: { poNumber, siDocNumber, updates: [{ lineItemIndex, updates: {...} }] }
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

    // Use BULK update for speed (single read + batch write instead of loop)
    console.log(`⚡ Using bulk update for ${updates.length} line items`);
    const updatedCount = await googleSheets.updateLineItemsBulkInSheet(
      poNumber,
      siDocNumber,
      updates
    );

    console.log(`✅ Bulk update complete: ${updatedCount} line items updated in Google Sheets`);

    res.json({
      success: true,
      updated: updatedCount
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
// BACKLOG ENDPOINTS
// ========================================

/**
 * Add PO to backlog
 * POST /api/backlog/add
 * Body: { poNumber, addedBy }
 */
app.post('/api/backlog/add', async (req, res) => {
  try {
    const { poNumber } = req.body;

    if (!poNumber) {
      return res.status(400).json({ error: 'poNumber is required' });
    }

    console.log(`📋 Adding PO ${poNumber} to backlog`);

    const result = await backlog.addToBacklog(poNumber);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json({ success: true, message: result.message });

  } catch (error) {
    console.error('❌ Error adding to backlog:', error.message);
    res.status(500).json({ error: 'Failed to add to backlog' });
  }
});

/**
 * Get all backlog items
 * GET /api/backlog/list
 */
app.get('/api/backlog/list', async (req, res) => {
  try {
    console.log('📋 Fetching backlog list...');

    const backlogItems = await backlog.getBacklogList();

    res.json({ success: true, backlog: backlogItems });

  } catch (error) {
    console.error('❌ Error fetching backlog:', error.message);
    res.status(500).json({ error: 'Failed to fetch backlog' });
  }
});

/**
 * Remove PO from backlog
 * DELETE /api/backlog/remove/:poNumber
 */
app.delete('/api/backlog/remove/:poNumber', async (req, res) => {
  try {
    const { poNumber } = req.params;

    if (!poNumber) {
      return res.status(400).json({ error: 'poNumber is required' });
    }

    console.log(`📋 Removing PO ${poNumber} from backlog`);

    const result = await backlog.removeFromBacklog(poNumber);

    if (!result.success) {
      return res.status(404).json({ error: result.message });
    }

    res.json({ success: true, message: result.message });

  } catch (error) {
    console.error('❌ Error removing from backlog:', error.message);
    res.status(500).json({ error: 'Failed to remove from backlog' });
  }
});

/**
 * Test backlog checker manually
 * GET /api/backlog/test
 */
app.get('/api/backlog/test', async (req, res) => {
  try {
    console.log('🧪 Manual backlog test triggered...');
    
    // Run the backlog checker immediately
    await backlogChecker.checkBacklogPOs();
    
    res.json({ 
      success: true, 
      message: 'Backlog check completed. Check console for results.' 
    });

  } catch (error) {
    console.error('❌ Error running backlog test:', error.message);
    res.status(500).json({ error: 'Failed to run backlog test' });
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
  console.log(`   POST /api/updateTrackingNumber - Update tracking number for all line items of an invoice`);
  console.log(`   GET  /api/testEmail - Test email service and send test email`);
  console.log(`   GET  /api/cache/invoices - Get all cached invoices`);
  console.log(`   POST /api/cache/refresh - Refresh cache for PO Number`);
  console.log(`   POST /api/backlog/add - Add PO to backlog`);
  console.log(`   GET  /api/backlog/list - Get all backlog items`);
  console.log(`   DELETE /api/backlog/remove/:poNumber - Remove PO from backlog`);
  console.log(`   GET  /api/backlog/test - Test backlog checker manually`);
  console.log(`\n✓ Google Sheets: ${process.env.GOOGLE_SHEETS_ID ? 'Configured' : 'NOT CONFIGURED'}`);
  console.log(`✓ Sports Inc API: ${process.env.SPORTSINC_API_KEY ? 'Configured' : 'NOT CONFIGURED'}`);
  console.log(`\n✅ Server is listening and ready for requests!\n`);
  
  // Start daily backlog checker
  backlogChecker.startBacklogChecker();
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});
