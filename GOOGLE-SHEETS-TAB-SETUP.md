# 🎯 GOOGLE SHEET - TAB NAME & LOCATION

## ✅ WHERE TO CREATE THE COLUMNS

### Spreadsheet Name:
```
Sportsplus Invoice data
```

### Tab Name:
```
Sheet1
```

### Spreadsheet Link:
```
https://docs.google.com/spreadsheets/d/1H7AT9aFP8Z4izzHmZ0f-tOkXpPYC4tdgyWUQQE_jfNk
```

---

## 📋 STEP-BY-STEP SETUP

### Step 1: Open Google Sheet
Click here: [Open Google Sheet](https://docs.google.com/spreadsheets/d/1H7AT9aFP8Z4izzHmZ0f-tOkXpPYC4tdgyWUQQE_jfNk)

### Step 2: Select Tab
Click on the **"Sheet1"** tab at the bottom of the screen

### Step 3: Click Cell A1
Click on the first cell (A1)

### Step 4: Add Headers
Choose ONE option:

#### Option A: FULL VERSION (All 50 columns)
Copy this entire line:
```
PO Number	SI Doc Number	SI Doc Date	Supplier Doc Number	Supplier Doc Date	Supplier Name	Ship Date	Requested Ship Date	Invoice Status	Merchandise Total	Freight Amount	Discount Amount	Sales Tax	Excise Tax	SI Upcharge	Service/Handling Charge	Invoice Total	Tracking Number	Method of Payment	Freight Allowance	Ship To Name	Ship To Address	Ship To Address 2	Ship To City	Ship To State	Ship To Zip	Supplier Address	Supplier Address 2	Supplier City	Supplier State	Supplier Zip	Supplier Phone	Supplier Fax	Line Item Index	Item Description	Supplier Item Number	UPC	Size	Color	Quantity Ordered	Quantity Shipped	Unit Price	Net Price	List Price	Line Item Total	Item Status	Last Updated	Notes
```

Then:
- Paste into A1
- Press Enter

#### Option B: MINIMAL VERSION (14 columns)
Copy this entire line:
```
PO Number	SI Doc Number	SI Doc Date	Supplier Name	Ship Date	Invoice Total	Invoice Status	Line Item Index	Item Description	Quantity Shipped	Unit Price	Line Item Total	Item Status	Last Updated
```

Then:
- Paste into A1
- Press Enter

### Step 5: Save
Press `Ctrl+S` (or `Cmd+S` on Mac)

### Step 6: Confirm
Headers should now appear in Row 1

---

## 🗂️ WHAT I'LL USE TO MAP DATA

### Exact Tab Name in Code:
```javascript
const SHEET_NAME = 'Sheet1';
```

### Column A (Primary Key):
```
PO Number
```

### Data Mapping:
I'll automatically map all Sports Inc invoice data to the corresponding columns based on the headers you create.

---

## ✅ VERIFICATION

Once you've added the headers, reply with:

```
✅ FULL VERSION - I've added all 50 columns
```

OR

```
✅ MINIMAL VERSION - I've added 14 columns
```

Then I'll:
1. Build the auto-save function
2. Test it with sample data
3. Deploy it to your server

---

## 📞 NEED HELP?

If you run into issues:
- Check that you're in **Sheet1** (tab at bottom)
- Check that headers are in **Row 1**
- Check that data starts in **Row 2**

---

**Ready? Create the headers in Google Sheet and let me know which version you chose!** 🚀
