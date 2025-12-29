require('dotenv').config();
const { google } = require('googleapis');

async function checkSheets() {
  try {
    console.log('🔍 Checking available sheets in Google Sheets...\n');
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    });

    console.log('✅ Connected to Google Sheet!');
    console.log('📄 Sheet Name:', response.data.properties.title);
    console.log('\n📋 Available Sheets:');
    
    response.data.sheets.forEach((sheet, idx) => {
      console.log(`  ${idx + 1}. ${sheet.properties.title}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSheets();
