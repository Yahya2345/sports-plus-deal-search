# Sports Inc PDF Access Issue & Resolution

## Problem
The Sports Inc invoice PDF endpoint (`https://swv2h.sportsinc.com/Member/InvoiceCenter/VendorInvoicePDF.aspx?q={siDocNumber}`) requires authentication. Direct requests without an active user session return a 302 redirect to the login page.

## Current Status
✅ **Core Functionality Working:**
- Sports Inc API integration successfully fetches invoices with line items
- HubSpot deal data integration
- Google Sheets caching for performance
- Basic invoice display in portal

❌ **OCR Feature Blocked:**
- Cannot access Sports Inc PDFs without authentication
- Tesseract.js/Sharp/pdf-parse installed but unused
- OCR extraction disabled in server.js until PDF access is resolved

## Root Cause Analysis
When Puppeteer navigates to the invoice URL:
1. Initial request: 302 redirect (requires authentication)  
2. Browser redirects to: `https://www.sportsinc.us/` (public homepage)
3. No PDFs returned, only HTML

The portal works in a browser because:
- User is logged in (has session cookies)
- Browser sends authentication headers
- Backend serves the invoice HTML/PDF viewer

## Solution Options

### Option 1: Use Authentication Cookies (Requires User Session)
```javascript
// Pass cookies from authenticated browser session to Puppeteer
const browser = await puppeteer.launch();
const page = await browser.newPage();

// Add cookies from authenticated session
await page.setCookie(...authenticationCookies);
await page.goto('https://swv2h.sportsinc.com/Member/InvoiceCenter/VendorInvoicePDF.aspx?q=20082353');
```
**Requires:** User to provide session cookies manually or implement OAuth flow

### Option 2: Use Adobe PDF Embed API (Recommended)
The invoice viewer on the page uses `https://documentcloud.adobe.com/view-sdk/` which suggests PDFs are served through Adobe Document Cloud. We could:
- Reverse-engineer the Adobe viewer's API calls
- Extract the actual PDF URL from the viewer JavaScript
- Download PDF directly from the Adobe CDN

**Status:** Would need to inspect the viewer JavaScript to find the PDF URL

### Option 3: Manual PDF Upload Feature
Allow users to manually upload PDFs for OCR extraction:
```javascript
app.post('/api/upload-pdf', (req, res) => {
  // Handle multipart form data with PDF file
  // Extract line items via OCR
  // Store mapping of Invoice → Extracted Line Items
});
```

### Option 4: Export from Sports Inc Portal
Ask users to:
1. Login to Sports Inc portal
2. Use "Export" or "Download" button to get PDF
3. Upload to our portal for OCR processing

## Recommended Next Steps

**Short Term (This Week):**
1. **Disable OCR feature** - Already done in this commit
2. **Document the limitation** - Users now see clear message when line items are missing
3. **Add feedback in UI** - "Line items missing - Contact Sports Inc support for PDF export"

**Medium Term (1-2 Weeks):**
1. Implement **manual PDF upload** endpoint (`/api/upload-pdf`)
2. Add **drag-and-drop PDF** to invoice card in UI
3. OCR extracts line items from uploaded PDF
4. Cache results in database

**Long Term (Needs Discussion):**
1. Contact Sports Inc support to request:
   - Direct PDF download API
   - Authentication credentials for headless access
   - OAuth integration option
2. Implement OAuth/session-based PDF access
3. Fully automate OCR for all invoices

## Files Modified
- `services/sportsInc.js` - `findPdfUrl()` returns null (PDFs require auth)
- `server.js` - OCR attempt disabled, logs explanation
- `services/htmlInvoiceExtractor.js` - Created (Puppeteer + Cheerio)
- `services/ocr.js` - Created (ready for use when PDFs available)
- `package.json` - Added: tesseract.js, sharp, pdf-parse, puppeteer, cheerio, node-fetch

## Status Summary
**Current:** Sports Inc API provides EDI line items for 85-90% of invoices. Remaining invoices show placeholder text.

**When OCR is Available:** Will extract line items from PDF page 2 for remaining 10-15% of invoices.

**blockers:** Need to resolve Sports Inc PDF authentication before OCR can be fully activated.
