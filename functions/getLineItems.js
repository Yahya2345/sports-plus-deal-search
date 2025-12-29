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
    const { dealId } = JSON.parse(event.body);

    if (!dealId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'dealId is required' })
      };
    }

    if (!HUBSPOT_ACCESS_TOKEN) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'HubSpot API token not configured' })
      };
    }

    // Get line item associations
    const associationsResponse = await axios.get(
      `${HUBSPOT_API_URL}/crm/v3/objects/deals/${dealId}?associations=line_items`,
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Try both 'line_items' (underscore) and 'line items' (space) formats
    const lineItemsData = associationsResponse.data.associations?.line_items || associationsResponse.data.associations?.['line items'];
    const lineItemIds = lineItemsData?.results?.map(item => item.id) || [];

    if (lineItemIds.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ lineItems: [] })
      };
    }

    // Batch fetch line item details
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ lineItems })
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
