# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Netlify-hosted web application that provides a search interface for Sports Plus deals stored in HubSpot CRM. The app allows users to search by Sales Order Number and view associated line items. The frontend is a single-page vanilla JavaScript application, and the backend uses Netlify serverless functions to securely proxy HubSpot API requests.

## Development Commands

### Local Development
```bash
npm install              # Install dependencies (axios for serverless functions)
npm run dev              # Start Netlify Dev server at http://localhost:8888
```

### Deployment
```bash
netlify deploy           # Deploy to preview URL
netlify deploy --prod    # Deploy to production
```

**Note:** The build command (`npm run build`) is a no-op. There's no build process - the app serves static HTML directly.

## Architecture

### Application Flow
1. **Frontend** (`public/index.html`): Single HTML file containing all UI, CSS, and JavaScript
2. **User searches** by Sales Order Number (debounced 500ms)
3. **Serverless function** `searchDeals` queries HubSpot CRM for deals matching the search
4. **Results displayed** with option to expand each deal
5. **On expand**, `getLineItems` function fetches associated line items for that deal
6. **Line items rendered** in an expandable table within the deal card

### Key Components

#### Serverless Functions (`functions/`)
Both functions follow the same pattern:
- Handle CORS preflight (OPTIONS) requests
- Parse request body for parameters
- Call HubSpot API v3 with Bearer token authentication
- Return formatted JSON responses

**`searchDeals.js`**:
- Searches deals using `CONTAINS_TOKEN` operator on `sales_order_` property
- Returns up to 100 deals with properties: `dealname`, `amount`, `closedate`, `pipeline`, `dealstage`, `sales_order_`
- Endpoint: `POST /.netlify/functions/searchDeals`
- Body: `{ "query": "SO-12345" }`

**`getLineItems.js`**:
- First fetches deal associations to get line item IDs
- Then batch-fetches line item details
- Returns properties: `name`, `quantity`, `price`, `amount`, `description`
- Endpoint: `POST /.netlify/functions/getLineItems`
- Body: `{ "dealId": "123456789" }`

#### Frontend (`public/index.html`)
Single-page application structure:
- **Lines 1-40**: CSS styling with CSS Grid layout and animations
- **Lines 41-120**: HTML structure (header, search bar, results container, footer)
- **Lines 121-450**: Embedded JavaScript for search logic and API calls
  - Debounced search implementation
  - Dynamic DOM manipulation for results
  - Fetch-based API calls to serverless functions
  - Error handling and loading states

### HubSpot Integration

**Critical Property Names:**
- Deal property: `sales_order_` (note the underscore suffix)
- Search operator: `CONTAINS_TOKEN` (not exact match)
- API version: HubSpot CRM API v3

**Authentication:**
- Uses HubSpot Private App access token
- Token stored in `HUBSPOT_ACCESS_TOKEN` environment variable
- Token format: `pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Environment Configuration

**Required Environment Variable:**
```
HUBSPOT_ACCESS_TOKEN=pat-na1-xxxxxxxxxxxxx
```

**Setup locations:**
- **Local development**: `.env` file in project root
- **Netlify production**: Site Settings > Build & Deploy > Environment variables

The `.env` file is git-ignored for security.

## Modifying HubSpot Properties

### Adding Deal Properties
Edit `functions/searchDeals.js:54`:
```javascript
properties: ['dealname', 'amount', 'closedate', 'pipeline', 'dealstage', 'sales_order_', 'new_property']
```

### Adding Line Item Properties
Edit `functions/getLineItems.js:68`:
```javascript
properties: ['name', 'quantity', 'price', 'amount', 'description', 'new_property']
```

### Changing Search Property
To search by a different field, modify `functions/searchDeals.js:49`:
```javascript
propertyName: 'different_property_name',
```

## Common Development Scenarios

### Testing Serverless Functions Locally
Netlify Dev automatically runs functions at `/.netlify/functions/[function-name]`. Test with:
```bash
curl -X POST http://localhost:8888/.netlify/functions/searchDeals \
  -H "Content-Type: application/json" \
  -d '{"query":"SO-12345"}'
```

### Debugging HubSpot API Issues
- Check Netlify function logs in the Netlify dashboard under "Functions" tab
- Verify token permissions include read access for Deals and Line Items
- Test token directly: `curl -H "Authorization: Bearer YOUR_TOKEN" https://api.hubapi.com/crm/v3/objects/deals`

### Customizing UI
The frontend is entirely in `public/index.html`:
- **CSS variables** (line ~29): Change colors, spacing
- **Search debounce delay** (line ~350): Modify timeout value
- **Company info** (footer section): Update branding

## Deployment Notes

- **Platform**: Netlify (configured via `netlify.toml`)
- **Publish directory**: `public/`
- **Functions directory**: `functions/`
- **Redirects**: SPA-style redirect from `/*` to `/index.html` (status 200)
- **No build step required**: Static HTML is served directly

### Post-Deployment Verification
1. Check that both serverless functions are deployed in Netlify Functions tab
2. Verify environment variable is set in Netlify dashboard
3. Test search functionality with known Sales Order Number
4. Check browser console and Netlify function logs for errors
