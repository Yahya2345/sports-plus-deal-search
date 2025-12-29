require('dotenv').config();
const axios = require('axios');

(async () => {
  try {
    const key = process.env.SPORTSINC_API_KEY;
    if (!key) throw new Error('SPORTSINC_API_KEY missing');
    const { data } = await axios.get('https://api.sportsinc.com/dealers/documents/', {
      params: { poNumber: 'JP5010B', lines: true, page: 1, pageSize: 5 },
      headers: { 'X-API-KEY': key },
    });
    console.log('items', data.items.length);
    data.items.forEach((doc, idx) => {
      console.log(`--- item ${idx + 1} ---`);
      console.log('keys', Object.keys(doc));
      console.log('pdf candidates', {
        PdfUrl: doc.PdfUrl,
        pdfUrl: doc.pdfUrl,
        pdf: doc.pdf,
        PDF: doc.PDF,
        documentLink: doc.documentLink,
        documentURL: doc.documentURL,
        downloadUrl: doc.downloadUrl,
        documentUrl: doc.documentUrl,
      });
      console.log('lineItems length', doc.lineItems?.length);
      console.log('lineItems sample', doc.lineItems?.slice(0, 2));
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
})();
