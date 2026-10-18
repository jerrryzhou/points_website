# points_website

## Member Resources

The `/resources` tab uses an independent design. Resource names and destinations live
in `website/src/data/memberResources.json`; its styles are scoped in
`website/src/css/memberResources.css`.

Library browsing requires the existing Express API and website login. This project
uses public Google Drive folders:

1. Share each library root as **Anyone with the link → Viewer**. Check that its
   existing child files are also viewable without signing in to Google.
2. Enable **Google Drive API** in a Google Cloud project and create an API key
   restricted to that API.
3. Set `GOOGLE_DRIVE_API_KEY` in `server/.env`, then restart the backend.

Members do not need to connect Google accounts. The API key identifies the project
for API access and quotas; it does not grant access to private files. Public Drive
links remain accessible outside the website, regardless of website login.

Keep the API key server-side. No Google credentials are needed to display the
resource dashboard or open the original external links. Until the API is connected,
folder pages explain the connection state and offer direct Drive links.

PDFs use the browser's document viewer. Docs and Sheets use Google previews, with a
PDF export fallback for restricted embeds; Sheets downloads use XLSX. Native Google
previews may require the member's Google sign-in. The PDF fallback uses the server's
access, while Google still enforces the member's own permissions on external links.
Downloads/exports respect Drive's `canDownload` permission. Drive shortcuts remain
external links rather than allowing traversal outside the configured library roots.

If a library root changes, update its ID in both the resource configuration and
`server/resources.js`. Folder libraries use `folderId`; a single-document library
uses `fileId` and opens directly in the preview pane. No database schema changes are required.

Validation:

```sh
npm run build --prefix website
node --test server/resources.test.mjs
```

The existing application also needs its original database, Redis, JWT, and optional
SMTP environment settings. This feature does not replace or bypass those services.
