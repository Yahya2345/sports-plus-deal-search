const { google } = require('googleapis');

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SHEET_NAME = 'Invoice Data'; // Main sheet for storing invoice and line item data

// Initialize Google Sheets API
const getGoogleSheetsClient = () => {
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
  
  // Remove quotes if present
  privateKey = privateKey.replace(/^["']|["']$/g, '');
  
  // Handle escaped \n
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  // Handle space-separated format (Netlify issue)
  else if (!privateKey.includes('\n') && privateKey.includes(' ')) {
    // Split by spaces and rejoin with newlines, keeping header/footer intact
    privateKey = privateKey
      .replace(/-----BEGIN PRIVATE KEY----- /g, '-----BEGIN PRIVATE KEY-----\n')
      .replace(/ -----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----')
      .replace(/(.{64})\s+/g, '$1\n'); // Add newline every 64 chars
  }
  
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
};

/**
 * Get invoice data from Google Sheet by PO Number
 * @param {string} poNumber - PO Number to search for
 * @returns {Object|null} Invoice data if found, null otherwise
 */
async function getInvoiceFromSheet(poNumber) {
  try {
    const sheets = getGoogleSheetsClient();

    // Get all rows from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:ZZ`, // Get all columns
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in Google Sheet');
      return null;
    }

    // First row is headers
    const headers = rows[0];

    // Find the row with matching PO Number (column A)
    const dataRow = rows.slice(1).find(row => row[0] === poNumber);

    if (!dataRow) {
      console.log(`PO Number ${poNumber} not found in Google Sheet`);
      return null;
    }

    // Convert row to object using headers
    const invoiceData = {};
    headers.forEach((header, index) => {
      invoiceData[header] = dataRow[index] || '';
    });

    console.log(`Found invoice data for PO ${poNumber} in Google Sheet`);
    return invoiceData;

  } catch (error) {
    console.error('Error reading from Google Sheet:', error.message);
    throw error;
  }
}

/**
 * Save invoice data to Google Sheet
 * @param {Object} invoiceData - Invoice data object
 * @returns {boolean} Success status
 */
async function saveInvoiceToSheet(invoiceData) {
  try {
    const sheets = getGoogleSheetsClient();

    // Get current headers
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:ZZ1`,
    });

    let headers = headerResponse.data.values ? headerResponse.data.values[0] : [];

    // If no headers exist, create them from invoiceData keys
    if (headers.length === 0) {
      headers = Object.keys(invoiceData);
      headers.push('Last Updated'); // Add timestamp column

      // Write headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        resource: {
          values: [headers],
        },
      });

      console.log('Created headers in Google Sheet:', headers);
    }

    // Add Last Updated timestamp
    invoiceData['Last Updated'] = new Date().toISOString();

    // Prepare row data in the same order as headers
    const rowData = headers.map(header => invoiceData[header] || '');

    // Check if PO Number already exists
    const allDataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:A`,
    });

    const existingPONumbers = allDataResponse.data.values
      ? allDataResponse.data.values.slice(1).flat()
      : [];

    const poNumber = invoiceData['PO Number'] || invoiceData['poNumber'];
    const existingRowIndex = existingPONumbers.indexOf(poNumber);

    if (existingRowIndex >= 0) {
      // Update existing row (add 2: 1 for header, 1 for 0-based index)
      const rowNumber = existingRowIndex + 2;

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${rowNumber}`,
        valueInputOption: 'RAW',
        resource: {
          values: [rowData],
        },
      });

      console.log(`Updated existing row ${rowNumber} for PO ${poNumber}`);
    } else {
      // Append new row
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:A`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [rowData],
        },
      });

      console.log(`Added new row for PO ${poNumber}`);
    }

    return true;

  } catch (error) {
    console.error('Error saving to Google Sheet:', error.message);
    throw error;
  }
}

/**
 * Get all invoice data from Google Sheet
 * @returns {Array} Array of invoice objects
 */
async function getAllInvoices() {
  try {
    const sheets = getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:ZZ`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    const headers = rows[0];
    const invoices = rows.slice(1).map(row => {
      const invoice = {};
      headers.forEach((header, index) => {
        invoice[header] = row[index] || '';
      });
      return invoice;
    });

    return invoices;

  } catch (error) {
    console.error('Error getting all invoices:', error.message);
    throw error;
  }
}

module.exports = {
  getInvoiceFromSheet,
  saveInvoiceToSheet,
  getAllInvoices,
  /**
   * Update a specific line item row in Google Sheet by PO + SI Doc + Line Item Index
   * @param {string} poNumber - PO Number
   * @param {string} siDocNumber - SI Doc Number
   * @param {number} lineItemIndex - Line Item Index (1-based)
   * @param {Object} updates - Fields to update (key: column name, value: new value)
   * @returns {Promise<boolean>} True if updated, false if not found
   */
  updateLineItemInSheet: async function updateLineItemInSheet(poNumber, siDocNumber, lineItemIndex, updates) {
    try {
      const sheets = getGoogleSheetsClient();
      
      // Normalize inputs
      poNumber = (poNumber || '').trim();
      siDocNumber = String(siDocNumber || '').trim();
      lineItemIndex = Number(lineItemIndex);

      // Get all rows to find the target
      const resp = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:S`,
      });

      const rows = resp.data.values || [];
      if (rows.length === 0) return false;

      let headers = rows[0];
      // Ensure extended headers (A–U) exist so we can update Q (Inspection Status)
      const expectedHeaders = [
        'PO Number', 'SI Doc Number', 'SI Doc Date', 'Supplier Name', 'Ship Date', 'Invoice Total',
        'Invoice Status', 'Line Item Index', 'Item Description', 'Quantity Shipped', 'Unit Price',
        'Line Item Total', 'Item Status', 'Last Updated', 'Actual Shipping Date', 'Inspector',
        'Inspection Status', 'Inspection Notes', 'Moved to Other Shelf'
      ];
      const headersMissingExtended = headers.length < expectedHeaders.length || expectedHeaders.some(h => !headers.includes(h));
      if (headersMissingExtended) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A1`,
          valueInputOption: 'RAW',
          resource: { values: [expectedHeaders] },
        });
        headers = expectedHeaders;
      }
      let targetRowIndex = -1;

      // Find row matching PO + SI Doc + Line Item Index
      console.log(`DEBUG updateLineItem: Looking for PO="${poNumber}", SIDoc="${siDocNumber}", Idx=${lineItemIndex}`);
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowPO = (row[headers.indexOf('PO Number')] || '').trim();
        const rowSIDoc = String(row[headers.indexOf('SI Doc Number')] || '').trim();
        const rowIdxRaw = (row[headers.indexOf('Line Item Index')] || '').toString().trim();
        const rowIdxNum = parseInt(rowIdxRaw, 10);

        if (rowPO === poNumber) {
          console.log(`  Row ${i + 1}: rowPO="${rowPO}" rowSIDoc="${rowSIDoc}" rowIdx=${rowIdxNum}`);
        }

        if (rowPO === poNumber && rowSIDoc === siDocNumber && rowIdxNum === lineItemIndex) {
          targetRowIndex = i + 1; // Google Sheets uses 1-based row numbers
          console.log(`  ✓ Found match at row ${targetRowIndex}`);
          break;
        }
      }

      if (targetRowIndex === -1) {
        console.log(`Line item not found: PO=${poNumber}, SIDoc=${siDocNumber}, Index=${lineItemIndex}`);
        return false;
      }

      // Build update values (preserve existing, update provided)
      const existingRow = rows[targetRowIndex - 1];
      const updateRow = existingRow.slice(); // Clone

      // Pad row to 19 columns so O–S can be written reliably
      for (let i = 0; i < headers.length; i++) {
        if (typeof updateRow[i] === 'undefined') updateRow[i] = '';
      }

      // Apply updates
      for (const [colName, value] of Object.entries(updates)) {
        const colIdx = headers.indexOf(colName);
        if (colIdx >= 0) {
          updateRow[colIdx] = value;
        }
      }

      // Write back to sheet
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${targetRowIndex}:S${targetRowIndex}`,
        valueInputOption: 'RAW',
        resource: { values: [updateRow] },
      });

      console.log(`✓ Updated line item: PO=${poNumber}, SIDoc=${siDocNumber}, Index=${lineItemIndex}`);
      return true;

    } catch (error) {
      console.error('Error updating line item:', error.message);
      throw error;
    }
  },

  /**
   * Bulk update multiple line items for a PO/SI doc using a single read + batch update to avoid rate limits.
   * @param {string} poNumber
   * @param {string} siDocNumber
   * @param {Array<{ lineItemIndex: number, updates: Object }>} updatesArr
   * @returns {Promise<number>} count of rows updated
   */
  updateLineItemsBulkInSheet: async function updateLineItemsBulkInSheet(poNumber, siDocNumber, updatesArr) {
    if (!Array.isArray(updatesArr) || updatesArr.length === 0) return 0;

    try {
      const sheets = getGoogleSheetsClient();

      // Single read of headers + all rows for this sheet range
      const resp = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:S`,
      });

      const rows = resp.data.values || [];
      if (rows.length === 0) return 0;

      let headers = rows[0];
      const expectedHeaders = [
        'PO Number', 'SI Doc Number', 'SI Doc Date', 'Supplier Name', 'Ship Date', 'Invoice Total',
        'Invoice Status', 'Line Item Index', 'Item Description', 'Quantity Shipped', 'Unit Price',
        'Line Item Total', 'Item Status', 'Last Updated', 'Actual Shipping Date', 'Inspector',
        'Inspection Status', 'Inspection Notes', 'Moved to Other Shelf'
      ];

      // Ensure headers
      const headersMissingExtended = headers.length < expectedHeaders.length || expectedHeaders.some(h => !headers.includes(h));
      if (headersMissingExtended) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A1`,
          valueInputOption: 'RAW',
          resource: { values: [expectedHeaders] },
        });
        headers = expectedHeaders;
      }

      // Build lookup: key = PO|SI|Idx -> row number
      const rowLookup = new Map();
      console.log(`DEBUG bulkUpdate: Available headers: ${JSON.stringify(headers)}`);
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowPO = (row[headers.indexOf('PO Number')] || '').trim();
        const rowSIDoc = String(row[headers.indexOf('SI Doc Number')] || '').trim();
        const rowIdxRaw = (row[headers.indexOf('Line Item Index')] || '').toString().trim();
        const rowIdxNum = parseInt(rowIdxRaw, 10);
        const key = `${rowPO}|${rowSIDoc}|${rowIdxNum}`;
        if (rowPO && rowPO === poNumber) {
          console.log(`DEBUG bulkUpdate Row ${i + 1}: PO="${rowPO}" SIDoc="${rowSIDoc}" Idx=${rowIdxNum} key="${key}"`);
        }
        rowLookup.set(key, { rowNumber: i + 1, existingRow: row });
      }

      const data = [];
      const nowIso = new Date().toISOString();

      for (const upd of updatesArr) {
        if (!upd || !upd.lineItemIndex || !upd.updates) continue;
        const key = `${poNumber}|${siDocNumber}|${Number(upd.lineItemIndex)}`;
        console.log(`DEBUG bulkUpdate: Searching for key: "${key}"`);
        const found = rowLookup.get(key);
        if (!found) {
          console.log(`Line item not found for bulk update: ${key}. Available keys: ${Array.from(rowLookup.keys()).filter(k => k.startsWith(poNumber)).slice(0, 10).join(', ')}`);
          continue;
        }

        const updateRow = found.existingRow.slice();
        // Pad row to headers length
        for (let i = 0; i < headers.length; i++) {
          if (typeof updateRow[i] === 'undefined') updateRow[i] = '';
        }

        // Apply updates
        for (const [colName, value] of Object.entries(upd.updates)) {
          const colIdx = headers.indexOf(colName);
          if (colIdx >= 0) {
            updateRow[colIdx] = value;
          }
        }

        // Keep Last Updated fresh if present
        const lastUpdatedIdx = headers.indexOf('Last Updated');
        if (lastUpdatedIdx >= 0) updateRow[lastUpdatedIdx] = nowIso;

        data.push({
          range: `${SHEET_NAME}!A${found.rowNumber}:S${found.rowNumber}`,
          values: [updateRow]
        });
      }

      if (data.length === 0) return 0;

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          valueInputOption: 'RAW',
          data
        }
      });

      console.log(`✅ Bulk updated ${data.length} line items in one request`);
      return data.length;
    } catch (error) {
      console.error('Error bulk updating line items:', error.message);
      throw error;
    }
  },

  /**
   * Save ALL SI invoice line items as individual rows into Google Sheet.
   * Expects headers including 19 columns (A-S):
   * [
   *  'PO Number','SI Doc Number','SI Doc Date','Supplier Name','Ship Date','Invoice Total',
   *  'Invoice Status','Line Item Index','Item Description','Quantity Shipped','Unit Price',
   *  'Line Item Total','Item Status','Last Updated','Actual Shipping Date','Inspector',
   *  'Inspection Status','Inspection Notes','Moved to Other Shelf'
   * ]
   *
   * @param {string} poNumber - PO Number searched
   * @param {Array<Object>} invoices - Array of normalized invoice objects (from sportsInc.getAllInvoices)
   * @returns {Promise<number>} Number of rows appended
   */
  saveLineItemsForPO: async function saveLineItemsForPO(poNumber, invoices) {
    const sheets = getGoogleSheetsClient();

    // Read headers to determine order (up to column U = 21 columns)
    const headerResp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:U1`,
    });
    const headers = headerResp.data.values ? headerResp.data.values[0] : [];

    // Extended header set with 7 new columns (O-U)
    const expected = [
      'PO Number', 'SI Doc Number', 'SI Doc Date', 'Supplier Name', 'Ship Date', 'Invoice Total',
      'Invoice Status', 'Line Item Index', 'Item Description', 'Quantity Shipped', 'Unit Price',
      'Line Item Total', 'Item Status', 'Last Updated', 'Actual Shipping Date', 'Inspector',
      'Inspection Status', 'Inspection Notes', 'Moved to Other Shelf'
    ];

    if (!headers || headers.length === 0) {
      // Initialize headers if missing
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        resource: { values: [expected] },
      });
    }

    // Use whichever headers exist; default to expected order
    const cols = headers && headers.length > 0 ? headers : expected;

    // Read ALL existing data to check for duplicates (UPSERT logic)
    const allDataResp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:S`,
    });
    const existingRows = allDataResp.data.values || [];

    // Build a map of existing rows: key = "PO|SIDoc|LineItemIndex" -> row number
    const existingMap = new Map();
    existingRows.forEach((row, idx) => {
      const po = row[0] || '';
      const siDoc = row[1] || '';
      const lineItemIndex = row[7] || ''; // Column H (Line Item Index)
      const key = `${po}|${siDoc}|${lineItemIndex}`;
      existingMap.set(key, {
        rowNumber: idx + 2, // +2 because row 1 is header, and idx is 0-based
        existingData: row
      });
    });

    const rowsToAppend = [];
    const rowsToUpdate = [];
    const nowIso = new Date().toISOString();

    for (const inv of invoices || []) {
      const invPO = inv['PO Number'] || poNumber;
      const siDoc = String(inv['SI Doc Number'] || '').trim(); // Ensure it's a trimmed string
      const siDocDate = inv['SI Doc Date'] || '';
      const supplierName = inv['Supplier'] || inv['Supplier Name'] || '';
      const shipDate = inv['Ship Date'] || '';
      const invoiceTotal = inv['Document Total'] || inv['Invoice Total'] || 0;
      const status = inv['Status'] || 'Active';

      const lineItems = Array.isArray(inv._lineItems) ? inv._lineItems : [];

      if (lineItems.length === 0) {
        // Create a placeholder row so PO shows up even if no line items
        const lineItemIndex = 0;
        const key = `${invPO}|${siDoc}|${lineItemIndex}`;
        
        const placeholder = {
          'PO Number': invPO,
          'SI Doc Number': siDoc,
          'SI Doc Date': siDocDate,
          'Supplier Name': supplierName,
          'Ship Date': shipDate,
          'Invoice Total': invoiceTotal,
          'Invoice Status': status,
          'Line Item Index': lineItemIndex,
          'Item Description': 'No line items',
          'Quantity Shipped': '',
          'Unit Price': '',
          'Line Item Total': '',
          'Item Status': status,
          'Last Updated': nowIso,
          'Actual Shipping Date': '',
          'Inspector': '',
          'Inspection Status': '',
          'Inspection Notes': '',
          'Moved to Other Shelf': '',
        };

        const newRow = cols.map(h => placeholder[h] ?? '');

        if (existingMap.has(key)) {
          // UPDATE: Preserve columns O-S (editable fields)
          const existing = existingMap.get(key);
          const preservedFields = existing.existingData.slice(14, 19); // Columns O-S (indices 14-18)
          newRow[14] = preservedFields[0] || ''; // Actual Shipping Date
          newRow[15] = preservedFields[1] || ''; // Inspector
          newRow[16] = preservedFields[2] || ''; // Inspection Status
          newRow[17] = preservedFields[3] || ''; // Inspection Notes
          newRow[18] = preservedFields[4] || ''; // Moved to Other Shelf

          rowsToUpdate.push({
            range: `${SHEET_NAME}!A${existing.rowNumber}:S${existing.rowNumber}`,
            values: [newRow]
          });
        } else {
          // INSERT new row
          rowsToAppend.push(newRow);
        }
        continue;
      }

      lineItems.forEach((li, idx) => {
        const lineItemIndex = idx + 1;
        const key = `${invPO}|${siDoc}|${lineItemIndex}`;
        console.log(`DEBUG saveLineItems: Writing key "${key}" (PO=${invPO}, SIDoc="${siDoc}", Idx=${lineItemIndex})`);

        const qty = li.quantityShipped ?? li.quantityOrdered ?? '';
        const price = li.netPrice ?? li.listPrice ?? 0;
        const total = li.extension ?? (price && qty ? Number(price) * Number(qty) : 0);
        const desc = li.description || li.supplierItemNumber || 'Unnamed Item';

        const rowObj = {
          'PO Number': invPO,
          'SI Doc Number': siDoc,
          'SI Doc Date': siDocDate,
          'Supplier Name': supplierName,
          'Ship Date': shipDate,
          'Invoice Total': invoiceTotal,
          'Invoice Status': status,
          'Line Item Index': lineItemIndex,
          'Item Description': desc,
          'Quantity Shipped': qty,
          'Unit Price': price,
          'Line Item Total': total,
          'Item Status': status,
          'Last Updated': nowIso,
          'Actual Shipping Date': '',
          'Inspector': '',
          'Inspection Status': '',
          'Inspection Notes': '',
          'Moved to Other Shelf': '',
        };

        const newRow = cols.map(h => rowObj[h] ?? '');

        if (existingMap.has(key)) {
          // UPDATE: Preserve columns O-S (editable fields)
          const existing = existingMap.get(key);
          const preservedFields = existing.existingData.slice(14, 19); // Columns O-S (indices 14-18)
          newRow[14] = preservedFields[0] || ''; // Actual Shipping Date
          newRow[15] = preservedFields[1] || ''; // Inspector
          newRow[16] = preservedFields[2] || ''; // Inspection Status
          newRow[17] = preservedFields[3] || ''; // Inspection Notes
          newRow[18] = preservedFields[4] || ''; // Moved to Other Shelf

          rowsToUpdate.push({
            range: `${SHEET_NAME}!A${existing.rowNumber}:S${existing.rowNumber}`,
            values: [newRow]
          });
        } else {
          // INSERT new row
          rowsToAppend.push(newRow);
        }
      });
    }

    let updatedCount = 0;
    let insertedCount = 0;

    // Perform batch updates for existing rows
    if (rowsToUpdate.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          valueInputOption: 'RAW',
          data: rowsToUpdate
        }
      });
      updatedCount = rowsToUpdate.length;
      console.log(`✅ Updated ${updatedCount} existing line items (preserved editable fields)`);
    }

    // Append new rows
    if (rowsToAppend.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:S`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: rowsToAppend },
      });
      insertedCount = rowsToAppend.length;
      console.log(`✅ Inserted ${insertedCount} new line items`);
    }

    console.log(`📊 UPSERT Summary: ${updatedCount} updated, ${insertedCount} inserted, 0 duplicates`);
    return updatedCount + insertedCount;
  },

  /**
   * Get line item data from Google Sheet
   * @param {string} poNumber - PO Number
   * @param {string} siDocNumber - SI Doc Number
   * @param {number} lineItemIndex - Line Item Index (1-based)
   * @returns {Object} Line item data with all columns
   */
  getLineItemData: async function getLineItemData(poNumber, siDocNumber, lineItemIndex) {
    try {
      const sheets = getGoogleSheetsClient();

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:S`,
      });

      const rows = response.data.values || [];
      if (rows.length < 2) return null;

      const headers = rows[0];
      const key = `${poNumber}|${siDocNumber}|${lineItemIndex}`;

      for (let idx = 1; idx < rows.length; idx++) {
        const row = rows[idx];
        const po = row[0] || '';
        const siDoc = row[1] || '';
        const liIdx = row[7] || ''; // Column H
        const rowKey = `${po}|${siDoc}|${liIdx}`;

        if (rowKey === key) {
          // Found the row, convert to object
          const lineItem = {};
          headers.forEach((header, headerIdx) => {
            lineItem[header] = row[headerIdx] || '';
          });
          return lineItem;
        }
      }

      return null; // Not found
    } catch (error) {
      console.error('Error getting line item data:', error.message);
      return null;
    }
  },

  /**
   * Check if all line items for a PO are marked as "Complete"
   * @param {string} poNumber - PO Number
   * @returns {Object} { allComplete: boolean, lineItems: array }
   */
  checkPOCompletion: async function checkPOCompletion(poNumber) {
    try {
      const sheets = getGoogleSheetsClient();

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:S`,
      });

      const rows = response.data.values || [];
      if (rows.length < 2) return { allComplete: false, lineItems: [] };

      const headers = rows[0];
      const lineItems = [];
      let allComplete = true;

      // Find all line items for this PO
      for (let idx = 1; idx < rows.length; idx++) {
        const row = rows[idx];
        const po = (row[0] || '').trim();

        if (po === poNumber) {
          const lineItem = {};
          headers.forEach((header, headerIdx) => {
            lineItem[header] = row[headerIdx] || '';
          });
          lineItems.push(lineItem);

          // Check inspection status (Column Q, index 16)
          const inspectionStatus = row[16] || '';
          if (inspectionStatus !== 'Complete') {
            allComplete = false;
          }
        }
      }

      return { allComplete, lineItems };
    } catch (error) {
      console.error('Error checking PO completion:', error.message);
      return { allComplete: false, lineItems: [] };
    }
  },

  /**
   * Get all line items for a PO as objects
   * @param {string} poNumber - PO Number
   * @returns {Promise<Array<Object>>}
   */
  getLineItemsForPO: async function getLineItemsForPO(poNumber) {
    try {
      const sheets = getGoogleSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:S`,
      });

      const rows = response.data.values || [];
      if (rows.length < 2) return [];

      const headers = rows[0];
      const lineItems = [];

      for (let idx = 1; idx < rows.length; idx++) {
        const row = rows[idx];
        const po = (row[0] || '').trim();
        if (po !== poNumber) continue;

        const lineItem = {};
        headers.forEach((header, headerIdx) => {
          lineItem[header] = row[headerIdx] || '';
        });
        lineItems.push(lineItem);
      }

      return lineItems;
    } catch (error) {
      console.error('Error getting line items for PO:', error.message);
      return [];
    }
  },
};
