const puppeteer = require('puppeteer');

// Inspect the rendered page structure
async function inspectInvoicePage(htmlUrl) {
  let browser;
  try {
    console.log('[Inspector] Fetching invoice with Puppeteer:', htmlUrl);
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set timeout for navigation
    await page.goto(htmlUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('[Inspector] Page loaded, inspecting...');
    
    // Wait for page to settle
    await new Promise(r => setTimeout(r, 3000));
    
    // Extract visible text and structure
    const pageInfo = await page.evaluate(() => {
      const allText = document.body.innerText || '';
      const tables = document.querySelectorAll('table');
      const divs = document.querySelectorAll('div[class*="invoice"], div[class*="item"], div[class*="line"]');
      
      return {
        totalTextLength: allText.length,
        textSnippet: allText.substring(0, 1000),
        tableCount: tables.length,
        tableStructures: Array.from(tables).slice(0, 3).map(t => ({
          rows: t.querySelectorAll('tr').length,
          cols: Math.max(...Array.from(t.querySelectorAll('tr')).map(tr => tr.querySelectorAll('td, th').length))
        })),
        relevantDivCount: divs.length,
        bodyHTML: document.body.innerHTML.substring(0, 2000)
      };
    });
    
    console.log('[Inspector] Page Info:', JSON.stringify(pageInfo, null, 2));

  } catch (error) {
    console.error('[Inspector] Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

inspectInvoicePage('https://swv2h.sportsinc.com/Member/InvoiceCenter/VendorInvoicePDF.aspx?q=20082353');
