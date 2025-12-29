const puppeteer = require('puppeteer');

// Try to intercept and capture the actual PDF download request
async function captureInvoicePDF(htmlUrl) {
  let browser;
  try {
    console.log('[PDF Capturer] Launching Puppeteer...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Listen for response to capture file downloads
    page.on('response', response => {
      const contentType = response.headers()['content-type'] || '';
      const url = response.url();
      const status = response.status();
      
      console.log(`[Response] ${status} ${contentType.substring(0, 40)} - ${url.substring(0, 100)}`);
      
      if (contentType.includes('pdf') || url.includes('pdf')) {
        console.log('[PDF Capturer] *** FOUND PDF RESPONSE:', url);
      }
    });
    
    console.log('[PDF Capturer] Navigating to:', htmlUrl);
    
    // Set timeout for navigation
    const response = await page.goto(htmlUrl, {
      waitUntil: 'networkidle0',
      timeout: 40000
    });
    
    console.log('[PDF Capturer] Navigation complete, status:', response?.status());
    console.log('[PDF Capturer] Current URL:', page.url());
    
    // Wait for page to fully load
    await new Promise(r => setTimeout(r, 5000));
    
    // Check if page is the invoice page
    const pageTitle = await page.title();
    const pageUrl = page.url();
    console.log('[PDF Capturer] Page title:', pageTitle);
    console.log('[PDF Capturer] Current URL:', pageUrl);
    
    // Try to find and click Print PDF button
    const buttons = await page.evaluate(() => {
      const allElements = document.querySelectorAll('button, a, [role="button"]');
      return Array.from(allElements).map(el => ({
        text: el.innerText.substring(0, 50),
        html: el.innerHTML.substring(0, 50),
        className: el.className
      })).slice(0, 10);
    });
    
    console.log('[PDF Capturer] Buttons found:', JSON.stringify(buttons, null, 2));
    

  } catch (error) {
    console.error('[PDF Capturer] Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

captureInvoicePDF('https://swv2h.sportsinc.com/Member/InvoiceCenter/VendorInvoicePDF.aspx?q=20082353');
