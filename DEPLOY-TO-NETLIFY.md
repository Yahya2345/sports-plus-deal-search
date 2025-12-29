# Deploy to Netlify - Step by Step Guide

## 📋 Prerequisites

Before deploying, make sure you have:
- ✅ HubSpot API Access Token (`pat-na1-...`)
- ✅ GitHub account (recommended for automatic deployments)
- ✅ Netlify account (free tier works great)

## 🚀 Deployment Steps

### Option 1: Deploy via GitHub (Recommended)

#### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Sports Plus Deal Search"

# Add GitHub remote (create repo on GitHub first)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

#### Step 2: Connect to Netlify

1. Go to [Netlify](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. Authorize Netlify to access your GitHub
5. Select your repository

#### Step 3: Configure Build Settings

Netlify will auto-detect settings from `netlify.toml`, but verify:

- **Build command:** `npm install`
- **Publish directory:** `public`
- **Functions directory:** `functions`

#### Step 4: Add Environment Variable

Before deploying:
1. Click **"Site settings"** → **"Environment variables"**
2. Click **"Add a variable"**
3. Add:
   - **Key:** `HUBSPOT_ACCESS_TOKEN`
   - **Value:** Your HubSpot token (e.g., `pat-na1-c2a40bed-9946-4dbb-bdf1-573ca85dc1ee`)
4. Choose **"All scopes"**
5. Click **"Create variable"**

#### Step 5: Deploy!

1. Click **"Deploy site"**
2. Wait 1-2 minutes for deployment
3. Your site will be live at: `https://YOUR-SITE-NAME.netlify.app`

---

### Option 2: Deploy via Netlify CLI

#### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### Step 2: Login

```bash
netlify login
```

#### Step 3: Initialize Site

```bash
netlify init
```

Follow prompts:
- **Create & configure a new site**
- **Choose your team**
- **Site name:** (choose a unique name)
- **Build command:** `npm install`
- **Directory to deploy:** `public`
- **Functions folder:** `functions`

#### Step 4: Set Environment Variable

```bash
netlify env:set HUBSPOT_ACCESS_TOKEN "pat-na1-your-token-here"
```

#### Step 5: Deploy

```bash
# Deploy to preview
netlify deploy

# Deploy to production
netlify deploy --prod
```

---

### Option 3: Manual Deploy (Drag & Drop)

#### Step 1: Prepare Files

Make sure you have:
- `public/` folder with `index.html`
- `functions/` folder with all `.js` files
- `package.json`
- `netlify.toml`

#### Step 2: Create ZIP (Optional)

```bash
# Zip the project (excluding node_modules and .git)
zip -r deploy.zip . -x "node_modules/*" ".git/*" "test-server.js" ".env"
```

#### Step 3: Upload to Netlify

1. Go to [Netlify](https://app.netlify.com)
2. Drag and drop your project folder (or ZIP file) onto the page
3. Wait for upload to complete

#### Step 4: Add Environment Variable

1. Go to **Site settings** → **Environment variables**
2. Add `HUBSPOT_ACCESS_TOKEN` with your token
3. Click **"Trigger deploy"** to redeploy with the variable

---

## 🔧 Post-Deployment Setup

### 1. Verify Deployment

Visit your Netlify URL and test:
- ✅ Search for a deal by Sales Order Number
- ✅ Verify deal details display
- ✅ Check that line items load
- ✅ Verify all properties show correctly

### 2. Check Function Logs

1. Go to Netlify Dashboard → **Functions** tab
2. Click on each function to see logs
3. Look for any errors

### 3. Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow instructions to configure DNS

---

## 🐛 Troubleshooting

### Issue: Functions return 500 error

**Solution:**
- Check that `HUBSPOT_ACCESS_TOKEN` is set in environment variables
- Verify token has correct scopes:
  - ✅ `crm.objects.deals.read`
  - ✅ `crm.objects.line_items.read`
- Trigger a redeploy after adding environment variables

### Issue: No line items showing

**Solution:**
- Verify your HubSpot token includes line items read scope
- Check that deals have line items associated in HubSpot
- Check function logs for errors

### Issue: Search returns no results

**Solution:**
- Search uses **exact match** on `sales_order_` field
- Make sure the Sales Order Number matches exactly
- Check HubSpot to verify the field name is `sales_order_`

### Issue: CORS errors

**Solution:**
- Make sure functions are deployed (check Functions tab)
- Functions should be at: `/.netlify/functions/searchDeals`, etc.
- Clear browser cache and try again

---

## 📝 Files Required for Deployment

```
project-root/
├── public/
│   └── index.html              # Frontend application
├── functions/
│   ├── searchDeals.js          # Search deals function
│   ├── getLineItems.js         # Get line items function
│   └── updateDeal.js           # Update deal function (if needed)
├── package.json                # Dependencies
├── netlify.toml                # Netlify configuration
└── .gitignore                  # Git ignore file
```

**DO NOT deploy:**
- ❌ `.env` file (contains secrets)
- ❌ `node_modules/` (rebuilt during deployment)
- ❌ `test-server.js` (only for local testing)

---

## 🎉 Success!

Your Sports Plus Deal Search is now live on Netlify!

**Your URL:** `https://YOUR-SITE-NAME.netlify.app`

### Next Steps:
1. Share the URL with your team
2. Bookmark for easy access
3. Set up custom domain (optional)
4. Monitor usage in Netlify Dashboard

---

## 📞 Support

If you encounter issues:
1. Check Netlify function logs
2. Review this guide's troubleshooting section
3. Check HubSpot API status
4. Contact Netlify support if needed

---

**Last Updated:** December 2025
