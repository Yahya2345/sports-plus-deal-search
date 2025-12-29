require('dotenv').config();
const sportsInc = require('./services/sportsInc');
const sheets = require('./services/googleSheets');

(async () => {
  try {
    const po = 'MA25-MVILLE ACE';
    console.log('Fetching invoices for', po);
    const invoices = await sportsInc.getAllInvoices(po);
    console.log('Invoices found:', invoices.length);
    const count = await sheets.saveLineItemsForPO(po, invoices);
    console.log('Saved rows to Google Sheet:', count);
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
