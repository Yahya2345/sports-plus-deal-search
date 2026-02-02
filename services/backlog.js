const { google } = require('googleapis');
require('dotenv').config();

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
const BACKLOG_SHEET_NAME = 'Backlog';

// Initialize Google Sheets API (same as googleSheets.js)
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
    privateKey = privateKey
      .replace(/-----BEGIN PRIVATE KEY----- /g, '-----BEGIN PRIVATE KEY-----\n')
      .replace(/ -----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----')
      .replace(/(.{64})\s+/g, '$1\n');
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

const sheets = getGoogleSheetsClient();

/**
 * Add PO to backlog
 * @param {string} poNumber - PO Number to add
 * @returns {Promise<object>} Result of operation
 */
async function addToBacklog(poNumber) {
  try {
    console.log(`📋 Adding PO ${poNumber} to backlog...`);

    const now = new Date().toISOString();
    const dateAdded = new Date().toLocaleDateString('en-US');

    // Check if PO already exists in backlog
    const existing = await getBacklogList();
    const alreadyExists = existing.some(item => item.poNumber === poNumber);

    if (alreadyExists) {
      console.log(`⚠️ PO ${poNumber} already in backlog`);
      return { success: false, message: 'PO already in backlog' };
    }

    // Add to sheet (4 columns: PO Number, Date Added, Last Checked, Status)
    const values = [[
      poNumber,           // PO Number
      dateAdded,          // Date Added
      dateAdded,          // Last Checked
      'Pending'           // Status
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${BACKLOG_SHEET_NAME}!A:D`,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });

    console.log(`✅ Added PO ${poNumber} to backlog`);
    return { success: true, message: 'PO added to backlog' };

  } catch (error) {
    console.error('❌ Error adding to backlog:', error.message);
    throw error;
  }
}

/**
 * Get all POs from backlog
 * @returns {Promise<Array>} Array of backlog items
 */
async function getBacklogList() {
  try {
    console.log('📋 Fetching backlog list...');

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${BACKLOG_SHEET_NAME}!A:D`,
    });

    const rows = response.data.values || [];
    
    // Skip header row
    if (rows.length <= 1) {
      console.log('📋 Backlog is empty');
      return [];
    }

    const backlogItems = rows.slice(1).map((row, index) => ({
      rowIndex: index + 2, // +2 because: 1-based indexing + skip header
      poNumber: row[0] || '',
      dateAdded: row[1] || '',
      lastChecked: row[2] || '',
      status: row[3] || 'Pending'
    }));

    console.log(`✅ Found ${backlogItems.length} items in backlog`);
    return backlogItems;

  } catch (error) {
    console.error('❌ Error fetching backlog:', error.message);
    throw error;
  }
}

/**
 * Remove PO from backlog
 * @param {string} poNumber - PO Number to remove
 * @returns {Promise<object>} Result of operation
 */
async function removeFromBacklog(poNumber) {
  try {
    console.log(`📋 Removing PO ${poNumber} from backlog...`);

    const backlogItems = await getBacklogList();
    const itemToRemove = backlogItems.find(item => item.poNumber === poNumber);

    if (!itemToRemove) {
      console.log(`⚠️ PO ${poNumber} not found in backlog`);
      return { success: false, message: 'PO not found in backlog' };
    }

    // Delete the row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: await getSheetId(BACKLOG_SHEET_NAME),
              dimension: 'ROWS',
              startIndex: itemToRemove.rowIndex - 1, // 0-based for API
              endIndex: itemToRemove.rowIndex
            }
          }
        }]
      }
    });

    console.log(`✅ Removed PO ${poNumber} from backlog`);
    return { success: true, message: 'PO removed from backlog' };

  } catch (error) {
    console.error('❌ Error removing from backlog:', error.message);
    throw error;
  }
}

/**
 * Update last checked timestamp for a PO
 * @param {string} poNumber - PO Number to update
 * @returns {Promise<object>} Result of operation
 */
async function updateLastChecked(poNumber) {
  try {
    console.log(`📋 Updating last checked for PO ${poNumber}...`);

    const backlogItems = await getBacklogList();
    const item = backlogItems.find(item => item.poNumber === poNumber);

    if (!item) {
      console.log(`⚠️ PO ${poNumber} not found in backlog`);
      return { success: false, message: 'PO not found in backlog' };
    }

    const now = new Date().toLocaleDateString('en-US');

    // Update last checked column (column C)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${BACKLOG_SHEET_NAME}!C${item.rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[now]]
      }
    });

    console.log(`✅ Updated last checked for PO ${poNumber}`);
    return { success: true, message: 'Last checked updated' };

  } catch (error) {
    console.error('❌ Error updating last checked:', error.message);
    throw error;
  }
}

/**
 * Get sheet ID by name
 * @param {string} sheetName - Name of the sheet
 * @returns {Promise<number>} Sheet ID
 */
async function getSheetId(sheetName) {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheet = response.data.sheets.find(
      s => s.properties.title === sheetName
    );

    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }

    return sheet.properties.sheetId;

  } catch (error) {
    console.error('❌ Error getting sheet ID:', error.message);
    throw error;
  }
}

module.exports = {
  addToBacklog,
  getBacklogList,
  removeFromBacklog,
  updateLastChecked
};
