require('dotenv').config();
const axios = require('axios');

(async () => {
  try {
    const key = process.env.SPORTSINC_API_KEY;
    
    // Try to get the actual document/PDF endpoint
    const siDocNumber = 19984567;
    const testUrls = [
      `https://api.sportsinc.com/dealers/documents/${siDocNumber}`,
      `https://api.sportsinc.com/dealers/documents/${siDocNumber}/pdf`,
      `https://api.sportsinc.com/dealers/documents/${siDocNumber}/download`,
      `https://api.sportsinc.com/dealers/invoices/${siDocNumber}`,
      `https://api.sportsinc.com/dealers/invoices/${siDocNumber}/pdf`,
    ];
    
    console.log('Testing possible PDF URL patterns...\n');
    
    for (const url of testUrls) {
      try {
        const response = await axios.head(url, {
          headers: { 'X-API-KEY': key },
          timeout: 5000
        });
        console.log(`✓ ${url}`);
        console.log(`  Status: ${response.status}`);
        console.log(`  Content-Type: ${response.headers['content-type']}`);
      } catch (err) {
        console.log(`✗ ${url}`);
        console.log(`  Error: ${err.response?.status || err.message}`);
      }
    }
  } catch (err) {
    console.error(err.message);
  }
})();
