require('dotenv').config();
const axios = require('axios');
const key = process.env.SPORTSINC_API_KEY;
(async () => {
  try {
    const resp = await axios.get('https://api.sportsinc.com/dealers/documents/', {
      params: { poNumber: 'MA25-MVILLE ACE', lines: true, page: 1, pageSize: 5 },
      headers: { 'X-API-KEY': key }
    });
    const doc = resp.data.items[0];
    console.log('Keys:', Object.keys(doc));
    console.log(JSON.stringify(doc, null, 2));
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
})();
