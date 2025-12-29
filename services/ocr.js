const { createWorker } = require('tesseract.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const pdfParse = require('pdf-parse');

// Simple in-memory cache to avoid re-OCRing the same PDF URL
const ocrCache = new Map();

function hasCache(pdfUrl) {
  const entry = ocrCache.get(pdfUrl);
  // 7 days cache window
  if (entry && Date.now() - entry.timestamp < 7 * 24 * 60 * 60 * 1000) {
    return entry.items;
  }
  return null;
}

function setCache(pdfUrl, items) {
  ocrCache.set(pdfUrl, { timestamp: Date.now(), items });
}

function parseLineItemsFromText(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items = [];
  
  // Multiple patterns to match line items
  // Pattern 1: qty description price total
  const pattern1 = /^(\d+)[\s\-\*]+(.+?)[\s\-]+\$?(\d+(?:\.\d+)?)[\s\-]+\$?(\d+(?:\.\d+)?)/i;
  // Pattern 2: description with UPC/SKU and price
  const pattern2 = /(.+?)[\s\-]+(?:UPC|SKU|#)?[\s:]?(\d{6,})[\s\-]+\$?(\d+(?:\.\d+)?)/i;
  // Pattern 3: Simple description with price at end
  const pattern3 = /^(.+?)[\s\-]+\$?(\d+\.\d{2})$/i;
  
  for (const line of lines) {
    // Try pattern 1
    let match = pattern1.exec(line);
    if (match) {
      items.push({
        description: match[2].trim(),
        quantityOrdered: Number(match[1]),
        netPrice: Number(match[3]),
        extension: Number(match[4]),
        source: 'ocr-parsed'
      });
      continue;
    }
    
    // Try pattern 2
    match = pattern2.exec(line);
    if (match) {
      items.push({
        description: match[1].trim() + ' [' + match[2] + ']',
        netPrice: Number(match[3]),
        source: 'ocr-parsed'
      });
      continue;
    }
    
    // Try pattern 3
    match = pattern3.exec(line);
    if (match && match[1].length > 10) {
      items.push({
        description: match[1].trim(),
        netPrice: Number(match[2]),
        source: 'ocr-parsed'
      });
      continue;
    }
    
    // Fallback: lines with long product codes
    if (/\d{10,}/.test(line) && line.length > 15) {
      items.push({ description: line, source: 'ocr-fallback' });
    }
  }
  
  return items;
}

async function pdfToPngBuffers(pdfBuffer) {
  // For now, skip image-based OCR and rely on text extraction
  // This requires a proper PDF renderer like pdf.js with canvas
  throw new Error('Image-based OCR not yet implemented - relying on text extraction');
}

async function ocrImageBuffers(buffers) {
  const worker = await createWorker('eng');
  try {
    const results = [];
    for (const buf of buffers) {
      const { data } = await worker.recognize(buf);
      if (data?.text) results.push(data.text);
    }
    return results.join('\n');
  } finally {
    await worker.terminate();
  }
}

async function extractLineItemsFromPdf(pdfUrl) {
  const cached = hasCache(pdfUrl);
  if (cached) return cached;

  console.log(`Downloading PDF from: ${pdfUrl}`);
  const resp = await fetch(pdfUrl);
  if (!resp.ok) {
    throw new Error(`Failed to download PDF: ${resp.status}`);
  }
  
  const contentType = resp.headers.get('content-type');
  console.log(`Response content-type: ${contentType}`);
  
  const pdfBuffer = Buffer.from(await resp.arrayBuffer());
  console.log(`Downloaded ${pdfBuffer.length} bytes`);

  // Try text extraction from PDF
  try {
    const pdfTextResult = await pdfParse(pdfBuffer);
    if (pdfTextResult?.text) {
      console.log(`Extracted ${pdfTextResult.text.length} chars of text from PDF`);
      const items = parseLineItemsFromText(pdfTextResult.text);
      if (items.length > 0) {
        console.log(`Parsed ${items.length} line items from text`);
        setCache(pdfUrl, items);
        return items;
      }
      console.log('No line items found in extracted text');
    }
  } catch (err) {
    console.error('PDF text extraction failed:', err.message);
  }

  // For image-based PDFs, we would need proper PDF rendering here
  // For now, return empty if text extraction didn't work
  console.log('PDF appears to be image-based - skipping OCR for now');
  return [];
}

module.exports = {
  extractLineItemsFromPdf,
};
