require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

// Import Sports Inc service
const sportsInc = require('./services/sportsInc');

const app = express();
const PORT = process.env.PORT || 8888;

// HubSpot configuration
const HUBSPOT_API_URL = 'https://api.hubapi.com';
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Simplified search endpoint (without Google Sheets caching for now)
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    console.log(`\n=== Search for: ${query} ===`);

    // Get invoice data directly from Sports Inc (bypass Google Sheets)
    const invoiceData = await sportsInc.getInvoiceFromSportsInc(query).catch(err => {
      console.error('Invoice fetch error:', err.message);
      return null;
    });

    // Get HubSpot deal data
    const hubspotDeals = await searchHubSpotDeals(query).catch(err => {
      console.error('HubSpot fetch error:', err.message);
      return [];
    });

    // Return combined results
    res.json({
      success: true,
      query,
      invoice: invoiceData,
      deals: hubspotDeals,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Search HubSpot deals by Sales Order Number
 */
async function searchHubSpotDeals(query) {
  try {
    const response = await axios.post(
      `${HUBSPOT_API_URL}/crm/v3/objects/deals/search`,
      {
        filterGroups: [{
          filters: [{
            propertyName: 'sales_order_',
            operator: 'EQ',
            value: query
          }]
        }],
        properties: [],
        limit: 100
      },
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.results || [];
  } catch (error) {
    console.error('HubSpot search error:', error.message);
    throw error;
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET  /api/test - Test endpoint`);
  console.log(`   POST /api/search - Search for PO Number`);
  console.log(`\n✓ Sports Inc API: Configured`);
  console.log(`✓ HubSpot API: Configured\n`);
});
