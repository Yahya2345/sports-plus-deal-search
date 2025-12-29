require('dotenv').config();
const axios = require('axios');

(async () => {
  try {
    const key = process.env.SPORTSINC_API_KEY;
    const { data } = await axios.get('https://api.sportsinc.com/dealers/documents/', {
      params: { poNumber: 'JP5010B', lines: true, page: 1, pageSize: 5 },
      headers: { 'X-API-KEY': key },
    });
    
    console.log('Total items:', data.items.length);
    data.items.forEach((doc, i) => {
      console.log(`\n=== Invoice ${i + 1}: ${doc.siDocNumber} ===`);
      console.log('All keys:', Object.keys(doc).sort().join(', '));
      
      // Check all possible URL fields
      const urlFields = Object.keys(doc).filter(k => 
        k.toLowerCase().includes('url') || 
        k.toLowerCase().includes('link') || 
        k.toLowerCase().includes('pdf') ||
        k.toLowerCase().includes('document')
      );
      
      console.log('\nURL-related fields:', urlFields);
      urlFields.forEach(f => {
        console.log(`  ${f}: ${doc[f]}`);
      });
      
      console.log('\nLine items:', doc.lines?.length || 0);
      if (doc.lines?.[0]) {
        console.log('First line item:', {
          description: doc.lines[0].description,
          quantity: doc.lines[0].quantity
        });
      }
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
})();
