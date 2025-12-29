# Google Sheets API Setup Guide

## 📋 Step-by-Step Instructions

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: "Sports Plus Deal Search"
4. Click "Create"

### 2. Enable Google Sheets API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it and click "Enable"

### 3. Create Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Service account name: "sports-plus-sheets"
4. Click "Create and Continue"
5. Role: Select "Editor"
6. Click "Continue" → "Done"

### 4. Create Service Account Key

1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON"
5. Click "Create"
6. **SAVE THIS FILE** - it will be downloaded as `sports-plus-sheets-xxxxx.json`

### 5. Share Google Sheet with Service Account

1. Open the JSON file you downloaded
2. Find the `client_email` field (looks like: `sports-plus-sheets@project-id.iam.gserviceaccount.com`)
3. Copy this email
4. Go to your Google Sheet: https://docs.google.com/spreadsheets/d/1H7AT9aFP8Z4izzHmZ0f-tOkXpPYC4tdgyWUQQE_jfNk/edit
5. Click "Share" button
6. Paste the service account email
7. Give it "Editor" permission
8. **UNCHECK** "Notify people"
9. Click "Share"

### 6. Add Credentials to .env File

Open the downloaded JSON file and extract these values:

```json
{
  "client_email": "sports-plus-sheets@xxxxx.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
}
```

Add to your `.env` file:

```env
# Existing
HUBSPOT_ACCESS_TOKEN=pat-na1-c2a40bed-9946-4dbb-bdf1-573ca85dc1ee

# Sports Inc
SPORTSINC_API_KEY=ryDLH84WROG3uawnkBhlB0bj3wdYKix5lBl1ArgbmvvJrRwtkF2gNvyS9rNesa8e4aSpvO9ctfvwyesIS1saeyQ9Tpg0zHCQCvnuKID2hCXC6c4asiCG4dYf5ZlVj0iZ

# Google Sheets
GOOGLE_SHEETS_ID=1H7AT9aFP8Z4izzHmZ0f-tOkXpPYC4tdgyWUQQE_jfNk
GOOGLE_SERVICE_ACCOUNT_EMAIL=sports-plus-sheets@xxxxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**IMPORTANT:**
- Keep the quotes around `GOOGLE_PRIVATE_KEY`
- Keep the `\n` characters - they are important!
- Replace `YOUR_PRIVATE_KEY_HERE` with your actual private key

### 7. Verify Setup

The Google Sheet should have this structure:

**Sheet Name:** "Invoice Data" (or "Sheet1")

**Headers (Row 1):**
```
PO Number | Invoice Number | Customer Name | [Other Invoice Fields...] | Last Updated
```

### 8. Test Connection

Once you've added the credentials to `.env`, we'll test the connection with the server.

---

## ✅ Checklist

- [ ] Google Cloud Project created
- [ ] Google Sheets API enabled
- [ ] Service Account created
- [ ] Service Account Key (JSON) downloaded
- [ ] Google Sheet shared with service account email
- [ ] Credentials added to `.env` file
- [ ] Google Sheet has proper headers

---

## 🔒 Security Notes

- **NEVER commit the JSON key file to Git**
- **NEVER commit .env file to Git**
- The JSON file contains sensitive credentials
- Keep it safe and secure

---

**Once you complete these steps, let me know and we'll test the Google Sheets integration!**
