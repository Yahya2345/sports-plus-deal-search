# Testing Guide - Sports Plus Deal Search Portal

## ✅ Server Status: RUNNING

**URL**: `http://localhost:8888`

The server is running and ready to test!

## How the Search Works

The search is **completely independent** for each API:

### Scenario 1: PO Number Only in Sports Inc
**Example**: PO Number exists in Sports Inc Tool but not in HubSpot

**What Happens:**
- ✅ **Left Column**: Shows invoice data from Sports Inc
- ⚠️ **Right Column**: Shows "No HubSpot deals found"

**Result**: You still get the invoice data!

### Scenario 2: PO Number Only in HubSpot
**Example**: Sales Order Number exists in HubSpot but not in Sports Inc

**What Happens:**
- ⚠️ **Left Column**: Shows "No invoice data found in Sports Inc Tool"
- ✅ **Right Column**: Shows HubSpot deals with line items

**Result**: You still get the HubSpot data!

### Scenario 3: PO Number in Both Systems
**Example**: Number exists in both Sports Inc and HubSpot

**What Happens:**
- ✅ **Left Column**: Shows invoice data from Sports Inc
- ✅ **Right Column**: Shows HubSpot deals with line items

**Result**: You get both! Complete view of all data.

### Scenario 4: PO Number in Neither System
**Example**: Number doesn't exist anywhere

**What Happens:**
- ⚠️ **Left Column**: Shows "No invoice data found"
- ⚠️ **Right Column**: Shows "No HubSpot deals found"

**Result**: Shows "No data found matching your search"

## Testing Steps

### Step 1: Open the Portal
```
http://localhost:8888
```

### Step 2: Test with a Real PO Number

**Get a PO Number from your Sports Inc system**, for example:
- From the SportsWeb Invoice Center
- From a recent invoice
- From your records

### Step 3: Enter PO Number in Search Box

Type or paste the PO Number and press Enter (or wait 500ms for auto-search).

### Step 4: Observe Results

#### If Invoice Data Appears (Left Column):
✅ Sports Inc API is working correctly!

You should see:
- Green border at top
- All invoice properties (30+ fields)
- Document Total, Supplier, Ship Date, etc.
- Cache indicator at bottom

#### If HubSpot Deals Appear (Right Column):
✅ HubSpot API is working correctly!

You should see:
- Orange border at top
- Deal name and amount
- Close date, pipeline, stage
- All deal properties section
- Line items (if available)

#### If Neither Appears:
The PO Number doesn't exist in either system - this is expected if:
- It's a test/fake number
- It's not yet in the systems
- It's been archived/deleted

## Example Test Cases

### Test Case 1: Valid Sports Inc PO
```
PO Number: [Your actual PO from Sports Inc]
Expected: Invoice data shows on left
```

### Test Case 2: Valid HubSpot Sales Order
```
Sales Order: [Your actual SO from HubSpot]
Expected: Deal data shows on right
```

### Test Case 3: Number in Both Systems
```
PO/SO Number: [Number that exists in both]
Expected: Both columns show data
```

### Test Case 4: Invalid Number
```
PO Number: INVALID123
Expected: "No data found" message
```

## Console Logs to Watch

Open Browser Developer Tools (F12) → Console tab to see:

### For Sports Inc:
```
Checking Google Sheets cache for PO {number}
Not in cache, fetching from Sports Inc API...
Fetching invoice from Sports Inc for PO: {number}
Successfully fetched invoice for PO {number} from Sports Inc
Saving to Google Sheets cache...
✓ Saved to cache
```

Or if not found:
```
No invoice found in Sports Inc for PO {number}
```

### For HubSpot:
```
Found deals: 1
```

Or if not found:
```
Found deals: 0
```

## Cache Testing

### First Search (Cache Miss):
1. Search for a PO Number
2. Watch console: "Not in cache, fetching from Sports Inc API..."
3. See invoice data display
4. Notice: "✓ Fetched from Sports Inc API (Cached for future)"

### Second Search (Cache Hit):
1. Search for the **same PO Number** again
2. Watch console: "✓ Found in cache (Google Sheets)"
3. See invoice data display instantly
4. Notice: "✓ Loaded from Cache (Google Sheets)"

**Much faster!** No API call needed.

## Troubleshooting

### Issue: "No invoice data found" but PO exists in Sports Inc

**Possible Causes:**
1. **API Key Invalid**: Check `.env` file has correct `SPORTSINC_API_KEY`
2. **Document is Historical**: Only active documents are fetched
3. **PO Number Format**: Ensure exact match (case-sensitive)

**Fix:**
```bash
# Check server console for error messages
# Look for authentication errors or API errors
```

### Issue: "No HubSpot deals found" but SO exists in HubSpot

**Possible Causes:**
1. **API Token Invalid**: Check `.env` file has correct `HUBSPOT_ACCESS_TOKEN`
2. **Property Name Mismatch**: HubSpot property must be `sales_order_`
3. **Deal Archived**: Only active deals are searched

**Fix:**
- Verify the Sales Order Number property in HubSpot
- Check deal is not archived

### Issue: Both APIs returning "not found"

**Cause**: The number truly doesn't exist in either system

**This is normal!** Try with a known valid PO/SO number.

## API Independence Verification

To verify APIs work independently, you can test:

**Terminal Test:**
```bash
# Test search endpoint
curl -X POST http://localhost:8888/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"YOUR_PO_NUMBER"}'
```

**Response Example (both found):**
```json
{
  "success": true,
  "query": "PO12345",
  "invoice": {
    "PO Number": "PO12345",
    "Document Total": 1500.00,
    ...
  },
  "deals": [
    {
      "id": "123456",
      "properties": {
        "dealname": "Custom Order",
        ...
      }
    }
  ],
  "timestamp": "2025-12-18T12:00:00.000Z"
}
```

**Response Example (only invoice found):**
```json
{
  "success": true,
  "query": "PO12345",
  "invoice": { ... },
  "deals": [],
  "timestamp": "2025-12-18T12:00:00.000Z"
}
```

**Response Example (only deal found):**
```json
{
  "success": true,
  "query": "SO12345",
  "invoice": null,
  "deals": [ ... ],
  "timestamp": "2025-12-18T12:00:00.000Z"
}
```

## Success Indicators

✅ **Sports Inc API Working:**
- Invoice properties display in left column
- Green border visible
- Cache indicator shows at bottom

✅ **HubSpot API Working:**
- Deal cards display in right column
- Orange border visible
- Line items load (if available)

✅ **Google Sheets Caching Working:**
- First search: "Fetched from Sports Inc API"
- Second search: "Loaded from Cache"
- Faster load time on cached searches

✅ **Independent Operation:**
- Can show invoice without HubSpot data
- Can show HubSpot data without invoice
- Both work separately and together

---

## 🎯 Ready to Test!

**Open**: `http://localhost:8888`

**Enter**: Any PO Number from your Sports Inc system

**Watch**: The magic of independent API searches! 🚀
