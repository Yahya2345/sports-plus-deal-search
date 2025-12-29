const axios = require('axios');

const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const HUBSPOT_API_URL = 'https://api.hubapi.com';

exports.handler = async (event) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight CORS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'OK' })
    };
  }

  try {
    const { query } = JSON.parse(event.body);

    if (!query || query.length < 2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Query must be at least 2 characters' })
      };
    }

    if (!HUBSPOT_ACCESS_TOKEN) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'HubSpot API token not configured' })
      };
    }

    // Search for deals
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ deals })
    };
  } catch (error) {
    console.error('Error:', error.message);
    
    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({ 
        error: error.response?.data?.message || error.message || 'An error occurred' 
      })
    };
  }
};
