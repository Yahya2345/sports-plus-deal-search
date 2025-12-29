# Google Sheets Integration - Setup Summary

## ✅ Status: CONNECTED AND WORKING

### Current Configuration
- **Spreadsheet ID**: `1H7AT9aFP8Z4izzHmZ0f-tOkXpPYC4tdgyWUQQE_jfNk`
- **Sheet Name**: `Sheet1`
- **Service Account**: `sports-plus-sheets@sportsplus-481511.iam.gserviceaccount.com`
- **Status**: ✅ Fully connected and authenticated
- **Current Rows**: Empty (ready for data)

---

## 📋 Proposed Schema Design

### What You Want to Achieve:
Store **all invoices and line items** from Sports Inc in Google Sheets with:
- Each line item as a separate row
- Ability to update/mark items as complete
- Easy retrieval by PO Number

### Current Implementation Structure:
```
Row 1: Headers
Row 2+: Data rows
```

### **Recommended Column Structure:**

| A | B | C | D | E | F | G | H | I | J | K | ... | Status |
|---|---|---|---|---|---|---|---|---|---|---|----|--------|
| PO Number | SI Doc # | Supplier Doc # | Supplier | Ship Date | Document Total | Line Item # | Item Description | Qty | Price | Total | ... | Status |

---

## 🔄 Data Flow for Your Concept:

### Scenario: PO "MA25-MVILLE ACE" with 3 invoices (5 line items each)

**Google Sheets will have 15 rows** (one per line item):

```
PO: MA25-MVILLE ACE | SI Doc: 12345 | Item 1 | Qty: 100 | Status: Active
PO: MA25-MVILLE ACE | SI Doc: 12345 | Item 2 | Qty: 50  | Status: Active
PO: MA25-MVILLE ACE | SI Doc: 12345 | Item 3 | Qty: 75  | Status: Active
PO: MA25-MVILLE ACE | SI Doc: 12345 | Item 4 | Qty: 25  | Status: Active
PO: MA25-MVILLE ACE | SI Doc: 12345 | Item 5 | Qty: 100 | Status: Active

PO: MA25-MVILLE ACE | SI Doc: 12346 | Item 1 | Qty: 100 | Status: Active
...
(and so on)
```

---

## 📊 Implementation Plan

### Phase 1: **Create Structure (NOW)**
1. ✅ Set up column headers in Google Sheet
2. ✅ Add data insertion function

### Phase 2: **Add Line Items to Sheet**
1. When user searches a PO → fetch invoices from Sports Inc
2. For each invoice → expand line items
3. For each line item → create row in Google Sheet with:
   - PO Number (Column A)
   - Invoice details
   - Line item details
   - Status field (default: "Active")

### Phase 3: **Edit & Sync (Future)**
1. When user updates status in Portal
2. Update corresponding row in Google Sheet
3. When fetching: get from Google Sheet (cache) or Sports Inc (fresh)

---

## 🚀 What We Need to Do Next:

### Step 1: Define Column Headers
We need to decide exactly which fields to store. Current candidates:
```
- PO Number
- SI Doc Number
- Supplier Doc Number
- Supplier Name
- Invoice Ship Date
- Invoice Total
- Line Item Index
- Item Description
- Quantity
- Unit Price
- Line Total
- UPC
- Size
- Color
- Status (Active/Completed/Historical)
- Last Updated
```

### Step 2: Implement Line Item Storage
Modify `sportsInc.js` to:
- Expand each invoice's line items into separate rows
- Include line item index to track unique items

### Step 3: Implement Read/Update Functions
- `saveLineItemsToSheet()` - Add multiple line items
- `getLineItemsByPO()` - Fetch all items for a PO
- `updateLineItemStatus()` - Update specific line item status

---

## ✅ APIs Status Check:

### Sports Inc API ✅
- Connected: YES
- Fetching: Invoices + Line Items
- Status: WORKING

### HubSpot API ✅
- Connected: YES
- Status: WORKING (but hidden in UI for now)

### Google Sheets API ✅
- Connected: YES
- Authenticated: YES
- Ready: YES
- Status: WORKING

---

## 📌 Questions for You:

1. **Column Headers**: Should we use the exact fields I listed above, or different ones?
2. **Uniqueness**: Should we create a unique ID combining PO + SI Doc + Line Item Index?
3. **Active vs Historical**: Should line items inherit invoice status, or have separate tracking?
4. **Additional Fields**: Need any custom fields beyond what SI provides?

---

## 🎯 Next Steps (Once You Confirm):

1. Create finalized column headers
2. Build function to save invoices + line items to Sheet1
3. Build function to retrieve line items by PO Number
4. Build function to update line item status
5. Connect edit functionality in portal to Google Sheets
