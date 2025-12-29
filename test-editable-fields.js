require('dotenv').config();
const axios = require('axios');

const SERVER_URL = 'http://localhost:8888';

async function testEditableFieldsFlow() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Testing Editable Line Item Fields - End to End');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Test 1: Search for a PO and get invoices
    console.log('1️⃣  SEARCHING FOR INVOICES...\n');
    const testPO = 'SMR25-PRIMLEADC';
    console.log(`   Searching for PO: ${testPO}\n`);

    const searchResponse = await axios.post(`${SERVER_URL}/api/search`, {
      query: testPO
    });

    if (!searchResponse.data.invoices || searchResponse.data.invoices.length === 0) {
      console.log('   ⚠️  No invoices found. Searching may require actual data.\n');
      console.log('   📝 To test manually:');
      console.log('      1. Go to http://localhost:8888');
      console.log('      2. Enter a PO number from your Sports Inc API');
      console.log('      3. Click a line item\'s "Save Changes" button');
      console.log('      4. Fill in one or more inspection fields');
      console.log('      5. Click "Save Changes" button');
      console.log('      6. Check the Google Sheet for updated values\n');
      return;
    }

    const invoice = searchResponse.data.invoices[0];
    console.log(`   ✅ Found Invoice:`);
    console.log(`      - PO Number: ${invoice['PO Number']}`);
    console.log(`      - SI Doc Number: ${invoice['SI Doc Number']}`);
    console.log(`      - Status: ${invoice.Status}`);
    console.log(`      - Line Items: ${invoice._lineItems?.length || 0}\n`);

    // Test 2: Update a line item
    if (invoice._lineItems && invoice._lineItems.length > 0) {
      console.log('2️⃣  TESTING LINE ITEM UPDATE...\n');

      const testLineItemIndex = 1;
      const testUpdates = {
        'Inspector': 'JJ',
        'Inspection Status': 'Complete',
        'Actual Shipping Date': '2025-01-15',
        'Shelf Location': 'Aisle A-5',
        'Moved to Other Shelf': 'No'
      };

      console.log(`   Updating line item #${testLineItemIndex}:`);
      console.log(`   PO: ${invoice['PO Number']}`);
      console.log(`   SI Doc: ${invoice['SI Doc Number']}`);
      console.log(`   Updates:`, testUpdates);
      console.log();

      const updateResponse = await axios.post(`${SERVER_URL}/api/updateLineItem`, {
        poNumber: invoice['PO Number'],
        siDocNumber: invoice['SI Doc Number'],
        lineItemIndex: testLineItemIndex,
        updates: testUpdates
      });

      if (updateResponse.data.success) {
        console.log(`   ✅ Update Successful!`);
        console.log(`      ${updateResponse.data.message}\n`);
      } else {
        console.log(`   ⚠️  Update failed: ${updateResponse.data.error}\n`);
      }
    }

    // Test 3: Verify Google Sheet updated
    console.log('3️⃣  VERIFICATION\n');
    console.log('   ✅ Check your Google Sheet "Invoice Data" tab:');
    console.log('      - Find the row with matching PO + SI Doc + Line Item Index');
    console.log('      - Columns O-U should contain your updated values\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✨ Editable Fields System Ready for Testing');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Test Error:', error.response?.data || error.message);
  }
}

testEditableFieldsFlow();
