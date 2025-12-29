const fetch = require('node-fetch');

// Try to find the actual PDF API endpoint by analyzing the page
async function findPdfApiEndpoint(invoiceNumber) {
  try {
    // The page uses Adobe Document Cloud viewer
    // Let's check if there's an API endpoint that returns the PDF URL or PDF data
    
    // Try common Sports Inc API patterns for PDFs
    const endpoints = [
      `https://swv3.sportsinc.com/api/invoice/${invoiceNumber}/pdf`,
      `https://swv3.sportsinc.com/api/vendors/invoice/${invoiceNumber}/pdf`,
      `https://swv3.sportsinc.com/api/documents/${invoiceNumber}/download`,
      `https://swv3.sportsinc.com/pdf/${invoiceNumber}`,
      `https://swv2h.sportsinc.com/api/invoice/pdf/${invoiceNumber}`,
      `https://swv2h.sportsinc.com/Member/InvoiceCenter/DownloadInvoicePdf?id=${invoiceNumber}`,
      `https://swv2h.sportsinc.com/Member/InvoiceCenter/GetInvoicePdf?docNum=${invoiceNumber}`,
    ];

    for (const url of endpoints) {
      try {
        console.log(`[API Test] Trying: ${url}`);
        const response = await fetch(url, {
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        });
        
        console.log(`  → Status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);
        
        if (response.status === 200) {
          const contentType = response.headers.get('content-type');
          if (contentType && (contentType.includes('pdf') || contentType.includes('application/octet'))) {
            console.log(`[API Test] ✓ FOUND PDF ENDPOINT: ${url}`);
            return { url, contentType, working: true };
          }
        }
      } catch (err) {
        console.log(`  → Error: ${err.message}`);
      }
    }
    
    console.log('[API Test] No working PDF endpoint found');
    return null;

  } catch (error) {
    console.error('[API Test] Error:', error.message);
    return null;
  }
}

// Test with invoice we know
findPdfApiEndpoint('20082353').then(result => {
  console.log('\nFinal Result:', result);
});
