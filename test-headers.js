require('dotenv').config();
const googleSheets = require('./services/googleSheets');

async function testHeaders() {
  try {
    console.log('🔍 Reading headers from Google Sheet...\n');
    
    const { google } = require('googleapis');
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `Invoice Data!A1:Z1`,
    });

    const headers = response.data.values ? response.data.values[0] : [];

    if (headers.length > 0) {
      console.log('✅ Headers Found!\n');
      console.log('📋 Column Headers:\n');
      headers.forEach((header, idx) => {
        const colLetter = String.fromCharCode(65 + idx); // A, B, C, etc.
        console.log(`   ${colLetter}: ${header}`);
      });
      console.log(`\n📊 Total Columns: ${headers.length}`);
      console.log('\n✅ Google Sheet is READY for data!');
    } else {
      console.log('⚠️  No headers found. Please add them to Row 1.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testHeaders();
