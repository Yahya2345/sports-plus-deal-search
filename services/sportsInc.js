const axios = require('axios');

// Sports Inc API configuration
const SPORTSINC_API_URL = 'https://api.sportsinc.com';
const SPORTSINC_API_KEY = process.env.SPORTSINC_API_KEY;

// Debug: Log if API key is loaded
if (!SPORTSINC_API_KEY) {
  console.warn('⚠️ WARNING: SPORTSINC_API_KEY is not loaded from environment variables!');
  console.warn('   Available env keys:', Object.keys(process.env).filter(k => k.includes('SPORTS')));
} else {
  console.log('✓ SPORTSINC_API_KEY loaded:', SPORTSINC_API_KEY.substring(0, 10) + '...');
}

// Sports Inc PDF URL pattern
// NOTE: This URL requires authentication and will redirect unauthenticated requests
const SPORTSINC_PDF_URL_BASE = 'https://swv2h.sportsinc.com/Member/InvoiceCenter/VendorInvoicePDF.aspx?q=';

function findPdfUrl(doc) {
  if (!doc || typeof doc !== 'object') return null;
  
  // NOTE: Sports Inc PDF endpoint requires active user session/authentication
  // Direct requests without authentication redirect to login page
  // For now, returning null to skip OCR processing for protected PDFs
  // TODO: Implement authentication or cookie-based PDF access
  
  // In the future, this would construct the PDF URL for authenticated requests:
  // if (doc.siDocNumber) {
  //   return `${SPORTSINC_PDF_URL_BASE}${doc.siDocNumber}`;
  // }
  
  return null;
}

/**
 * Get invoice data from Sports Inc Tool API by PO Number
 * @param {string} poNumber - PO Number to search for
 * @param {boolean} activeOnly - If true, fetch only active; if false, fetch historical
 * @returns {Object|null} Invoice data if found, null otherwise
 */
async function getInvoiceFromSportsInc(poNumber, activeOnly = true) {
  try {
    if (!SPORTSINC_API_KEY) {
      throw new Error('SPORTSINC_API_KEY is not configured');
    }

    const docType = activeOnly ? 'active' : 'historical';
    console.log(`Fetching ${docType} invoice from Sports Inc for PO: ${poNumber}`);

    // Make API request to Sports Inc
    // Using the dealers/documents endpoint with poNumber filter
    const params = {
      poNumber: poNumber,
      lines: true, // Include line item data
      page: 1,      // API requires page + pageSize together
      pageSize: 500 // Keep under 1000 per validation rules
    };
    
    // Only add active param if specified
    if (activeOnly) {
      params.active = true;
    }
    
    const response = await axios.get(`${SPORTSINC_API_URL}/dealers/documents/`, {
      params,
      headers: {
        'X-API-KEY': SPORTSINC_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.items && response.data.items.length > 0) {
      // Get the first document that matches
      const doc = response.data.items[0];

      console.log(`Successfully fetched invoice for PO ${poNumber} from Sports Inc`);

      // Normalize the response to match our expected format with user-friendly names
      const pdfUrl = findPdfUrl(doc);
      const invoiceData = {
        'PO Number': doc.poNumber || poNumber,
        'SI Doc Number': doc.siDocNumber || '',
        'SI Doc Date': doc.siDocDate || '',
        'Supplier Doc Number': doc.supplierDocNumber || '',
        'Supplier Doc Date': doc.supplierDocDate || '',
        'Supplier': doc.supplier || '',
        'Due Date': doc.dueDate || '',
        'Discount Date': doc.discountDate || '',
        'Ship Date': doc.shipDate || '',
        'Requested Ship Date': doc.requestedShipDate || '',
        'Merchandise Total': doc.merchandiseTotal || 0,
        'Freight Amount': doc.freightAmount || 0,
        'Discount Amount': doc.discountAmount || 0,
        'Sales Tax': doc.salesTax || 0,
        'Excise Tax': doc.exciseTax || 0,
        'SI Upcharge': doc.siUpcharge || 0,
        'Service/Handling Charge': doc.svcHandleCharge || 0,
        'Document Total': doc.docTotal || 0,
        'Is Credit': doc.isCredit ? 'Yes' : 'No',
        'Terms of Payment': doc.termsOfPayment || '',
        'Terms of Delivery': doc.termsOfDelivery || '',
        'Carrier': doc.carrier || '',
        'Weight (LB)': doc.weight || '',
        'Tracking Number': doc.trackingNumber || '',
        'Method of Payment': doc.methodOfPayment || '',
        'Freight Allowance': doc.freightAllowance || 0,

        // Shipping Address
        'Ship To Name': doc.shippingAddress?.name || '',
        'Ship To Address': doc.shippingAddress?.address1 || '',
        'Ship To Address 2': doc.shippingAddress?.address2 || '',
        'Ship To City': doc.shippingAddress?.city || '',
        'Ship To State': doc.shippingAddress?.state || '',
        'Ship To Zip': doc.shippingAddress?.zipcode || '',

        // Supplier Address
        'Supplier Address': doc.supplierAddress?.address1 || '',
        'Supplier Address 2': doc.supplierAddress?.address2 || '',
        'Supplier City': doc.supplierAddress?.city || '',
        'Supplier State': doc.supplierAddress?.state || '',
        'Supplier Zip': doc.supplierAddress?.zipcode || '',
        'Supplier Phone': doc.supplierAddress?.phoneNumber || '',
        'Supplier Fax': doc.supplierAddress?.faxNumber || '',

        // Line items count
        'Line Items Count': doc.lines?.length || 0,

        // Potential PDF link when EDI line items are missing
        '_pdfUrl': pdfUrl,

        // Store raw line items for potential detail view
        '_lineItems': doc.lines || [],
        
        // Invoice status
        'Status': doc.active ? 'Active' : 'Historical'
      };

      return invoiceData;
    }

    console.log(`No invoice found in Sports Inc for PO ${poNumber}`);
    return null;

  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`Invoice not found in Sports Inc for PO ${poNumber}`);
      return null;
    }

    if (error.response?.status === 401) {
      console.error('❌ Sports Inc API authentication failed - check your API key');
      console.error('API Key present:', !!SPORTSINC_API_KEY);
      console.error('API Key length:', SPORTSINC_API_KEY?.length);
      console.error('Response:', JSON.stringify(error.response?.data));
      throw new Error('Sports Inc API authentication failed');
    }

    console.error('❌ Error fetching from Sports Inc:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Response:', JSON.stringify(error.response?.data));
    throw error;
  }
}

/**
 * Get invoice with caching strategy:
 * 1. Check Google Sheets cache first
 * 2. If not found, fetch from Sports Inc API
 * 3. Save to Google Sheets for future requests
 *
 * @param {string} poNumber - PO Number to search for
 * @param {Object} sheetsService - Google Sheets service object
 * @returns {Object|null} Invoice data if found, null otherwise
 */
async function getInvoiceWithCache(poNumber, sheetsService) {
  try {
    // Step 1: Check Google Sheets cache
    console.log(`Checking Google Sheets cache for PO ${poNumber}`);
    let invoiceData = null;
    try {
      invoiceData = await sheetsService.getInvoiceFromSheet(poNumber);
    } catch (cacheReadErr) {
      console.warn('Cache read failed, continuing without cache:', cacheReadErr.message);
    }

    if (invoiceData) {
      console.log(`✓ Found in cache (Google Sheets)`);
      invoiceData._source = 'cache';
      return invoiceData;
    }

    // Step 2: Not in cache, fetch from Sports Inc API
    console.log(`Not in cache, fetching from Sports Inc API...`);
    invoiceData = await getInvoiceFromSportsInc(poNumber);

    if (!invoiceData) {
      console.log(`Invoice not found in Sports Inc API for PO ${poNumber}`);
      return null;
    }

    // Step 3: Save to Google Sheets cache for future requests (best-effort)
    try {
      console.log(`Saving to Google Sheets cache...`);
      await sheetsService.saveInvoiceToSheet(invoiceData);
      console.log(`✓ Saved to cache`);
    } catch (cacheErr) {
      // Do not block API response if cache write fails
      console.warn('Cache save failed, continuing without cache:', cacheErr.message);
    }

    invoiceData._source = 'api';
    return invoiceData;

  } catch (error) {
    console.error('Error in getInvoiceWithCache:', error.message);
    throw error;
  }
}

/**
 * Fetch all invoices (active and historical) for a PO Number
 * Supports partial matching for truncated PO numbers in SI Tool
 * @param {string} poNumber - PO Number to search for
 * @returns {Array} Array of all invoices found
 */
async function getAllInvoices(poNumber) {
  try {
    if (!SPORTSINC_API_KEY) {
      throw new Error('SPORTSINC_API_KEY is not configured');
    }

    console.log(`Fetching ALL invoices from Sports Inc for PO: ${poNumber}`);

    // Step 1: Try exact match first (fastest)
    let response;
    let exactMatchFound = false;
    
    try {
      response = await axios.get(`${SPORTSINC_API_URL}/dealers/documents/`, {
        params: {
          poNumber: poNumber,
          lines: true, // Include line item data
          page: 1,      // API requires page + pageSize together
          pageSize: 500 // Keep under 1000 per validation rules
        },
        headers: {
          'X-API-KEY': SPORTSINC_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      // If exact match found, return results
      if (response.data && response.data.items && response.data.items.length > 0) {
        exactMatchFound = true;
        console.log(`✓ Found ${response.data.items.length} invoice(s) with exact match for PO ${poNumber}`);

      // Normalize all documents
      const invoices = response.data.items.map(doc => ({
        'PO Number': doc.poNumber || poNumber,
        'SI Doc Number': doc.siDocNumber || '',
        'SI Doc Date': doc.siDocDate || '',
        'Supplier Doc Number': doc.supplierDocNumber || '',
        'Supplier Doc Date': doc.supplierDocDate || '',
        'Supplier': doc.supplier || '',
        'Due Date': doc.dueDate || '',
        'Discount Date': doc.discountDate || '',
        'Ship Date': doc.shipDate || '',
        'Requested Ship Date': doc.requestedShipDate || '',
        'Merchandise Total': doc.merchandiseTotal || 0,
        'Freight Amount': doc.freightAmount || 0,
        'Discount Amount': doc.discountAmount || 0,
        'Sales Tax': doc.salesTax || 0,
        'Excise Tax': doc.exciseTax || 0,
        'SI Upcharge': doc.siUpcharge || 0,
        'Service/Handling Charge': doc.svcHandleCharge || 0,
        'Document Total': doc.docTotal || 0,
        'Is Credit': doc.isCredit ? 'Yes' : 'No',
        'Terms of Payment': doc.termsOfPayment || '',
        'Terms of Delivery': doc.termsOfDelivery || '',
        'Carrier': doc.carrier || '',
        'Weight (LB)': doc.weight || '',
        'Tracking Number': doc.trackingNumber || '',
        'Method of Payment': doc.methodOfPayment || '',
        'Freight Allowance': doc.freightAllowance || 0,

        // Shipping Address
        'Ship To Name': doc.shippingAddress?.name || '',
        'Ship To Address': doc.shippingAddress?.address1 || '',
        'Ship To Address 2': doc.shippingAddress?.address2 || '',
        'Ship To City': doc.shippingAddress?.city || '',
        'Ship To State': doc.shippingAddress?.state || '',
        'Ship To Zip': doc.shippingAddress?.zipcode || '',

        // Supplier Address
        'Supplier Address': doc.supplierAddress?.address1 || '',
        'Supplier Address 2': doc.supplierAddress?.address2 || '',
        'Supplier City': doc.supplierAddress?.city || '',
        'Supplier State': doc.supplierAddress?.state || '',
        'Supplier Zip': doc.supplierAddress?.zipcode || '',
        'Supplier Phone': doc.supplierAddress?.phoneNumber || '',
        'Supplier Fax': doc.supplierAddress?.faxNumber || '',

        // Line items count
        'Line Items Count': doc.lines?.length || 0,

        // Potential PDF link when EDI line items are missing
        '_pdfUrl': findPdfUrl(doc),

        // Store raw line items for potential detail view
        '_lineItems': doc.lines || [],
        
        // Invoice status
        'Status': doc.active ? 'Active' : 'Historical'
      }));

      return invoices;
    }
    } catch (exactMatchError) {
      // Exact match failed (404, 400, etc.) - proceed to partial match
      console.log(`❌ Exact match failed: ${exactMatchError.message}. Trying partial match...`);
    }

    // Step 2: No exact match or exact match failed - Try progressive truncation
    if (!exactMatchFound) {
      console.log(`🔍 Attempting progressive truncation for: ${poNumber}`);
      
      // Try progressively shorter versions of the PO number
      const truncationAttempts = [];
      let currentPO = poNumber;
      
      // Generate truncation attempts by removing characters from the end
      // e.g., "KS26-004-D/KT26-007-D" -> ["KS26-004-D/KT26-007", "KS26-004-D/KT26-00", "KS26-004-D/KT26-0", "KS26-004-D/KT26"]
      for (let i = 1; i <= Math.min(10, poNumber.length - 5); i++) {
        const truncated = poNumber.substring(0, poNumber.length - i);
        if (truncated.length >= 5) { // Don't search with very short strings
          truncationAttempts.push(truncated);
        }
      }
      
      // Try each truncation
      for (const truncatedPO of truncationAttempts) {
        try {
          console.log(`  Trying truncated PO: ${truncatedPO}`);
          const truncResponse = await axios.get(`${SPORTSINC_API_URL}/dealers/documents/`, {
            params: {
              poNumber: truncatedPO,
              lines: true,
              page: 1,
              pageSize: 500
            },
            headers: {
              'X-API-KEY': SPORTSINC_API_KEY,
              'Content-Type': 'application/json'
            }
          });

          if (truncResponse.data && truncResponse.data.items && truncResponse.data.items.length > 0) {
            console.log(`✓ Found ${truncResponse.data.items.length} invoice(s) with truncated PO: ${truncatedPO}`);
            
            const invoices = truncResponse.data.items.map(doc => ({
              'PO Number': doc.poNumber || poNumber,
              'SI Doc Number': doc.siDocNumber || '',
              'SI Doc Date': doc.siDocDate || '',
              'Supplier Doc Number': doc.supplierDocNumber || '',
              'Supplier Doc Date': doc.supplierDocDate || '',
              'Supplier': doc.supplier || '',
              'Due Date': doc.dueDate || '',
              'Discount Date': doc.discountDate || '',
              'Ship Date': doc.shipDate || '',
              'Requested Ship Date': doc.requestedShipDate || '',
              'Merchandise Total': doc.merchandiseTotal || 0,
              'Freight Amount': doc.freightAmount || 0,
              'Discount Amount': doc.discountAmount || 0,
              'Sales Tax': doc.salesTax || 0,
              'Excise Tax': doc.exciseTax || 0,
              'SI Upcharge': doc.siUpcharge || 0,
              'Service/Handling Charge': doc.svcHandleCharge || 0,
              'Document Total': doc.docTotal || 0,
              'Is Credit': doc.isCredit ? 'Yes' : 'No',
              'Terms of Payment': doc.termsOfPayment || '',
              'Terms of Delivery': doc.termsOfDelivery || '',
              'Carrier': doc.carrier || '',
              'Weight (LB)': doc.weight || '',
              'Tracking Number': doc.trackingNumber || '',
              'Method of Payment': doc.methodOfPayment || '',
              'Freight Allowance': doc.freightAllowance || 0,

              // Shipping Address
              'Ship To Name': doc.shippingAddress?.name || '',
              'Ship To Address': doc.shippingAddress?.address1 || '',
              'Ship To Address 2': doc.shippingAddress?.address2 || '',
              'Ship To City': doc.shippingAddress?.city || '',
              'Ship To State': doc.shippingAddress?.state || '',
              'Ship To Zip': doc.shippingAddress?.zipcode || '',

              // Supplier Address
              'Supplier Address': doc.supplierAddress?.address1 || '',
              'Supplier Address 2': doc.supplierAddress?.address2 || '',
              'Supplier City': doc.supplierAddress?.city || '',
              'Supplier State': doc.supplierAddress?.state || '',
              'Supplier Zip': doc.supplierAddress?.zipcode || '',
              'Supplier Phone': doc.supplierAddress?.phoneNumber || '',
              'Supplier Fax': doc.supplierAddress?.faxNumber || '',

              // Line items count
              'Line Items Count': doc.lines?.length || 0,

              // Potential PDF link when EDI line items are missing
              '_pdfUrl': findPdfUrl(doc),

              // Store raw line items for potential detail view
              '_lineItems': doc.lines || [],
              
              // Invoice status
              'Status': doc.active ? 'Active' : 'Historical'
            }));

            return invoices;
          }
        } catch (truncError) {
          // This truncation didn't work, try next
          console.log(`  ❌ Truncated PO ${truncatedPO} not found`);
        }
      }
    }

    console.log(`No invoices found in Sports Inc for PO ${poNumber} (exact or partial match)`);
    return [];

  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`Invoices not found in Sports Inc for PO ${poNumber}`);
      return [];
    }

    if (error.response?.status === 401) {
      console.error('❌ Sports Inc API authentication failed - check your API key');
      throw new Error('Sports Inc API authentication failed');
    }

    console.error('❌ Error fetching from Sports Inc:', error.message);
    throw error;
  }
}

/**
 * Fetch both active and historical invoices in parallel
 * @param {string} poNumber - PO Number to search for
 * @returns {Object} { active, historical }
 */
async function getInvoicesBoth(poNumber) {
  const [active, historical] = await Promise.allSettled([
    getInvoiceFromSportsInc(poNumber, true),
    getInvoiceFromSportsInc(poNumber, false)
  ]);

  return {
    active: active.status === 'fulfilled' ? active.value : null,
    historical: historical.status === 'fulfilled' ? historical.value : null,
    activeError: active.status === 'rejected' ? active.reason?.message : null,
    historicalError: historical.status === 'rejected' ? historical.reason?.message : null
  };
}

module.exports = {
  getInvoiceFromSportsInc,
  getInvoiceWithCache,
  getInvoicesBoth,
  getAllInvoices,
};
