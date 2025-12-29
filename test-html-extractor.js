const { extractLineItemsFromHtml } = require('./services/htmlInvoiceExtractor');

// Test with the invoice we know works
const testUrl = 'https://swv2h.sportsinc.com/Member/InvoiceCenter/VendorInvoicePDF.aspx?q=20082353';

extractLineItemsFromHtml(testUrl)
  .then(items => {
    console.log('\n=== EXTRACTED LINE ITEMS ===');
    console.log(JSON.stringify(items, null, 2));
  })
  .catch(err => {
    console.error('Test failed:', err);
  });
