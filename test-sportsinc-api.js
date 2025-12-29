require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.SPORTSINC_API_KEY;
const PO_NUMBER = 'SN - REST SEL S';

console.log('Testing Sports Inc API...\n');
console.log('API Key (first 20 chars):', API_KEY ? API_KEY.substring(0, 20) + '...' : 'NOT FOUND');
console.log('PO Number:', PO_NUMBER);
console.log('\n--- Making API Request ---\n');

axios.get('https://api.sportsinc.com/dealers/documents/', {
  params: {
    poNumber: PO_NUMBER,
    lines: true,
    active: true
  },
  headers: {
    'X-API-KEY': API_KEY,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('✅ SUCCESS! Status:', response.status);
  console.log('Total documents found:', response.data.totalCount);
  console.log('Documents returned:', response.data.items?.length || 0);

  if (response.data.items && response.data.items.length > 0) {
    const doc = response.data.items[0];
    console.log('\n--- First Document Details ---');
    console.log('PO Number:', doc.poNumber);
    console.log('SI Doc Number:', doc.siDocNumber);
    console.log('Supplier:', doc.supplier);
    console.log('Document Total:', doc.docTotal);
    console.log('Ship Date:', doc.shipDate);
  }

  console.log('\n--- Full Response ---');
  console.log(JSON.stringify(response.data, null, 2));
})
.catch(error => {
  console.error('❌ ERROR!');
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Status Text:', error.response.statusText);
    console.error('Response:', JSON.stringify(error.response.data, null, 2));
    console.error('\n--- Response Headers ---');
    console.error(JSON.stringify(error.response.headers, null, 2));
  } else {
    console.error('Error Message:', error.message);
  }

  console.log('\n--- Troubleshooting Tips ---');
  console.log('1. Verify API key is correct (check email from mhoerner@hq.sportsinc.com)');
  console.log('2. Ensure API key has access to your dealer account');
  console.log('3. Try searching for a different PO Number');
  console.log('4. Check if PO Number is marked as "active" in SportsWeb Invoice Center');
});
