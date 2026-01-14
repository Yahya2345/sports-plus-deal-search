# 🌐 Sports Plus Portal - Deployment Status

## ✅ Portal is LIVE and WORKING

**URL:** http://72.62.243.230

---

## ✅ Confirmed Working Features

### 1. **Search Functionality**
- ✅ Search by PO Number
- ✅ Fetches data from Sports Inc API
- ✅ Displays all invoices with line items
- ✅ Shows historical and active invoices

### 2. **Update Functionality** 
- ✅ Edit Inspector name
- ✅ Edit Inspection Status (Complete/Incomplete/Defective)
- ✅ Edit Inspection Notes
- ✅ Edit Dates (Actual Shipping Date, etc.)
- ✅ Save updates to Google Sheets
- ✅ Bulk update multiple line items at once

### 3. **Email Notifications**
- ✅ Automatically sends when status = Incomplete or Defective
- ✅ Includes inspection details and tracking info
- ✅ Sends to base recipients + PO-specific emails based on initials
- ✅ Recipients: zaeemshahzad95@gmail.com, ken@sportsplusteam.com

### 4. **Google Sheets Integration**
- ✅ Caches invoice data
- ✅ Updates line items in real-time
- ✅ Preserves editable fields during updates
- ✅ Tracks completion status

---

## 🔧 How to Use the Portal

### Step 1: Open Portal
1. Go to: http://72.62.243.230
2. **IMPORTANT:** Press **Ctrl+Shift+R** to hard refresh (clears cache)

### Step 2: Search for PO
1. Enter PO number in search box (e.g., `JG25-252`)
2. Portal will fetch and display all invoices

### Step 3: Edit Data
1. Click on any editable field:
   - Inspector
   - Inspection Status
   - Inspection Notes
   - Actual Shipping Date
2. Make your changes

### Step 4: Save Changes
1. Click the **"Save All Changes"** button
2. Wait for confirmation message
3. Data is automatically saved to Google Sheets
4. Emails sent if status changed to Incomplete/Defective

---

## 📊 Available API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search` | Search invoices by PO number |
| POST | `/api/updateLineItemsBulk` | Update line items + send emails |
| GET  | `/api/testEmail` | Test email configuration |
| GET  | `/api/cache/invoices` | Get all cached invoices |
| POST | `/api/cache/refresh` | Refresh cache for PO |

---

## ✉️ Email Notification Details

**When emails are sent:**
- When Inspection Status changes to "Incomplete"
- When Inspection Status changes to "Defective"
- When all line items for a PO are marked complete

**Email recipients:**
- **Base:** zaeemshahzad95@gmail.com, ken@sportsplusteam.com
- **PO-specific:** Based on initials (JG, JT, MC, etc.)

**Email mapping:**
- JG → sportsplus.jim@gmail.com
- JT → jim@sportsplusteam.com
- MC → sportsplus.mac@gmail.com
- And more...

---

## ⚠️ Important Notes

1. **Always clear browser cache** if you see "404" errors
   - Press **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)

2. **All Netlify functions have been removed**
   - Portal now uses direct Express API endpoints
   - HubSpot integration has been removed (not in use)

3. **Data flow:**
   ```
   Sports Inc API → Portal → Google Sheets → Email Notifications
   ```

4. **Container is running on VPS:**
   - Docker container: `sports-plus-api`
   - Port: 3000 (proxied through Nginx on port 80)

---

## 🎯 Testing Checklist

- [x] Search returns invoice data
- [x] Can edit all fields
- [x] Save button works
- [x] Updates appear in Google Sheets
- [x] Email notifications send correctly
- [x] Multiple invoices can be updated at once
- [x] Portal loads without errors

---

## 🚀 Everything is Working!

The portal is fully functional with all the features that were working on Netlify now working on the VPS deployment.

**Contact for support:**
- Email: zaeemshahzad95@gmail.com, ken@sportsplusteam.com
