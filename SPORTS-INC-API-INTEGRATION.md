# Sports Inc API Integration - Complete

## ✅ Integration Status: COMPLETE

The Sports Inc API has been fully integrated with the correct endpoint and authentication.

## API Configuration

### Endpoint
```
Base URL: https://api.sportsinc.com
Endpoint: /dealers/documents/
Method: GET
```

### Authentication
```
Header: X-API-KEY
Value: Your Sports Inc API Key (configured in .env)
```

## How It Works

### Search Parameters
When searching for a PO Number, the system calls:
```
GET https://api.sportsinc.com/dealers/documents/?poNumber={PO_NUMBER}&lines=true&active=true
```

Parameters:
- `poNumber`: The PO Number to search for
- `lines`: Set to `true` to include line item data
- `active`: Set to `true` to only get active documents

### Response Mapping

The API returns a document object with these properties, which are mapped to user-friendly names:

| API Property | Display Name | Description |
|--------------|--------------|-------------|
| `poNumber` | PO Number | Purchase Order Number |
| `siDocNumber` | SI Doc Number | Sports Inc Document Number |
| `siDocDate` | SI Doc Date | Sports Inc Document Date |
| `supplierDocNumber` | Supplier Doc Number | Supplier's Document Number |
| `supplierDocDate` | Supplier Doc Date | Supplier's Document Date |
| `supplier` | Supplier | Supplier Name |
| `dueDate` | Due Date | Payment Due Date |
| `discountDate` | Discount Date | Discount Available Until |
| `shipDate` | Ship Date | Actual Ship Date |
| `requestedShipDate` | Requested Ship Date | Requested Ship Date |
| `merchandiseTotal` | Merchandise Total | Total Merchandise Amount |
| `freightAmount` | Freight Amount | Freight Charges |
| `discountAmount` | Discount Amount | Available Discount |
| `salesTax` | Sales Tax | Sales Tax Amount |
| `exciseTax` | Excise Tax | Excise Tax Amount |
| `siUpcharge` | SI Upcharge | Sports Inc Upcharge |
| `svcHandleCharge` | Service/Handling Charge | Service/Handling Fee |
| `docTotal` | Document Total | Total Document Amount |
| `isCredit` | Is Credit | Whether document is a credit |
| `termsOfPayment` | Terms of Payment | Payment Terms |
| `termsOfDelivery` | Terms of Delivery | Delivery Terms |
| `carrier` | Carrier | Shipping Carrier |
| `weight` | Weight (LB) | Package Weight |
| `trackingNumber` | Tracking Number | Shipment Tracking Number |
| `methodOfPayment` | Method of Payment | Payment Method |
| `freightAllowance` | Freight Allowance | Freight Allowance Amount |

### Address Information

**Shipping Address:**
- Ship To Name
- Ship To Address
- Ship To Address 2
- Ship To City
- Ship To State
- Ship To Zip

**Supplier Address:**
- Supplier Address
- Supplier Address 2
- Supplier City
- Supplier State
- Supplier Zip
- Supplier Phone
- Supplier Fax

### Line Items

The system also captures:
- **Line Items Count**: Number of line items in the document
- **_lineItems**: Array of line item details (stored for potential future use)

Each line item contains:
- Supplier Item Number
- UPC
- Quantity Shipped
- Quantity Ordered
- Quantity Back Ordered
- Unit
- List Price
- Discount Percent
- Net Price
- Extension
- Size
- Color
- Description

## Caching Strategy

### How Caching Works

1. **First Request** (Cache Miss):
   ```
   User searches PO → Check Google Sheets → Not found →
   Call Sports Inc API → Save to Google Sheets → Display
   ```

2. **Subsequent Requests** (Cache Hit):
   ```
   User searches PO → Check Google Sheets → Found → Display
   (No API call needed!)
   ```

### Cache Benefits
- ⚡ **Faster Load Times**: Cached data loads instantly
- 💰 **Reduced API Calls**: Saves on API usage limits
- 📊 **Historical Data**: Keep data even if removed from Sports Inc system
- 🔄 **Cache Indicator**: Frontend shows whether data came from cache or API

## Frontend Display

The invoice data is displayed in the **left column** with:
- Green accent color (border-top)
- All properties listed as key-value pairs
- Automatic formatting:
  - Amounts formatted as currency
  - Dates formatted in readable format
- Cache source indicator at the bottom:
  - "✓ Loaded from Cache (Google Sheets)" - Green
  - "✓ Fetched from Sports Inc API (Cached for future)" - Also cached

## Testing the Integration

### Test with a Real PO Number

1. **Open the app**: `http://localhost:8888`
2. **Enter a PO Number** in the search box
3. **Watch the console** for API activity:
   ```
   Checking Google Sheets cache for PO {number}
   Not in cache, fetching from Sports Inc API...
   Fetching invoice from Sports Inc for PO: {number}
   Successfully fetched invoice for PO {number} from Sports Inc
   Saving to Google Sheets cache...
   ✓ Saved to cache
   ```

4. **Search the same PO again** to see caching:
   ```
   Checking Google Sheets cache for PO {number}
   ✓ Found in cache (Google Sheets)
   ```

### Expected Results

**Left Column (Invoice Data):**
- All invoice properties displayed
- Green border at top
- Cache indicator at bottom

**Right Column (HubSpot Deals):**
- Deal information if PO Number matches
- Orange border at top
- Line items expandable

## Error Handling

The system handles these scenarios:

| Scenario | Behavior |
|----------|----------|
| PO Number not in Sports Inc | Shows "No invoice data found in Sports Inc Tool" |
| PO Number not in HubSpot | Shows "No HubSpot deals found" |
| Both not found | Shows "No data found matching your search" |
| API authentication fails | Error message with details |
| Network error | Error message with details |

## Property Name Display

**Yes, the system automatically displays property names!**

All properties fetched from the Sports Inc API are:
1. **Automatically mapped** to user-friendly names
2. **Displayed dynamically** in the frontend
3. **Formatted appropriately**:
   - Currency values: $1,234.56
   - Dates: Jan 15, 2025
   - Text: As-is

**You don't need to manually add property names** - the system:
- Maps API property names (like `siDocNumber`) to readable names (like "SI Doc Number")
- Handles all properties automatically
- Shows them in the invoice column

If Sports Inc adds new properties in the future, they will automatically appear in the display!

## API Limitations (from Sports Inc Documentation)

- **Maximum 1000 documents** per API call
- **Paging recommended** for large result sets
- **Best time to fetch**: After 10:30 AM EST (allows Sports Inc internal processing to complete)
- **Line items**: Only available for EDI documents (not scanned documents)

## Refresh Cache

To force a refresh from the Sports Inc API:

**Endpoint**: `POST /api/cache/refresh`

```bash
curl -X POST http://localhost:8888/api/cache/refresh \
  -H "Content-Type: application/json" \
  -d '{"poNumber":"YOUR_PO_NUMBER"}'
```

This will:
1. Fetch fresh data from Sports Inc API
2. Update Google Sheets cache
3. Return the updated invoice data

---

## 🎉 Status: READY TO USE

The Sports Inc API integration is complete and ready for production use!

**Server**: `http://localhost:8888`

**All Three APIs Integrated:**
- ✅ Sports Inc Tool API (Invoice Data)
- ✅ Google Sheets API (Caching)
- ✅ HubSpot CRM API (Deals & Line Items)
