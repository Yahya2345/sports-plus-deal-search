const http = require('http');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const PORT = 8888;
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN || 'pat-na1-c2a40bed-9946-4dbb-bdf1-573ca85dc1ee';
const HUBSPOT_API_URL = 'https://api.hubapi.com';

// MIME types for serving static files
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

const server = http.createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`${req.method} ${req.url}`);

  // Handle API endpoints
  if (req.url === '/.netlify/functions/searchDeals' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { query } = JSON.parse(body);

        if (!query || query.length < 2) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Query must be at least 2 characters' }));
          return;
        }

        if (!HUBSPOT_ACCESS_TOKEN) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'HubSpot API token not configured' }));
          return;
        }

        console.log('Searching for deals with query:', query);

        const searchResponse = await axios.post(
          `${HUBSPOT_API_URL}/crm/v3/objects/deals/search`,
          {
            filterGroups: [{
              filters: [{
                propertyName: 'sales_order_',
                operator: 'EQ',
                value: query
              }]
            }],
            properties: [], // Fetch all properties
            limit: 100
          },
          {
            headers: {
              'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const deals = searchResponse.data.results || [];
        console.log(`Found ${deals.length} deals`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ deals }));
      } catch (error) {
        console.error('Error searching deals:', error.message);
        res.writeHead(error.response?.status || 500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: error.response?.data?.message || error.message || 'An error occurred'
        }));
      }
    });
    return;
  }

  if (req.url === '/.netlify/functions/getLineItems' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { dealId } = JSON.parse(body);

        if (!dealId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'dealId is required' }));
          return;
        }

        if (!HUBSPOT_ACCESS_TOKEN) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'HubSpot API token not configured' }));
          return;
        }

        console.log('Fetching line items for deal:', dealId);

        const associationsResponse = await axios.get(
          `${HUBSPOT_API_URL}/crm/v3/objects/deals/${dealId}?associations=line_items`,
          {
            headers: {
              'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Associations response:', JSON.stringify(associationsResponse.data.associations, null, 2));

        // Try both 'line_items' (underscore) and 'line items' (space) formats
        const lineItemsData = associationsResponse.data.associations?.line_items || associationsResponse.data.associations?.['line items'];
        const lineItemIds = lineItemsData?.results?.map(item => item.id) || [];
        console.log(`Found ${lineItemIds.length} line item IDs:`, lineItemIds);

        if (lineItemIds.length === 0) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ lineItems: [] }));
          return;
        }

        const lineItemsResponse = await axios.post(
          `${HUBSPOT_API_URL}/crm/v3/objects/line_items/batch/read`,
          {
            properties: ['name', 'quantity', 'price', 'amount', 'description'],
            inputs: lineItemIds.map(id => ({ id: id.toString() }))
          },
          {
            headers: {
              'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const lineItems = lineItemsResponse.data.results || [];
        console.log(`Fetched ${lineItems.length} line items`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ lineItems }));
      } catch (error) {
        console.error('Error fetching line items:', error.message);
        res.writeHead(error.response?.status || 500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: error.response?.data?.message || error.message || 'An error occurred'
        }));
      }
    });
    return;
  }

  if (req.url === '/.netlify/functions/updateDeal' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { dealId, propertyName, propertyValue } = JSON.parse(body);

        if (!dealId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'dealId is required' }));
          return;
        }

        if (!propertyName) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'propertyName is required' }));
          return;
        }

        if (!HUBSPOT_ACCESS_TOKEN) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'HubSpot API token not configured' }));
          return;
        }

        console.log(`Updating deal ${dealId} - ${propertyName}:`, propertyValue);

        const updateResponse = await axios.patch(
          `${HUBSPOT_API_URL}/crm/v3/objects/deals/${dealId}`,
          {
            properties: {
              [propertyName]: propertyValue
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Deal updated successfully');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: updateResponse.data }));
      } catch (error) {
        console.error('Error updating deal:', error.message);
        res.writeHead(error.response?.status || 500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: error.response?.data?.message || error.message || 'An error occurred'
        }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = './public' + (req.url === '/' ? '/index.html' : req.url);
  const extname = path.extname(filePath);
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('404 - File Not Found');
      } else {
        res.writeHead(500);
        res.end('500 - Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n✅ Server running at http://localhost:${PORT}`);
  console.log(`🔍 HubSpot API Token: ${HUBSPOT_ACCESS_TOKEN ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   • http://localhost:${PORT} (Frontend)`);
  console.log(`   • POST /.netlify/functions/searchDeals`);
  console.log(`   • POST /.netlify/functions/getLineItems\n`);
});
