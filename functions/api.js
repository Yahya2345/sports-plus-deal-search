const axios = require('axios');
const googleSheets = require('../services/googleSheets');
const sportsInc = require('../services/sportsInc');
const email = require('../services/email');

const HUBSPOT_API_URL = 'https://api.hubapi.com';
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

const baseHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Content-Type': 'application/json'
};

const json = (statusCode, body) => ({
  statusCode,
  headers: baseHeaders,
  body: JSON.stringify(body)
});

const parseBody = (event) => {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch (_err) {
    return {};
  }
};

const normalizePath = (event) => {
  let path = event.path || '/';
  
  // Strip various possible prefixes
  const prefixes = ['/.netlify/functions/api', '/api'];
  for (const prefix of prefixes) {
    if (path.startsWith(prefix)) {
      path = path.slice(prefix.length) || '/';
      break;
    }
  }
  
  // Remove trailing slash
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  
  return path;
};

const hasRealLineItems = (invoice) => {
  if (!invoice || !invoice._lineItems || invoice._lineItems.length === 0) return false;
  const firstDesc = invoice._lineItems[0]?.description || '';
  return !firstDesc.toUpperCase().includes('SEE VENDOR INVOICE');
};

async function searchHubSpotDeals(query) {
  const response = await axios.post(
    `${HUBSPOT_API_URL}/crm/v3/objects/deals/search`,
    {
      filterGroups: [{
        filters: [{
          propertyName: 'sales_order_',
          operator: 'EQ',
          value: query
        }]
      }],
      properties: [],
      limit: 100
    },
    {
      headers: {
        Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.results || [];
}

async function handleSearch(event) {
  const { query } = parseBody(event);
  if (!query) return json(400, { error: 'Query parameter is required' });

  console.log(`\n=== Unified Search for: ${query} ===`);

  let invoices = [];
  try {
    invoices = await sportsInc.getAllInvoices(query);
  } catch (err) {
    console.error('Sports Inc fetch error:', err.message);
  }

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

  // Fetch existing data from Sheets to merge editable fields
  let sheetLineItems = [];
  try {
    sheetLineItems = await googleSheets.getLineItemsForPO(query);
    console.log(`✓ Found ${sheetLineItems.length} existing line items in Google Sheet for PO ${query}`);
  } catch (err) {
    console.warn('Google Sheet read skipped:', err.message);
  }

  // Build map of editable fields from Sheets by key: PO|SIDoc|LineItemIndex
  const sheetEditsMap = new Map();
  sheetLineItems.forEach((item) => {
    const key = `${item['PO Number']}|${item['SI Doc Number']}|${item['Line Item Index']}`;
    sheetEditsMap.set(key, {
      'Actual Shipping Date': item['Actual Shipping Date'],
      'Inspector': item['Inspector'],
      'Inspection Status': item['Inspection Status'],
      'Inspection Notes': item['Inspection Notes'],
      'Shelf Location': item['Shelf Location'],
      'Moved to Other Shelf': item['Moved to Other Shelf'],
      'New Shelf Location': item['New Shelf Location']
    });
  });

  // Merge editable fields from Sheets into API invoices
  for (const invoice of invoices) {
    if (Array.isArray(invoice._lineItems)) {
      invoice._lineItems.forEach((lineItem, idx) => {
        const key = `${invoice['PO Number']}|${invoice['SI Doc Number']}|${idx + 1}`;
        const sheetEdits = sheetEditsMap.get(key);
        if (sheetEdits) {
          lineItem.actualShippingDate = sheetEdits['Actual Shipping Date'];
          lineItem.inspector = sheetEdits['Inspector'];
          lineItem.inspectionStatus = sheetEdits['Inspection Status'];
          lineItem.inspectionNotes = sheetEdits['Inspection Notes'];
          lineItem.shelfLocation = sheetEdits['Shelf Location'];
          lineItem.movedToOtherShelf = sheetEdits['Moved to Other Shelf'];
          lineItem.newShelfLocation = sheetEdits['New Shelf Location'];
        }
      });
    }
  }

  const hubspotDeals = await searchHubSpotDeals(query).catch((err) => {
    console.error('HubSpot fetch error:', err.message);
    return [];
  });

  try {
    const savedCount = await googleSheets.saveLineItemsForPO(query, invoices);
    console.log(`✓ Saved ${savedCount} line item row(s) to Google Sheet for PO ${query}`);
  } catch (sheetErr) {
    console.warn('Google Sheet save skipped:', sheetErr.message);
  }

  return json(200, {
    success: true,
    query,
    invoices,
    deals: hubspotDeals,
    timestamp: new Date().toISOString()
  });
}

async function handleHubspotLineItems(event) {
  const { dealId } = parseBody(event);
  if (!dealId) return json(400, { error: 'dealId is required' });

  const associationsResponse = await axios.get(
    `${HUBSPOT_API_URL}/crm/v4/objects/deals/${dealId}/associations/line_items`,
    {
      headers: {
        Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const lineItemsData = associationsResponse.data.results || [];
  const lineItemIds = lineItemsData.map((item) => item.toObjectId);

  if (lineItemIds.length === 0) {
    return json(200, { lineItems: [] });
  }

  const lineItemsResponse = await axios.post(
    `${HUBSPOT_API_URL}/crm/v3/objects/line_items/batch/read`,
    {
      properties: ['name', 'quantity', 'price', 'amount', 'description', 'actual_shipping_date'],
      inputs: lineItemIds.map((id) => ({ id }))
    },
    {
      headers: {
        Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return json(200, {
    lineItems: lineItemsResponse.data.results || []
  });
}

async function handleHubspotBatchUpdate(event) {
  const { updates } = parseBody(event);
  if (!Array.isArray(updates) || updates.length === 0) {
    return json(400, { error: 'updates array is required' });
  }

  const toEpochMs = (val) => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      if (/^\d+$/.test(val)) return Number(val);
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.getTime();
    }
    return null;
  };

  const inputs = updates.map((u) => ({
    id: String(u.id),
    properties: {
      actual_shipping_date: toEpochMs(u.actual_shipping_date)
    }
  }));

  const updateResponse = await axios.post(
    `${HUBSPOT_API_URL}/crm/v3/objects/line_items/batch/update`,
    { inputs },
    {
      headers: {
        Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return json(200, { success: true, results: updateResponse.data.results || [] });
}

async function handleHubspotUpdateDeal(event) {
  const { dealId, propertyName, propertyValue } = parseBody(event);

  if (!dealId || !propertyName) {
    return json(400, { error: 'dealId and propertyName are required' });
  }

  const updateResponse = await axios.patch(
    `${HUBSPOT_API_URL}/crm/v3/objects/deals/${dealId}`,
    { properties: { [propertyName]: propertyValue } },
    {
      headers: {
        Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return json(200, {
    success: true,
    deal: updateResponse.data
  });
}

async function handleCacheInvoices() {
  const invoices = await googleSheets.getAllInvoices();
  return json(200, {
    success: true,
    count: invoices.length,
    invoices
  });
}

async function handleCacheRefresh(event) {
  const { poNumber } = parseBody(event);
  if (!poNumber) return json(400, { error: 'poNumber is required' });

  const invoiceData = await sportsInc.getInvoiceFromSportsInc(poNumber);
  if (!invoiceData) return json(404, { error: 'Invoice not found in Sports Inc API' });

  await googleSheets.saveInvoiceToSheet(invoiceData);

  return json(200, {
    success: true,
    invoice: invoiceData
  });
}

async function handleTestEmail() {
  await email.testEmailConnection();

  const testLineItem = {
    'PO Number': 'TEST-PO-123',
    'SI Doc Number': 'TEST-DOC-456',
    'Line Item Index': '1',
    'Item Description': 'Test Item for Email Verification',
    'Quantity Shipped': '10',
    Inspector: 'Test Inspector',
    'Inspection Status': 'Incomplete',
    'Inspection Notes': 'This is a test email from the Sports Plus system.'
  };

  await email.sendIncompleteAlert(testLineItem);

  return json(200, {
    success: true,
    message: 'Test email sent successfully! Check inbox at ' + process.env.EMAIL_TO
  });
}

async function handleUpdateLineItemsBulk(event) {
  const { poNumber, siDocNumber, updates } = parseBody(event);

  if (!poNumber || !siDocNumber || !Array.isArray(updates) || updates.length === 0) {
    return json(400, { error: 'poNumber, siDocNumber, and updates array are required' });
  }

  const beforeItems = await googleSheets.getLineItemsForPO(poNumber);
  const statusBefore = new Map();
  beforeItems.forEach((item) => {
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

  const afterItems = await googleSheets.getLineItemsForPO(poNumber);
  const newlyFlagged = afterItems.filter((item) => {
    const key = `${item['PO Number']}|${item['SI Doc Number']}|${item['Line Item Index']}`;
    const prev = statusBefore.get(key) || '';
    const curr = (item['Inspection Status'] || '').trim();
    return (curr === 'Incomplete' || curr === 'Defective') && curr !== prev;
  });

  let digestSent = false;
  if (newlyFlagged.length > 0) {
    digestSent = await email.sendStatusDigest(poNumber, afterItems, newlyFlagged);
  }

  let completionEmailSent = false;
  const poCompletion = await googleSheets.checkPOCompletion(poNumber);
  if (poCompletion.allComplete && poCompletion.lineItems.length > 0) {
    completionEmailSent = await email.sendPOCompletionEmail(poNumber, poCompletion.lineItems);
  }

  return json(200, {
    success: true,
    updated: updatedCount,
    digestSent,
    completionEmailSent
  });
}

async function handleUpdateLineItem(event) {
  const { poNumber, siDocNumber, lineItemIndex, updates } = parseBody(event);

  if (!poNumber || !siDocNumber || !lineItemIndex || !updates) {
    return json(400, { error: 'poNumber, siDocNumber, lineItemIndex, and updates are required' });
  }

  const success = await googleSheets.updateLineItemInSheet(
    poNumber,
    siDocNumber,
    Number(lineItemIndex),
    updates
  );

  if (!success) {
    return json(404, { error: 'Line item not found' });
  }

  const lineItemData = await googleSheets.getLineItemData(
    poNumber,
    siDocNumber,
    Number(lineItemIndex)
  );

  if (lineItemData) {
    const inspectionStatus = lineItemData['Inspection Status'] || '';

    if (inspectionStatus === 'Incomplete') {
      await email.sendIncompleteAlert(lineItemData);
    }

    if (inspectionStatus === 'Defective') {
      await email.sendDefectiveAlert(lineItemData);
    }

    if (inspectionStatus === 'Complete') {
      const poCompletion = await googleSheets.checkPOCompletion(poNumber);
      if (poCompletion.allComplete && poCompletion.lineItems.length > 0) {
        await email.sendPOCompletionEmail(poNumber, poCompletion.lineItems);
      }
    }
  }

  return json(200, {
    success: true,
    message: `Updated line item: PO=${poNumber}, SIDoc=${siDocNumber}, Index=${lineItemIndex}`
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  const path = normalizePath(event);
  const method = event.httpMethod || 'GET';
  
  console.log('API Request:', { rawPath: event.path, normalizedPath: path, method });

  try {
    if (path === '/search' && method === 'POST') return await handleSearch(event);
    if (path === '/hubspot/lineItems' && method === 'POST') return await handleHubspotLineItems(event);
    if (path === '/hubspot/lineItems/batchUpdate' && method === 'POST') return await handleHubspotBatchUpdate(event);
    if (path === '/hubspot/updateDeal' && method === 'POST') return await handleHubspotUpdateDeal(event);
    if (path === '/cache/invoices' && method === 'GET') return await handleCacheInvoices(event);
    if (path === '/cache/refresh' && method === 'POST') return await handleCacheRefresh(event);
    if (path === '/testEmail' && method === 'GET') return await handleTestEmail(event);
    if (path === '/updateLineItemsBulk' && method === 'POST') return await handleUpdateLineItemsBulk(event);
    if (path === '/updateLineItem' && method === 'POST') return await handleUpdateLineItem(event);

    return json(404, { error: `Route not found: ${method} ${path}` });
  } catch (error) {
    const msg = error.response?.data || error.message;
    console.error('Handler error:', msg);
    return json(500, { error: typeof msg === 'string' ? msg : JSON.stringify(msg) });
  }
};
