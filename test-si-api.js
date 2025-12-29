require('dotenv').config();
const axios = require('axios');

const SPORTSINC_API_URL = 'https://api.sportsinc.com';
const SPORTSINC_API_KEY = process.env.SPORTSINC_API_KEY;

async function testSportsIncAPI() {
  console.log('=================================');
  console.log('Testing Sports Inc API Connection');
  console.log('=================================\n');

  // Check API key
  console.log('1. Checking API Key Configuration:');
  console.log(`   API Key Present: ${!!SPORTSINC_API_KEY}`);
  console.log(`   API Key Length: ${SPORTSINC_API_KEY?.length || 0} characters`);
  console.log(`   API Key (first 20 chars): ${SPORTSINC_API_KEY?.substring(0, 20)}...`);
  console.log('');

  if (!SPORTSINC_API_KEY) {
    console.error('❌ ERROR: SPORTSINC_API_KEY is not configured in .env file');
    return;
  }

  // Test 1: Try to fetch a document (you can replace with a known PO number)
  console.log('2. Testing API Endpoint:');
  console.log(`   Endpoint: ${SPORTSINC_API_URL}/dealers/documents/`);
  console.log('   Testing with sample query parameters...\n');

  try {
    // First, let's try to get all recent documents (last page, limited)
    console.log('   Attempting to fetch recent documents...');
    const response = await axios.get(`${SPORTSINC_API_URL}/dealers/documents/`, {
      params: {
        page: 1,
        pageSize: 5,
        active: true
      },
      headers: {
        'X-API-KEY': SPORTSINC_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('   ✅ API Connection Successful!\n');
    console.log('3. API Response Summary:');
    console.log(`   Status Code: ${response.status}`);
    console.log(`   Total Documents: ${response.data.totalCount || 'N/A'}`);
    console.log(`   Total Pages: ${response.data.totalPages || 'N/A'}`);
    console.log(`   Current Page: ${response.data.pageNumber || 'N/A'}`);
    console.log(`   Page Size: ${response.data.pageSize || 'N/A'}`);
    console.log(`   Documents Returned: ${response.data.items?.length || 0}`);
    console.log('');

    if (response.data.items && response.data.items.length > 0) {
      console.log('4. Sample Documents Found:');
      response.data.items.forEach((doc, index) => {
        console.log(`\n   Document #${index + 1}:`);
        console.log(`   - PO Number: ${doc.poNumber || 'N/A'}`);
        console.log(`   - SI Doc Number: ${doc.siDocNumber || 'N/A'}`);
        console.log(`   - Supplier: ${doc.supplier || 'N/A'}`);
        console.log(`   - Document Total: $${doc.docTotal || '0.00'}`);
        console.log(`   - SI Doc Date: ${doc.siDocDate || 'N/A'}`);
        console.log(`   - Line Items: ${doc.lines?.length || 0}`);
      });

      // Now test with a specific PO number
      const testPO = response.data.items[0].poNumber;
      if (testPO) {
        console.log(`\n5. Testing PO Number Search:`);
        console.log(`   Searching for PO: ${testPO}\n`);

        const poResponse = await axios.get(`${SPORTSINC_API_URL}/dealers/documents/`, {
          params: {
            poNumber: testPO,
            lines: true,
            active: true
          },
          headers: {
            'X-API-KEY': SPORTSINC_API_KEY,
            'Content-Type': 'application/json'
          }
        });

        if (poResponse.data.items && poResponse.data.items.length > 0) {
          const doc = poResponse.data.items[0];
          console.log('   ✅ PO Number Search Successful!');
          console.log(`   - Found Document: ${doc.siDocNumber}`);
          console.log(`   - Supplier: ${doc.supplier}`);
          console.log(`   - Total: $${doc.docTotal}`);
          console.log(`   - Line Items: ${doc.lines?.length || 0}`);
        } else {
          console.log('   ⚠️  No documents found for this PO number');
        }
      }
    } else {
      console.log('4. No documents found in the response.');
      console.log('   This might mean:');
      console.log('   - No active documents in your account');
      console.log('   - All documents are marked as historical');
    }

    console.log('\n=================================');
    console.log('✅ ALL TESTS PASSED!');
    console.log('=================================\n');
    console.log('The Sports Inc API is working correctly.');
    console.log('You can now run the server with: node server.js\n');

  } catch (error) {
    console.error('\n❌ API TEST FAILED!\n');

    if (error.response) {
      console.error(`Status Code: ${error.response.status}`);
      console.error(`Status Text: ${error.response.statusText}`);
      console.error(`Response Data:`, JSON.stringify(error.response.data, null, 2));

      if (error.response.status === 401) {
        console.error('\n⚠️  Authentication Error:');
        console.error('   The API key is invalid or expired.');
        console.error('   Please check your SPORTSINC_API_KEY in the .env file.');
      } else if (error.response.status === 403) {
        console.error('\n⚠️  Authorization Error:');
        console.error('   Your API key does not have permission to access this endpoint.');
      } else if (error.response.status === 404) {
        console.error('\n⚠️  Endpoint Not Found:');
        console.error('   The API endpoint might be incorrect.');
      }
    } else if (error.request) {
      console.error('No response received from the server.');
      console.error('Error:', error.message);
      console.error('\n⚠️  Possible causes:');
      console.error('   - Network connectivity issues');
      console.error('   - API server is down');
      console.error('   - Firewall blocking the request');
    } else {
      console.error('Error:', error.message);
    }

    console.error('\n=================================\n');
  }
}

// Run the test
testSportsIncAPI();
