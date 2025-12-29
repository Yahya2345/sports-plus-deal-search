require('dotenv').config();
const axios = require('axios');

(async () => {
  try {
    const siDocNumber = 20082353;
    const testUrls = [
      // Current URL
      `https://swv2h.sportsinc.com/Member/InvoiceCenter/VendorInvoicePDF.aspx?q=${siDocNumber}`,
      // Print endpoints
      `https://swv2h.sportsinc.com/Member/InvoiceCenter/PrintInvoices.aspx?q=${siDocNumber}`,
      `https://swv2h.sportsinc.com/Member/InvoiceCenter/PrintInvoices.aspx?docNum=${siDocNumber}`,
      `https://swv2h.sportsinc.com/Member/InvoiceCenter/Print.aspx?q=${siDocNumber}`,
      `https://swv2h.sportsinc.com/Member/Reports/VendorInvoicePDF.aspx?q=${siDocNumber}`,
    ];
    
    console.log('Testing possible PDF URLs...\n');
    
    for (const url of testUrls) {
      try {
        console.log(`Testing: ${url}`);
        const response = await axios.get(url, {
          timeout: 10000,
          validateStatus: () => true // Don't throw on any status
        });
        
        console.log(`  Status: ${response.status}`);
        console.log(`  Content-Type: ${response.headers['content-type']}`);
        
        // Check if response looks like a PDF
        const isPDF = response.data.includes?.('%PDF') || 
                      response.headers['content-type']?.includes('application/pdf') ||
                      response.headers['content-disposition']?.includes('pdf');
        
        if (isPDF) {
          console.log(`  ✅ LOOKS LIKE PDF!`);
        } else if (response.status === 200) {
          const sampleText = typeof response.data === 'string' ? 
            response.data.substring(0, 200) : 
            response.data.toString().substring(0, 200);
          console.log(`  Content preview: ${sampleText.substring(0, 100)}...`);
        }
        console.log();
      } catch (err) {
        console.log(`  ❌ Error: ${err.message}\n`);
      }
    }
  } catch (err) {
    console.error(err.message);
  }
})();
