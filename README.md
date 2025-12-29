# Sports Plus Deal Search Portal

A comprehensive web application that combines invoice data from Sports Inc Tool API with HubSpot CRM deal information, featuring Google Sheets as a caching layer for optimized performance.

## Features

✅ **Two-Column Layout** - Side-by-side view of Invoice Data (left) and HubSpot Deals (right)
✅ **Unified Search** - Single search query fetches data from multiple sources simultaneously
✅ **Smart Caching** - Google Sheets stores invoice data to minimize API calls
✅ **Real-time Data** - Seamlessly integrates with HubSpot CRM and Sports Inc Tool
✅ **Line Items Display** - Expandable view of deal line items from HubSpot
✅ **Responsive Design** - Mobile-friendly interface with modern UI
✅ **Cache Indicators** - Shows whether data came from cache or fresh API call  

## Architecture

### Tech Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express.js
- **APIs**:
  - HubSpot CRM API v3
  - Sports Inc Tool API
  - Google Sheets API v4
- **Caching**: Google Sheets (via Service Account)

### Data Flow
```
User Search → Express Backend → [Google Sheets Cache + Sports Inc API] + HubSpot API
                                          ↓
                                  Two-Column Display
```

## Project Structure

```
Sports Plus Deal Search/
├── public/
│   └── index.html          # Frontend application
├── services/
│   ├── googleSheets.js     # Google Sheets integration
│   └── sportsInc.js        # Sports Inc API integration
├── functions/              # Netlify serverless functions (legacy)
│   ├── searchDeals.js
│   ├── getLineItems.js
│   └── updateDeal.js
├── server.js               # Express backend server
├── .env                    # Environment variables (not in git)
├── .env.example            # Example environment file
├── package.json            # Dependencies
└── README.md               # This file
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- HubSpot Private App Access Token
- Sports Inc Tool API Key
- Google Cloud Service Account (for Google Sheets)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```env
# HubSpot API
HUBSPOT_ACCESS_TOKEN=pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Sports Inc API
SPORTSINC_API_KEY=your_sportsinc_api_key_here

# Google Sheets
GOOGLE_SHEETS_ID=your_google_sheets_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### 3. Set Up Google Sheets

Follow the detailed instructions in [GOOGLE-SHEETS-SETUP.md](./GOOGLE-SHEETS-SETUP.md) to:
- Create Google Cloud Project
- Enable Google Sheets API
- Create Service Account
- Share your Google Sheet with the service account

### 4. Run the Server

```bash
npm start
```

or for development:

```bash
npm run dev
```

The server will start at `http://localhost:8888`

### 3. Deploy to Netlify

#### Option A: Using Git (Recommended)

1. **Initialize Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub** (or your preferred Git provider)
   - Create a new repository on GitHub
   - Push your code: `git push -u origin main`

3. **Connect to Netlify**
   - Go to [Netlify](https://app.netlify.com)
   - Click "New site from Git"
   - Select your repository
   - Set build command: `npm install`
   - Set publish directory: `public`
   - Add environment variable: `HUBSPOT_ACCESS_TOKEN` with your token

4. **Deploy** - Netlify will automatically deploy when you push changes

#### Option B: Manual Deployment (Drag & Drop)

```bash
# Build the project
npm install

# Zip the entire project folder
```

- Go to [Netlify](https://app.netlify.com)
- Drag and drop the project folder
- Add environment variables in Netlify dashboard

#### Option C: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy

# Deploy to production
netlify deploy --prod
```

## Environment Variables

Create a `.env` file in the root directory:

```
HUBSPOT_ACCESS_TOKEN=pat-na1-xxxxxxxxxxxxx
```

**⚠️ Security Note:** Never commit `.env` files to version control. The `.gitignore` file prevents this.

## API Endpoints

The application uses two serverless functions:

### POST /.netlify/functions/searchDeals
Search for deals by Sales Order Number

**Request:**
```json
{
  "query": "SO-12345"
}
```

**Response:**
```json
{
  "deals": [
    {
      "id": "deal-id",
      "properties": {
        "dealname": "Deal Name",
        "amount": 5000,
        "closedate": "2025-12-31",
        "pipeline": "default",
        "dealstage": "negotiation",
        "sales_order_": "SO-12345"
      }
    }
  ]
}
```

### POST /.netlify/functions/getLineItems
Get line items for a specific deal

**Request:**
```json
{
  "dealId": "deal-123456"
}
```

**Response:**
```json
{
  "lineItems": [
    {
      "id": "item-1",
      "properties": {
        "name": "Item Name",
        "quantity": 10,
        "price": 50,
        "amount": 500,
        "description": "Item description"
      }
    }
  ]
}
```

## Customization

### Update Company Information

Edit `public/index.html` footer section (lines 430-450):
- Company name and description
- Contact information
- Quick links

### Change Color Scheme

Edit the CSS variables in `public/index.html` (around line 29):
- Primary color: `#ff6b35` (orange)
- Dark color: `#2d3e50` (dark blue)

### Modify HubSpot Properties

Edit `functions/searchDeals.js` to change which properties are fetched:
```javascript
properties: ['dealname', 'amount', 'closedate', 'pipeline', 'dealstage', 'sales_order_']
```

## Troubleshooting

### "CORS Error" Message
- Ensure serverless functions are properly deployed
- Check that `.netlify/functions/` folder exists in production

### "HubSpot API token not configured"
- Verify `.env` file contains `HUBSPOT_ACCESS_TOKEN`
- Check Netlify environment variables match `.env`
- Restart the development server after updating `.env`

### No Results Found
- Verify the Sales Order Number format matches HubSpot
- Check HubSpot property name: `sales_order_`
- Test the token by checking HubSpot API documentation

## Security Best Practices

✅ API token stored in environment variables  
✅ No sensitive data in frontend code  
✅ All HubSpot calls go through serverless backend  
✅ CORS properly configured  
✅ `.env` file never committed to version control  

## Performance Optimization

- **Search Debouncing:** 500ms delay to avoid excessive API calls
- **Lazy Loading:** Line items load after deals are displayed
- **Responsive Grid:** Auto-adjusts cards based on screen size
- **Caching:** Browser caches results during session

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review HubSpot API documentation
3. Contact Sports Plus support: 703-222-8255

---

**Version:** 1.0.0  
**Last Updated:** December 2025  
**Deployment Platform:** Netlify
