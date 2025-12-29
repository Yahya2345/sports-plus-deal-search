require('dotenv').config();
const googleSheets = require('./services/googleSheets');

console.log('Environment loaded:');
console.log('GOOGLE_SHEETS_ID:', process.env.GOOGLE_SHEETS_ID ? '✅ Loaded' : '❌ Missing');
console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅ Loaded' : '❌ Missing');
console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✅ Loaded' : '❌ Missing');

async function test() {
  try {
    console.log('🔍 Testing Google Sheets connection...');
    const invoices = await googleSheets.getAllInvoices();
    console.log('✅ Google Sheets Connected Successfully!');
    console.log('📊 Current rows in sheet:', invoices.length);
    if (invoices.length > 0) {
      console.log('📋 Headers:', Object.keys(invoices[0]));
      console.log('📌 First invoice:', invoices[0]);
    } else {
      console.log('📭 Google Sheet is empty - ready for data');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('spreadsheet')) {
      console.error('⚠️  Check GOOGLE_SHEETS_ID in .env');
    }
  }
}

test();
