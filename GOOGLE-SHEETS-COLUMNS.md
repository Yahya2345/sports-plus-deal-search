# Google Sheets - Complete Column Structure

## 📋 CREATE THESE COLUMNS IN GOOGLE SHEET (Sheet1)

### **Instructions:**
1. Go to your Google Sheet: https://docs.google.com/spreadsheets/d/1H7AT9aFP8Z4izzHmZ0f-tOkXpPYC4tdgyWUQQE_jfNk
2. Open **Sheet1**
3. Create these column headers in **Row 1** (exactly as listed below)
4. Start adding data from **Row 2**

---

## 📝 COLUMN HEADERS (Copy-Paste These)

| # | Column Name | Data Type | Purpose | Required |
|---|-------------|-----------|---------|----------|
| A | PO Number | Text | Primary key - Groups all items by PO | ✅ YES |
| B | SI Doc Number | Text | Invoice identifier from Sports Inc | ✅ YES |
| C | SI Doc Date | Date | Date invoice was created | ✅ YES |
| D | Supplier Doc Number | Text | Vendor's document number | ✅ YES |
| E | Supplier Doc Date | Date | Vendor's document date | ✅ YES |
| F | Supplier Name | Text | Vendor/Supplier name | ✅ YES |
| G | Ship Date | Date | When items were shipped | ✅ YES |
| H | Requested Ship Date | Date | Originally requested ship date | ❌ NO |
| I | Invoice Status | Text | Active / Historical | ✅ YES |
| J | Merchandise Total | Currency | Subtotal before charges | ❌ NO |
| K | Freight Amount | Currency | Shipping cost | ❌ NO |
| L | Discount Amount | Currency | Discount given | ❌ NO |
| M | Sales Tax | Currency | Sales tax amount | ❌ NO |
| N | Excise Tax | Currency | Excise tax amount | ❌ NO |
| O | SI Upcharge | Currency | SI service charge | ❌ NO |
| P | Service/Handling Charge | Currency | Handling fees | ❌ NO |
| Q | Invoice Total | Currency | Total invoice amount | ✅ YES |
| R | Tracking Number | Text | Package tracking # | ❌ NO |
| S | Method of Payment | Text | Payment method | ❌ NO |
| T | Freight Allowance | Currency | Freight credit | ❌ NO |
| U | Ship To Name | Text | Recipient name | ❌ NO |
| V | Ship To Address | Text | Street address | ❌ NO |
| W | Ship To Address 2 | Text | Apt/Suite number | ❌ NO |
| X | Ship To City | Text | City | ❌ NO |
| Y | Ship To State | Text | State | ❌ NO |
| Z | Ship To Zip | Text | Zip code | ❌ NO |
| AA | Supplier Address | Text | Vendor street | ❌ NO |
| AB | Supplier Address 2 | Text | Vendor apt/suite | ❌ NO |
| AC | Supplier City | Text | Vendor city | ❌ NO |
| AD | Supplier State | Text | Vendor state | ❌ NO |
| AE | Supplier Zip | Text | Vendor zip | ❌ NO |
| AF | Supplier Phone | Text | Vendor phone | ❌ NO |
| AG | Supplier Fax | Text | Vendor fax | ❌ NO |
| AH | Line Item Index | Number | Item # (1, 2, 3, etc) | ✅ YES |
| AI | Item Description | Text | Product name/description | ✅ YES |
| AJ | Supplier Item Number | Text | Vendor's SKU | ❌ NO |
| AK | UPC | Text | UPC/Barcode | ❌ NO |
| AL | Size | Text | Item size | ❌ NO |
| AM | Color | Text | Item color | ❌ NO |
| AN | Quantity Ordered | Number | Original quantity | ❌ NO |
| AO | Quantity Shipped | Number | Actual shipped qty | ✅ YES |
| AP | Unit Price | Currency | Price per unit | ✅ YES |
| AQ | Net Price | Currency | Net unit price | ❌ NO |
| AR | List Price | Currency | Original list price | ❌ NO |
| AS | Line Item Total | Currency | Qty × Unit Price | ✅ YES |
| AT | Item Status | Text | Active / Complete / Pending | ✅ YES |
| AU | Last Updated | DateTime | When data was last changed | ✅ YES |
| AV | Notes | Text | Optional notes/comments | ❌ NO |

---

## 🎯 REQUIRED COLUMNS (Minimum Setup)

If you want to start simple, use **ONLY these columns**:

```
A: PO Number
B: SI Doc Number
C: SI Doc Date
D: Supplier Name
E: Ship Date
F: Invoice Total
G: Invoice Status
H: Line Item Index
I: Item Description
J: Quantity Shipped
K: Unit Price
L: Line Item Total
M: Item Status
N: Last Updated
```

This is the **bare minimum** to track line items effectively.

---

## 📌 HOW DATA WILL BE POPULATED

### Example: PO "MA25-MVILLE ACE" with 3 invoices, 5 items each

```
Row 1:   A                  | B       | C          | ... | H  | I              | J  | K  | L     | M        | N
Header:  PO Number          | SI Doc  | Date       | ... | IDX| Description    | Qty| Pr | Total | Status   | Updated
Row 2:   MA25-MVILLE ACE    | 12345   | 2025-01-15 | ... | 1  | Jersey Red M   | 10 | 25 | 250   | Active   | 2025-01-15
Row 3:   MA25-MVILLE ACE    | 12345   | 2025-01-15 | ... | 2  | Jersey Red L   | 15 | 25 | 375   | Active   | 2025-01-15
Row 4:   MA25-MVILLE ACE    | 12345   | 2025-01-15 | ... | 3  | Jersey Red XL  | 10 | 25 | 250   | Active   | 2025-01-15
Row 5:   MA25-MVILLE ACE    | 12345   | 2025-01-15 | ... | 4  | Shorts Blue M  | 20 | 15 | 300   | Active   | 2025-01-15
Row 6:   MA25-MVILLE ACE    | 12345   | 2025-01-15 | ... | 5  | Shorts Blue L  | 15 | 15 | 225   | Active   | 2025-01-15
Row 7:   MA25-MVILLE ACE    | 12346   | 2025-01-16 | ... | 1  | Jersey Red M   | 8  | 25 | 200   | Active   | 2025-01-16
Row 8:   MA25-MVILLE ACE    | 12346   | 2025-01-16 | ... | 2  | Jersey Red L   | 12 | 25 | 300   | Active   | 2025-01-16
... and so on
```

---

## 🔧 IMPLEMENTATION PLAN

### Phase 1: **Create Headers** (YOU DO THIS)
1. Open Google Sheet
2. Add column headers in Row 1
3. Confirm headers are set

### Phase 2: **Auto-Save Data** (I'LL CODE THIS)
When user searches for a PO:
- Fetch all invoices from Sports Inc
- Expand each invoice's line items
- Save each line item as a row in Google Sheet
- Include all relevant data from above columns

### Phase 3: **Edit & Sync** (I'LL CODE THIS)
- User marks item as "Complete" → Updates Column M in Google Sheet
- When fetching PO again → Read from Google Sheet (cached data)
- Button to "Refresh from Sports Inc" → Updates all rows for that PO

---

## ✅ NEXT STEP: CONFIRM

**Tell me:**
1. Do you want ALL 50+ columns, or just the REQUIRED 14 columns?
2. Should I add any custom columns?
3. Ready to create the headers in Google Sheet?

Once you confirm, I'll:
- Code the function to auto-save invoices + line items
- Add the update/sync functionality
- Connect it to the portal
