# 🚀 Deployment Checklist

## Pre-Deployment

- [ ] **HubSpot Token Ready**
  - Token: `pat-na1-c2a40bed-9946-4dbb-bdf1-573ca85dc1ee`
  - Scopes verified: Deals (read), Line Items (read)

- [ ] **Local Testing Complete**
  - ✅ Search works with exact Sales Order Number
  - ✅ All deal properties display
  - ✅ Line items load correctly
  - ✅ Number of Associated Line Items shows

- [ ] **Files Verified**
  ```
  ✅ public/index.html
  ✅ functions/searchDeals.js
  ✅ functions/getLineItems.js
  ✅ functions/updateDeal.js
  ✅ package.json
  ✅ netlify.toml
  ✅ .gitignore
  ```

## Deployment Steps

### Option A: GitHub + Netlify (Recommended)

1. [ ] **Initialize Git**
   ```bash
   git init
   git add .
   git commit -m "Ready for deployment"
   ```

2. [ ] **Create GitHub Repo**
   - Go to GitHub.com
   - Create new repository
   - Copy repository URL

3. [ ] **Push to GitHub**
   ```bash
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```

4. [ ] **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Login/Sign up
   - Click "Add new site" → "Import from Git"
   - Choose GitHub repository

5. [ ] **Set Environment Variable**
   - Site Settings → Environment Variables
   - Add: `HUBSPOT_ACCESS_TOKEN` = `pat-na1-c2a40bed-9946-4dbb-bdf1-573ca85dc1ee`
   - Scope: All environments

6. [ ] **Deploy Site**
   - Click "Deploy site"
   - Wait 1-2 minutes

### Option B: Netlify CLI

1. [ ] **Install CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. [ ] **Login & Deploy**
   ```bash
   netlify login
   netlify init
   netlify env:set HUBSPOT_ACCESS_TOKEN "pat-na1-c2a40bed-9946-4dbb-bdf1-573ca85dc1ee"
   netlify deploy --prod
   ```

## Post-Deployment Verification

- [ ] **Test Live Site**
  - Visit: `https://YOUR-SITE.netlify.app`
  - Search for test deal (e.g., "CP25-010")
  - Verify results display correctly

- [ ] **Check Functions**
  - Netlify Dashboard → Functions tab
  - Verify 3 functions deployed:
    - ✅ searchDeals
    - ✅ getLineItems
    - ✅ updateDeal

- [ ] **Monitor Logs**
  - Check function logs for errors
  - Test multiple searches
  - Verify line items loading

- [ ] **Test All Features**
  - [ ] Exact match search works
  - [ ] Deal properties display
  - [ ] Line items count shows
  - [ ] Line items load
  - [ ] No console errors

## Final Steps

- [ ] **Bookmark URL**
  - Save live URL for easy access

- [ ] **Share with Team**
  - Send URL to team members
  - Provide usage instructions

- [ ] **Optional: Custom Domain**
  - Netlify → Domain settings
  - Add custom domain if needed

## Troubleshooting

If issues occur:
1. Check environment variable is set
2. Review function logs in Netlify dashboard
3. Verify HubSpot token permissions
4. Check browser console for errors
5. Refer to [DEPLOY-TO-NETLIFY.md](DEPLOY-TO-NETLIFY.md)

---

## ✅ Deployment Complete!

Your site is live at: `https://YOUR-SITE.netlify.app`

**Next automatic deployment:** Push any changes to GitHub and Netlify will auto-deploy!
