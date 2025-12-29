# Deployment Checklist

## Pre-Deployment ✓

- [ ] HubSpot API token obtained
- [ ] `.env` file created with `HUBSPOT_ACCESS_TOKEN`
- [ ] Local testing completed (`npm run dev`)
- [ ] All files committed to Git

## Deployment Steps

### 1. Prepare Repository
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Connect to Netlify
- [ ] Sign up/Login to [Netlify](https://app.netlify.com)
- [ ] Click "New site from Git"
- [ ] Select your repository
- [ ] Configure build settings:
  - Build command: `npm install`
  - Publish directory: `public`
  - Functions directory: `functions`

### 3. Configure Environment
- [ ] Go to Site Settings > Build & Deploy > Environment
- [ ] Add variable: `HUBSPOT_ACCESS_TOKEN` = your_token
- [ ] Trigger redeploy

### 4. Verify Deployment
- [ ] Site loads without errors
- [ ] Search functionality works
- [ ] Line items display correctly
- [ ] Responsive design on mobile

## Post-Deployment

- [ ] Test all search scenarios
- [ ] Verify API calls in browser DevTools
- [ ] Check error handling
- [ ] Monitor Netlify logs for issues
- [ ] Set up custom domain (if applicable)

## Monitoring

- Netlify dashboard for deploy status
- Browser console for JavaScript errors
- Netlify function logs for backend errors

## Rollback (if needed)

If issues occur after deployment:
1. Go to Netlify dashboard
2. Click "Deploys"
3. Find previous successful deploy
4. Click three dots > "Publish deploy"

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Function returning 500 error | Check HubSpot token is valid in environment variables |
| No results showing | Verify Sales Order property name in HubSpot |
| CORS errors | Ensure functions directory is deployed |
| Blank page | Check browser console for JavaScript errors |

## Need Help?

1. Check README.md troubleshooting section
2. Review Netlify function logs in dashboard
3. Test API endpoint using curl/Postman
4. Contact HubSpot support for API issues
