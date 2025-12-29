# 📊 GOOGLE SHEET SETUP - QUICK REFERENCE

## Copy-Paste These Headers Into Row 1

Just copy the text below and paste into Row 1 of your Google Sheet:

```
PO Number	SI Doc Number	SI Doc Date	Supplier Doc Number	Supplier Doc Date	Supplier Name	Ship Date	Requested Ship Date	Invoice Status	Merchandise Total	Freight Amount	Discount Amount	Sales Tax	Excise Tax	SI Upcharge	Service/Handling Charge	Invoice Total	Tracking Number	Method of Payment	Freight Allowance	Ship To Name	Ship To Address	Ship To Address 2	Ship To City	Ship To State	Ship To Zip	Supplier Address	Supplier Address 2	Supplier City	Supplier State	Supplier Zip	Supplier Phone	Supplier Fax	Line Item Index	Item Description	Supplier Item Number	UPC	Size	Color	Quantity Ordered	Quantity Shipped	Unit Price	Net Price	List Price	Line Item Total	Item Status	Last Updated	Notes
```

---

## OR Use This MINIMAL Setup (14 Columns)

For a simpler start, use only these columns:

```
PO Number	SI Doc Number	SI Doc Date	Supplier Name	Ship Date	Invoice Total	Invoice Status	Line Item Index	Item Description	Quantity Shipped	Unit Price	Line Item Total	Item Status	Last Updated
```

---

## 📍 Column Positions (A, B, C, etc.)

### FULL VERSION (50 columns: A to AS)
| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| PO Number | SI Doc # | SI Doc Date | Supplier Doc # | Supplier Doc Date | Supplier | Ship Date | Req Ship Date | Invoice Status | Merch Total |

| K | L | M | N | O | P | Q | R | S | T |
|---|---|---|---|---|---|---|---|---|---|
| Freight | Discount | Sales Tax | Excise Tax | SI Upcharge | Service Charge | Invoice Total | Tracking # | Payment Method | Freight Allow |

| U | V | W | X | Y | Z | AA | AB | AC | AD |
|---|---|---|---|---|---|---|---|---|---|
| Ship Name | Ship Addr 1 | Ship Addr 2 | Ship City | Ship State | Ship Zip | Supplier Addr 1 | Supplier Addr 2 | Supplier City | Supplier State |

| AE | AF | AG | AH | AI | AJ | AK | AL | AM | AN |
|---|---|---|---|---|---|---|---|---|---|
| Supplier Zip | Phone | Fax | Item # | Description | SKU | UPC | Size | Color | Qty Ordered |

| AO | AP | AQ | AR | AS | AT | AU | AV |
|---|---|---|---|---|---|---|---|
| Qty Shipped | Unit Price | Net Price | List Price | Total | Item Status | Last Updated | Notes |

### MINIMAL VERSION (14 columns: A to N)
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| PO Number | SI Doc # | SI Doc Date | Supplier | Ship Date | Invoice Total | Invoice Status | Item # |

| I | J | K | L | M | N |
|---|---|---|---|---|---|
| Description | Qty Shipped | Unit Price | Total | Item Status | Last Updated |

---

## 🚀 ACTION ITEMS

### For You:
- [ ] Decide: FULL (50 cols) or MINIMAL (14 cols)?
- [ ] Create headers in Google Sheet Row 1
- [ ] Confirm headers are created

### For Me (Once You Confirm):
- [ ] Build auto-save function for invoices + line items
- [ ] Build status update function (mark items complete)
- [ ] Connect to portal
- [ ] Test data flow

---

## 💾 Example Data Format

When a PO has 3 invoices with 5 items each, Google Sheet will look like:

| PO Number | SI Doc # | Item # | Description | Qty | Price | Total | Status |
|-----------|----------|--------|-------------|-----|-------|-------|--------|
| MA25-ABC | 12345 | 1 | Red Jersey M | 10 | $25 | $250 | Active |
| MA25-ABC | 12345 | 2 | Red Jersey L | 15 | $25 | $375 | Active |
| MA25-ABC | 12345 | 3 | Blue Shorts M | 20 | $15 | $300 | Complete |
| MA25-ABC | 12346 | 1 | Socks White | 50 | $5 | $250 | Active |
| MA25-ABC | 12346 | 2 | Socks Black | 40 | $5 | $200 | Active |
... and so on

---

## ❓ Questions?

- **Q: What's the difference between "Full" and "Minimal"?**  
  A: Full has all invoice details. Minimal has only what's needed to track items.

- **Q: Can I add columns later?**  
  A: Yes! Easy to add more columns anytime.

- **Q: What format for Item Status?**  
  A: Active, Complete, Pending, or Hold (you decide)

---

**Next: Reply with which columns you want (FULL or MINIMAL) and I'll build the code!**
