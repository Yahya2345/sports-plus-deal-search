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
    const { dealId, propertyName, propertyValue } = JSON.parse(event.body);

    if (!dealId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'dealId is required' })
      };
    }

    if (!propertyName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'propertyName is required' })
      };
    }

    if (!HUBSPOT_ACCESS_TOKEN) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'HubSpot API token not configured' })
      };
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: updateResponse.data })
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
