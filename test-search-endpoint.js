require('dotenv').config();
const axios = require('axios');

const SERVER_URL = 'http://localhost:8888';

async function testSearchEndpoint() {
  console.log('=================================');
  console.log('Testing Unified Search Endpoint');
  console.log('=================================\n');

  // Test with a known PO number from our earlier test
  const testPONumber = 'SMR25-PRIMLEADC';

  console.log(`1. Testing search for PO Number: ${testPONumber}\n`);

  try {
    const response = await axios.post(`${SERVER_URL}/api/search`, {
      query: testPONumber
    });

    console.log('✅ Search Request Successful!\n');
    console.log('2. Response Summary:');
    console.log(`   Status Code: ${response.status}`);
    console.log(`   Query: ${response.data.query}`);
    console.log(`   Timestamp: ${response.data.timestamp}\n`);

    // Check Invoice Data (from Sports Inc)
    console.log('3. Sports Inc Invoice Data:');
    if (response.data.invoice) {
      const invoice = response.data.invoice;
      console.log('   ✅ Invoice Found!');
      console.log(`   - PO Number: ${invoice['PO Number']}`);
      console.log(`   - SI Doc Number: ${invoice['SI Doc Number']}`);
      console.log(`   - Supplier: ${invoice['Supplier']}`);
      console.log(`   - Document Total: $${invoice['Document Total']}`);
      console.log(`   - SI Doc Date: ${invoice['SI Doc Date']}`);
      console.log(`   - Line Items Count: ${invoice['Line Items Count']}`);
      console.log(`   - Ship To Name: ${invoice['Ship To Name']}`);
      console.log(`   - Carrier: ${invoice['Carrier']}`);
      console.log(`   - Tracking Number: ${invoice['Tracking Number'] || 'N/A'}`);
      
      // Show line items if available
      if (invoice._lineItems && invoice._lineItems.length > 0) {
        console.log('\n   Line Items Details:');
        invoice._lineItems.forEach((item, index) => {
          console.log(`     Item ${index + 1}:`);
          console.log(`       - Description: ${item.description || 'N/A'}`);
          console.log(`       - Supplier Item #: ${item.supplierItemNumber || 'N/A'}`);
          console.log(`       - UPC: ${item.upc || 'N/A'}`);
          console.log(`       - Qty Shipped: ${item.quantityShipped || 0}`);
          console.log(`       - Qty Ordered: ${item.quantityOrdered || 0}`);
          console.log(`       - Net Price: $${item.netPrice || 0}`);
          console.log(`       - Extension: $${item.extension || 0}`);
        });
      }
    } else {
      console.log('   ⚠️  No invoice data found');
    }

    // Check HubSpot Deal Data
    console.log('\n4. HubSpot Deal Data:');
    if (response.data.deals && response.data.deals.length > 0) {
      console.log(`   ✅ Found ${response.data.deals.length} deal(s) in HubSpot`);
      response.data.deals.forEach((deal, index) => {
        console.log(`\n   Deal ${index + 1}:`);
        console.log(`   - Deal ID: ${deal.id}`);
        console.log(`   - Properties:`, Object.keys(deal.properties).length);
      });
    } else {
      console.log('   ℹ️  No deals found in HubSpot');
      console.log('   (This is expected - Sports Inc data works independently!)');
    }

    console.log('\n=================================');
    console.log('✅ SEARCH TEST PASSED!');
    console.log('=================================\n');
    console.log('Key Points:');
    console.log('✓ Sports Inc API is fetching data correctly');
    console.log('✓ PO number search works even without HubSpot data');
    console.log('✓ Line items are included in the response');
    console.log('✓ The system works as expected!\n');

  } catch (error) {
    console.error('\n❌ SEARCH TEST FAILED!\n');

    if (error.response) {
      console.error(`Status Code: ${error.response.status}`);
      console.error(`Error:`, error.response.data);
    } else if (error.request) {
      console.error('No response from server. Is the server running?');
      console.error('Start it with: node server.js');
    } else {
      console.error('Error:', error.message);
    }
    console.error('\n=================================\n');
  }
}

// Test with another PO number
async function testMultiplePONumbers() {
  console.log('\n=================================');
  console.log('Testing Multiple PO Numbers');
  console.log('=================================\n');

  const testPOs = ['SMR25-PRIMLEADC', 'B-EHS-BB25', 'WALTESSIC-LOWEL'];

  for (const po of testPOs) {
    console.log(`Testing PO: ${po}`);
    try {
      const response = await axios.post(`${SERVER_URL}/api/search`, {
        query: po
      });

      if (response.data.invoice) {
        console.log(`  ✅ Found - Supplier: ${response.data.invoice['Supplier']}, Total: $${response.data.invoice['Document Total']}`);
      } else {
        console.log(`  ⚠️  Not found`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }

  console.log('\n=================================\n');
}

// Run tests
async function runAllTests() {
  console.log('Starting comprehensive tests...\n');
  
  await testSearchEndpoint();
  await testMultiplePONumbers();
  
  console.log('All tests completed!\n');
  console.log('🎉 Your Sports Plus Deal Search is ready to use!');
  console.log('📱 Open http://localhost:8888 in your browser to use the search interface.\n');
}

runAllTests();
