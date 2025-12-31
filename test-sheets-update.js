// Test Google Sheets Update Function
require('dotenv').config();
const googleSheets = require('./services/googleSheets');

async function testUpdate() {
  console.log('🧪 Testing Google Sheets Update...\n');
  
  // Check environment variables
  console.log('✅ Environment Variables:');
  console.log('   GOOGLE_SHEETS_ID:', process.env.GOOGLE_SHEETS_ID ? '✓ Set' : '✗ Missing');
  console.log('   GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✓ Set' : '✗ Missing');
  console.log('   GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✓ Set' : '✗ Missing');
  console.log('');
  
  try {
    // Test 1: Get line items for a PO
    console.log('📋 Test 1: Fetching line items for a PO...');
    const testPO = 'JG25-252'; // Use actual PO number from your data
    const lineItems = await googleSheets.getLineItemsForPO(testPO);
    console.log(`   Found ${lineItems.length} line items for PO ${testPO}`);
    
    if (lineItems.length > 0) {
      console.log('   First line item:', {
        'PO Number': lineItems[0]['PO Number'],
        'SI Doc Number': lineItems[0]['SI Doc Number'],
        'Line Item Index': lineItems[0]['Line Item Index'],
        'Item Description': lineItems[0]['Item Description']?.substring(0, 50),
        'Inspection Status': lineItems[0]['Inspection Status'] || '(empty)',
        'Inspector': lineItems[0]['Inspector'] || '(empty)',
      });
      console.log('');
      
      // Test 2: Try updating a line item
      console.log('📝 Test 2: Updating line item...');
      const testUpdate = {
        'Actual Shipping Date': '2025-01-05',
        'Inspector': 'Test Inspector',
        'Inspection Status': 'Complete',
        'Inspection Notes': 'Test update from script'
      };
      
      const siDocNumber = lineItems[0]['SI Doc Number'];
      const lineItemIndex = lineItems[0]['Line Item Index'];
      
      console.log(`   Updating: PO=${testPO}, SIDoc=${siDocNumber}, Index=${lineItemIndex}`);
      console.log('   Updates:', testUpdate);
      
      const success = await googleSheets.updateLineItemInSheet(
        testPO,
        siDocNumber,
        Number(lineItemIndex),
        testUpdate
      );
      
      if (success) {
        console.log('   ✅ Update successful!');
        
        // Verify the update
        console.log('\n🔍 Test 3: Verifying update...');
        const updatedItems = await googleSheets.getLineItemsForPO(testPO);
        const updatedItem = updatedItems.find(item => 
          item['SI Doc Number'] === siDocNumber && 
          item['Line Item Index'] == lineItemIndex
        );
        
        if (updatedItem) {
          console.log('   Updated values:');
          console.log('   - Actual Shipping Date:', updatedItem['Actual Shipping Date']);
          console.log('   - Inspector:', updatedItem['Inspector']);
          console.log('   - Inspection Status:', updatedItem['Inspection Status']);
          console.log('   - Inspection Notes:', updatedItem['Inspection Notes']);
        }
      } else {
        console.log('   ❌ Update failed');
      }
    } else {
      console.log(`   ⚠️  No line items found for PO ${testPO}`);
      console.log('   Try changing the testPO value to a PO that exists in your sheet.');
    }
    
  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    console.error('Stack:', error.stack);
  }
}

testUpdate();
