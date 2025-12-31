// Check what's in Google Sheets
require('dotenv').config();
const { google } = require('googleapis');

async function checkSheet() {
  console.log('📊 Checking Google Sheets content...\n');
  
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
  privateKey = privateKey.replace(/^["']|["']$/g, '');
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
  
  try {
    // Get sheet info
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });
    
    console.log('📄 Spreadsheet:', sheetInfo.data.properties.title);
    console.log('   Sheets:');
    sheetInfo.data.sheets.forEach(sheet => {
      console.log(`   - ${sheet.properties.title} (${sheet.properties.gridProperties.rowCount} rows x ${sheet.properties.gridProperties.columnCount} cols)`);
    });
    console.log('');
    
    // Check Invoice Data sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Invoice Data!A1:S10', // Get first 10 rows
    });
    
    const rows = response.data.values || [];
    console.log(`📋 Invoice Data sheet (first 10 rows):`);
    console.log(`   Total rows fetched: ${rows.length}`);
    
    if (rows.length > 0) {
      console.log('\n   Headers:');
      console.log('   ', rows[0].join(' | '));
      
      console.log('\n   Data rows:');
      rows.slice(1).forEach((row, idx) => {
        console.log(`   Row ${idx + 2}:`, row.slice(0, 5).join(' | '), '...');
      });
    } else {
      console.log('   ⚠️  Sheet is empty!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('Unable to parse range')) {
      console.log('\n💡 The "Invoice Data" sheet might not exist.');
      console.log('   Please create a sheet named "Invoice Data" in your spreadsheet.');
    }
  }
}

checkSheet();
