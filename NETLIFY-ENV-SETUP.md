# Environment Variables Check

This project requires the following environment variables to be set in Netlify:

## Google Sheets Configuration
- `GOOGLE_SHEETS_ID` - The ID of your Google Sheet (from the URL)
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` - Service account email
- `GOOGLE_PRIVATE_KEY` - Service account private key (keep the \n characters)

## Sports Inc API
- `SPORTS_INC_USERNAME` - Your Sports Inc username
- `SPORTS_INC_PASSWORD` - Your Sports Inc password

## Email Configuration (Optional)
- `EMAIL_FROM` - Sender email address
- `EMAIL_TO` - Recipient email address
- `SENDGRID_API_KEY` - SendGrid API key (if using SendGrid)

## HubSpot Configuration (Currently Disabled)
- `HUBSPOT_ACCESS_TOKEN` - HubSpot API token

## How to Set in Netlify:

1. Go to your Netlify dashboard
2. Select your site
3. Go to Site settings > Environment variables
4. Add each variable with its value

**IMPORTANT for GOOGLE_PRIVATE_KEY:**
- Copy the ENTIRE private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep the `\n` characters - do NOT replace them with actual newlines
- The value should look like: `"-----BEGIN PRIVATE KEY-----\nMIIEv...rest of key...\n-----END PRIVATE KEY-----\n"`
