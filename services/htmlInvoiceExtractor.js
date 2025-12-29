const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

// Parse line items from Sports Inc invoice HTML page using headless browser
async function extractLineItemsFromHtml(htmlUrl) {
  let browser;
  try {
    console.log('[HTML Extractor] Fetching invoice with Puppeteer:', htmlUrl);
    
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

    console.log('[HTML Extractor] Page loaded, waiting for invoice content...');
    
    // Wait for invoice content to load (look for common selectors)
    await Promise.race([
      page.waitForSelector('table', { timeout: 5000 }).catch(() => null),
      page.waitForSelector('.invoice', { timeout: 5000 }).catch(() => null),
      page.waitForFunction(() => document.body.innerText.length > 500, { timeout: 5000 }).catch(() => null)
    ]);

    // Get the rendered HTML
    const html = await page.content();
    console.log('[HTML Extractor] Got HTML, length:', html.length);

    // Parse the HTML
    const $ = cheerio.load(html);

    // Look for line items in common table structures
    // Sports Inc invoice pages typically have a table with invoice details
    let lineItems = [];

    // Try multiple selectors for line item tables
    const tableSelectors = [
      'table tbody tr',
      '.invoice-items tr',
      '#invoiceItems tr',
      'table:contains("Qty") tbody tr',
      'tr:has(td:contains("Qty"))'
    ];

    for (const selector of tableSelectors) {
      const rows = $(selector);
      console.log(`[HTML Extractor] Found ${rows.length} rows with selector: ${selector}`);

      if (rows.length > 0) {
        rows.each((i, row) => {
          const cells = $(row).find('td');
          
          if (cells.length >= 3) {
            // Assuming: Qty | Description | Price | Total or similar
            const qty = $(cells[0]).text().trim();
            const desc = $(cells[1]).text().trim();
            const price = $(cells[cells.length - 2]).text().trim();
            const total = $(cells[cells.length - 1]).text().trim();

            // Only include if it looks like real data (not header, not empty)
            if (qty && desc && price && !qty.match(/^qty$/i) && !desc.match(/description/i)) {
              lineItems.push({
                quantity: qty,
                description: desc,
                price: price,
                total: total
              });
              console.log(`[HTML Extractor] Found line: ${qty} x ${desc} @ ${price}`);
            }
          }
        });

        if (lineItems.length > 0) break;
      }
    }

    // If no table found, try to extract structured data from page
    if (lineItems.length === 0) {
      console.log('[HTML Extractor] No table found, trying alternate extraction methods...');
      
      // Look for any text patterns that look like line items
      const pageText = $.text();
      console.log('[HTML Extractor] Page text length:', pageText.length);
      console.log('[HTML Extractor] Page snippet:', pageText.substring(0, 500));
    }

    console.log(`[HTML Extractor] Successfully extracted ${lineItems.length} line items`);
    return lineItems;

  } catch (error) {
    console.error('[HTML Extractor] Error extracting line items:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  extractLineItemsFromHtml
};
