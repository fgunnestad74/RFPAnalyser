# Google Drive Integration Setup

## Overview
This guide will help you set up Google Drive integration for the RFP Analyzer using a Service Account (recommended for server applications).

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

## Step 2: Enable Google Drive API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Drive API"
3. Click on it and press **Enable**

## Step 3: Create Service Account

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Enter details:
   - **Service account name**: `rfp-analyzer-drive`
   - **Description**: `Service account for RFP Analyzer Google Drive access`
4. Click **Create and Continue**
5. Skip role assignment (we'll handle permissions via sharing)
6. Click **Done**

## Step 4: Generate Service Account Key

1. In the **Credentials** page, find your service account
2. Click on it to open details
3. Go to the **Keys** tab
4. Click **Add Key** > **Create New Key**
5. Choose **JSON** format
6. Download the JSON file - **keep this secure!**

## Step 5: Configure Environment Variables

The JSON file contains credentials. Extract these values and add to your `.env` file:

```env
# Google Drive Service Account Credentials
GOOGLE_CLIENT_ID=your-client-id-from-json
GOOGLE_CLIENT_EMAIL=your-service-account-email
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----"
GOOGLE_PROJECT_ID=your-project-id
```

**Example of extracting from JSON:**
If your JSON file contains:
```json
{
  "client_id": "123456789-abcdef.apps.googleusercontent.com",
  "client_email": "rfp-analyzer-drive@your-project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n",
  "project_id": "your-project-id"
}
```

Add to `.env`:
```env
GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
GOOGLE_CLIENT_EMAIL=rfp-analyzer-drive@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-project-id
```

## Step 6: Share Google Drive Folders

Since we're using a Service Account, you need to share your Google Drive folders with the service account email:

1. Open Google Drive
2. Right-click the folder you want to analyze
3. Click **Share**
4. Add the service account email (from step 5)
5. Give **Viewer** permissions
6. Click **Send**

## Step 7: Get Folder ID

To use a folder in the RFP Analyzer:

1. Open the shared folder in Google Drive
2. Copy the URL - it looks like: `https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz`
3. The Folder ID is the part after `/folders/`: `1AbCdEfGhIjKlMnOpQrStUvWxYz`

## Troubleshooting

### "Google Drive not configured" message
- Check that all environment variables are set in `.env`
- Restart the backend server after adding credentials
- Verify the private key is properly formatted with escaped newlines

### "Folder not found" or "Permission denied" errors
- Make sure the folder is shared with the service account email
- Verify the folder ID is correct
- Check that the service account has at least Viewer permissions

### "Failed to authenticate" errors  
- Verify the private key format in `.env`
- Make sure there are no extra spaces or characters
- The private key should include `\n` characters, not actual line breaks

## Security Notes

- Never commit the `.env` file to version control
- Keep the JSON credentials file secure and don't share it
- The service account only has access to folders explicitly shared with it
- Consider rotating credentials periodically

## Testing

Once configured, you can test the integration:

1. Start the backend server
2. Open the RFP Analyzer frontend  
3. Switch to "Google Drive" mode
4. Enter a folder ID
5. Click "Load" to see the files

The system will show only supported document types (PDF, Word, Excel, etc.) from the folder.