# Sports Plus Deal Search - Complete Architecture & Setup

## 📋 Project Overview

A comprehensive web application that integrates:
1. **HubSpot CRM** - Deal management and line items
2. **Sports Inc Tool** - EDI Invoice data
3. **Google Sheets** - Invoice data caching layer

**Purpose:** Search by Sales Order Number and display both HubSpot deal data and Sports Inc invoice data side-by-side with caching optimization.

---

## 🏗️ Architecture

### **Tech Stack**

#### Frontend
- **HTML5** - Structure
- **CSS3** - Styling (Flexbox/Grid)
- **Vanilla JavaScript (ES6+)** - UI logic
- **Fetch API** - HTTP requests

#### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Axios** - HTTP client for external APIs
- **dotenv** - Environment variable management

#### External Integrations
- **HubSpot CRM API v3** - Deal and line item data
- **Sports Inc API** - EDI Invoice data
- **Google Sheets API** - Data caching layer

#### Hosting
- **Netlify** - Frontend hosting
- **Netlify Serverless Functions** - Backend API endpoints

---

## 🔄 Data Flow Architecture

### **Search Process:**

```
User enters Sales Order Number
         ↓
    Frontend (index.html)
         ↓
    ┌─────────────────────────┐
    │   Express Backend       │
    │   (Serverless Function) │
    └─────────────────────────┘
         ↓
    ┌────────┴────────┐
    ↓                 ↓
HubSpot API     Sports Inc Flow
    ↓                 ↓
Returns Deal    1. Check Google Sheet Cache
Data + Line         ↓
Items           Found? → Return from Sheet
                    ↓
                Not Found? → Fetch from Sports Inc API
                    ↓
                Save to Google Sheet
                    ↓
                Return Invoice Data
         ↓
    ┌────────┴────────┐
    ↓                 ↓
Display on       Display on
Left Side        Right Side
(Invoice)        (HubSpot Editable)
```

---

## 📊 Data Structure

### **Search Query**
```javascript
{
  "salesOrderNumber": "SO-12345",  // Also used as PO Number
}
```

### **HubSpot Response**
```javascript
{
  "deal": {
    "id": "123456",
    "properties": {
      "dealname": "Deal Name",
      "amount": 5000,
      "sales_order_": "SO-12345",
      // ... all other properties
    }
  },
  "lineItems": [
    {
      "id": "789",
      "properties": {
        "name": "Item Name",
        "quantity": 10,
        "price": 50
      }
    }
  ]
}
```

### **Sports Inc Invoice Response**
```javascript
{
  "invoice": {
    "poNumber": "SO-12345",
    "invoiceNumber": "INV-001",
    "customer": "Customer Name",
    "ediData": {
      // All EDI fields from the tool
    }
  }
}
```

### **Google Sheet Structure**
```
| PO Number | Invoice Number | Customer | Field1 | Field2 | ... | Last Updated |
|-----------|----------------|----------|--------|--------|-----|--------------|
| SO-12345  | INV-001        | Acme Inc | Value1 | Value2 | ... | 2025-12-17   |
```

---

## 🔌 API Endpoints

### **Backend Express Routes**

#### 1. Search Endpoint
```
POST /api/search
Body: { "salesOrderNumber": "SO-12345" }

Response:
{
  "hubspot": { deal, lineItems },
  "invoice": { invoice data from Sheet or Sports Inc }
}
```

#### 2. HubSpot Update Endpoint
```
POST /api/hubspot/update
Body: {
  "dealId": "123",
  "propertyName": "decoration_type",
  "propertyValue": "Embroidery"
}
```

#### 3. Sports Inc Fetch Endpoint
```
POST /api/sportsinc/fetch
Body: { "poNumber": "SO-12345" }

Response: { invoice data }
```

#### 4. Google Sheets Cache Endpoint
```
GET /api/cache/:poNumber
POST /api/cache
Body: { invoice data to cache }
```

---

## 🔐 Authentication & Security

### **Environment Variables**
```env
# HubSpot
HUBSPOT_ACCESS_TOKEN=pat-na1-xxxxx

# Sports Inc
SPORTSINC_API_KEY=ryDLH84WROG3uawnkBhlB0bj3wdYKix5lBl1ArgbmvvJrRwtkF2gNvyS9rNesa8e4aSpvO9ctfvwyesIS1saeyQ9Tpg0zHCQCvnu

# Google Sheets
GOOGLE_SHEETS_ID=1H7AT9aFP8Z4izzHmZ0f-tOkXpPYC4tdgyWUQQE_jfNk
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```

### **Security Best Practices**
- ✅ All API keys stored in environment variables
- ✅ Never exposed to frontend
- ✅ CORS configured properly
- ✅ Input validation on all endpoints
- ✅ Rate limiting on API calls
- ✅ Error handling without exposing sensitive data

---

## 🎨 Frontend Layout

### **Two-Column Design**

```
┌─────────────────────────────────────────────────────────┐
│                    Header (Sports Plus)                  │
├──────────────────────┬──────────────────────────────────┤
│                      │                                   │
│  LEFT COLUMN         │    RIGHT COLUMN                  │
│  (50% width)         │    (50% width)                   │
│                      │                                   │
│  📄 Invoice Data     │    🔧 HubSpot Editable Fields   │
│  from Sports Inc     │                                   │
│                      │    - Decoration Type             │
│  - PO Number         │    - Deal Stage                  │
│  - Invoice Number    │    - Custom Fields               │
│  - Customer          │    [Save buttons]                │
│  - EDI Fields        │                                   │
│  - All tool data     │                                   │
│                      │                                   │
│  [From Google Sheet  │    📊 Deal Properties           │
│   or Sports Inc API] │    - Amount                      │
│                      │    - Close Date                  │
│                      │    - Pipeline                    │
│                      │                                   │
│                      │    📦 Line Items                 │
│                      │    - Item 1                      │
│                      │    - Item 2                      │
│                      │                                   │
└──────────────────────┴──────────────────────────────────┘
```

---

## 🚀 Implementation Steps

### **Phase 1: Backend Setup**
1. ✅ Convert to Express.js server
2. ✅ Set up Sports Inc API integration
3. ✅ Implement Google Sheets API integration
4. ✅ Create caching logic
5. ✅ Test all API endpoints

### **Phase 2: Frontend Update**
1. ✅ Create two-column layout
2. ✅ Left: Invoice data display
3. ✅ Right: HubSpot editable fields
4. ✅ Update search flow to fetch both sources

### **Phase 3: Optimization**
1. ✅ Implement Google Sheets caching
2. ✅ Add loading states
3. ✅ Error handling
4. ✅ Performance optimization

### **Phase 4: Deployment**
1. ✅ Deploy to Netlify
2. ✅ Configure all environment variables
3. ✅ Test production environment
4. ✅ Monitor and optimize

---

## 📝 Development Workflow

### **Local Development**
```bash
# Install dependencies
npm install

# Set up .env file
# Add all API keys

# Run development server
npm run dev

# Server runs at http://localhost:8888
```

### **Testing**
```bash
# Test HubSpot integration
curl -X POST http://localhost:8888/api/search \
  -H "Content-Type: application/json" \
  -d '{"salesOrderNumber":"SO-12345"}'

# Test Sports Inc integration
curl -X POST http://localhost:8888/api/sportsinc/fetch \
  -H "Content-Type: application/json" \
  -d '{"poNumber":"SO-12345"}'

# Test Google Sheets cache
curl http://localhost:8888/api/cache/SO-12345
```

---

## 🔧 Technology Decisions

### **Why Express.js Backend?**
- ✅ More control over routing
- ✅ Easier to manage multiple API integrations
- ✅ Better for complex business logic
- ✅ Middleware support for auth, logging, etc.

### **Why Google Sheets as Cache?**
- ✅ Easy to view/edit data manually
- ✅ No database setup required
- ✅ Client can access data directly
- ✅ Simple API integration
- ✅ Automatic backup

### **Why Two-Column Layout?**
- ✅ Compare data side-by-side
- ✅ Clear separation of data sources
- ✅ Better user experience
- ✅ Easy to scan both datasets

---

## 📚 API Documentation

### **Sports Inc API**
- **Base URL:** `https://swv3.sportsinc.com/api` (to be confirmed)
- **Authentication:** API Key in header
- **Endpoints:** (To be documented based on API docs)

### **Google Sheets API**
- **API Version:** v4
- **Scopes:** `https://www.googleapis.com/auth/spreadsheets`
- **Authentication:** Service Account

### **HubSpot API**
- **API Version:** v3
- **Base URL:** `https://api.hubapi.com`
- **Authentication:** Bearer token

---

## 🎯 Success Metrics

- ✅ Search response time < 2 seconds
- ✅ 90%+ cache hit rate (Google Sheets)
- ✅ Zero exposed API keys
- ✅ Mobile responsive design
- ✅ Error rate < 1%

---

## 📞 Support & Maintenance

### **Monitoring**
- Server logs for all API calls
- Error tracking and reporting
- Performance monitoring

### **Backup**
- Google Sheets = automatic backup
- Regular exports recommended
- Environment variables documented

---

**Last Updated:** December 2025
**Version:** 2.0.0
**Status:** Planning Phase
