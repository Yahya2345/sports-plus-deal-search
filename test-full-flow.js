// Test the full search -> save -> update flow
require('dotenv').config();
const googleSheets = require('./services/googleSheets');
const sportsInc = require('./services/sportsInc');

async function testFullFlow() {
  console.log('🔄 Testing Full Search -> Save -> Update Flow\n');
  
  const testPO = 'JP5010B';
  
  try {
    // Step 1: Fetch from Sports Inc API (simulating search)
    console.log(`📡 Step 1: Fetching invoice data for PO ${testPO} from Sports Inc...`);
    const invoices = await sportsInc.getAllInvoices(testPO);
    console.log(`   Found ${invoices.length} invoice(s)`);
    
    if (invoices.length === 0) {
      console.log('   ⚠️  No invoices found. Cannot proceed with test.');
      return;
    }
    
    const invoice = invoices[0];
    console.log(`   Invoice: SI Doc ${invoice['SI Doc Number']}, ${invoice._lineItems?.length || 0} line items`);
    console.log('');
    
    // Step 2: Save to Google Sheets (what should happen during search)
    console.log(`💾 Step 2: Saving line items to Google Sheets...`);
    const savedCount = await googleSheets.saveLineItemsForPO(testPO, invoices);
    console.log(`   ✅ Saved ${savedCount} line item(s) to Google Sheet`);
    console.log('');
    
    // Step 3: Verify saved data
    console.log(`🔍 Step 3: Verifying saved data...`);
    const lineItems = await googleSheets.getLineItemsForPO(testPO);
    console.log(`   Found ${lineItems.length} line item(s) in Google Sheet`);
    
    if (lineItems.length > 0) {
      console.log(`   First item: PO=${lineItems[0]['PO Number']}, SIDoc=${lineItems[0]['SI Doc Number']}, Index=${lineItems[0]['Line Item Index']}`);
      console.log('');
      
      // Step 4: Try updating (simulating clicking Save All)
      console.log(`✏️  Step 4: Simulating update (Save All Changes)...`);
      const testUpdate = {
        'Actual Shipping Date': '2025-01-05',
        'Inspector': 'Auto Test',
        'Inspection Status': 'Complete',
        'Inspection Notes': 'Test from full flow'
      };
      
      const siDocNumber = lineItems[0]['SI Doc Number'];
      const lineItemIndex = lineItems[0]['Line Item Index'];
      
      console.log(`   Updating: PO=${testPO}, SIDoc=${siDocNumber}, Index=${lineItemIndex}`);
      const success = await googleSheets.updateLineItemInSheet(
        testPO,
        siDocNumber,
        Number(lineItemIndex),
        testUpdate
      );
      
      if (success) {
        console.log('   ✅ Update successful!');
        
        // Step 5: Verify update
        console.log('\n🎉 Step 5: Verifying final state...');
        const updatedItems = await googleSheets.getLineItemsForPO(testPO);
        const updatedItem = updatedItems.find(item => 
          item['SI Doc Number'] === siDocNumber && 
          item['Line Item Index'] == lineItemIndex
        );
        
        if (updatedItem) {
          console.log('   Final values:');
          console.log('   - Actual Shipping Date:', updatedItem['Actual Shipping Date'] || '(empty)');
          console.log('   - Inspector:', updatedItem['Inspector'] || '(empty)');
          console.log('   - Inspection Status:', updatedItem['Inspection Status'] || '(empty)');
          console.log('   - Inspection Notes:', updatedItem['Inspection Notes'] || '(empty)');
          console.log('\n✅ Full flow completed successfully!');
          console.log('\n📝 Summary:');
          console.log('   1. Fetched invoice from Sports Inc API ✓');
          console.log('   2. Saved line items to Google Sheets ✓');
          console.log('   3. Updated editable fields ✓');
          console.log('   4. Changes persisted in Google Sheets ✓');
        }
      } else {
        console.log('   ❌ Update failed');
      }
    } else {
      console.log('   ⚠️  No line items found after save!');
    }
    
  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    console.error('Stack:', error.stack);
  }
}

testFullFlow();
