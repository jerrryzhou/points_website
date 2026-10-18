import { createSign } from "node:crypto";

// Root IDs match website/src/data/memberResources.json. No arbitrary Drive access.
const LIBRARIES = {
  academic: "1nkG81KBkCJpLAWgXyqmKswqVjrwkYNcx",
  transition: "1k_x3sEVQQpBRyiIVZ9uVdVH4OShzFdz2_LspZArCDFM",
  chapter: "1ZqXg5_tecuyRPlI31WqFekic35PaHtIX",
};
const FOLDER = "application/vnd.google-apps.folder";
const DOC = "application/vnd.google-apps.document";
const SHEET = "application/vnd.google-apps.spreadsheet";
const FIELDS =
  "id,name,mimeType,modifiedTime,size,webViewLink,parents,trashed,capabilities(canDownload)";
const fail = (status, message) => Object.assign(new Error(message), { status });
const validId = (value) =>
  typeof value === "string" && /^[\w-]{1,200}$/.test(value);

export function createDriveClient(env = process.env, fetcher = fetch) {
  // Cache navigation hints, not authorization: every edge is rechecked before use.
  const navigationPaths = new Map();
  function rememberPaths(root, chain, children) {
    for (const child of children) {
      if (navigationPaths.size >= 2000)
        navigationPaths.delete(navigationPaths.keys().next().value);
      navigationPaths.set(`${root}:${child.id}`, {
        chain: [...chain, child],
        expiresAt: Date.now() + 5 * 60_000,
      });
    }
  }
  let cachedToken;
  let expiresAt = 0;
  async function authorization() {
    if (env.GOOGLE_DRIVE_API_KEY && !env.GOOGLE_DRIVE_CLIENT_EMAIL) return null;
    if (!env.GOOGLE_DRIVE_CLIENT_EMAIL || !env.GOOGLE_DRIVE_PRIVATE_KEY) {
      throw fail(
        503,
        "Google Drive is not connected yet. You can still open this library directly in Drive.",
      );
    }
    if (cachedToken && Date.now() < expiresAt) return cachedToken;
    const now = Math.floor(Date.now() / 1000);
    const encode = (value) =>
      Buffer.from(JSON.stringify(value)).toString("base64url");
    const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
      iss: env.GOOGLE_DRIVE_CLIENT_EMAIL,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })}`;
    const signature = createSign("RSA-SHA256")
      .update(unsigned)
      .sign(env.GOOGLE_DRIVE_PRIVATE_KEY.replace(/\\n/g, "\n"), "base64url");
    const response = await fetcher("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${unsigned}.${signature}`,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await response.json();
    if (!response.ok || !data.access_token)
      throw fail(
        503,
        "The Google Drive connection needs attention. Open this library in Drive for now.",
      );
    cachedToken = data.access_token;
    expiresAt = Date.now() + (Number(data.expires_in || 3600) - 60) * 1000;
    return cachedToken;
  }
  async function get(path, params = {}, raw = false) {
    const token = await authorization();
    const url = new URL(`https://www.googleapis.com/drive/v3/${path}`);
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.set(key, value),
    );
    if (!token) url.searchParams.set("key", env.GOOGLE_DRIVE_API_KEY);
    const response = await fetcher(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      throw fail(
        response.status === 404 ? 404 : response.status === 403 ? 403 : 502,
        response.status === 404
          ? "This file or folder could not be found, or it is no longer shared."
          : response.status === 403
            ? "Google Drive has not granted access to this resource."
            : "Google Drive is temporarily unavailable. Please try again.",
      );
    }
    return raw ? response : response.json();
  }
  const metadata = (id) =>
    get(`files/${encodeURIComponent(id)}`, {
      fields: FIELDS,
      supportsAllDrives: "true",
    });
  async function publicAncestry(id, root, name) {
    // Public files.get responses can omit parents. Prove membership using
    // parent-scoped listings instead of trusting a folder supplied by the client.
    const rootItem = await metadata(root);
    if (rootItem.mimeType !== FOLDER)
      throw fail(403, "This resource is outside the selected library.");
    const queue = [[rootItem]];
    const visited = new Set([root]);
    const escapedName = name?.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    let requests = 0;
    for (let index = 0; index < queue.length; index++) {
      const chain = queue[index];
      const parent = chain[chain.length - 1].id;
      let pageToken;
      do {
        if (++requests > 200)
          throw fail(
            503,
            "This library is taking too long to browse. Please open it in Drive.",
          );
        const data = await get("files", {
          q: `'${parent}' in parents and trashed = false${escapedName ? ` and (mimeType = '${FOLDER}' or name = '${escapedName}')` : ""}`,
          fields: `nextPageToken,files(${FIELDS})`,
          pageSize: "1000",
          supportsAllDrives: "true",
          includeItemsFromAllDrives: "true",
          ...(pageToken ? { pageToken } : {}),
        });
        rememberPaths(root, chain, data.files || []);
        for (const child of data.files || []) {
          const item = { ...child, parents: [parent] };
          if (item.id === id) return [...chain, item];
          if (item.mimeType === FOLDER && !visited.has(item.id)) {
            visited.add(item.id);
            queue.push([...chain, item]);
          }
        }
        pageToken = data.nextPageToken;
      } while (pageToken);
    }
    throw fail(403, "This resource is outside the selected library.");
  }
  async function ancestry(id, root) {
    const hint = navigationPaths.get(`${root}:${id}`);
    if (hint && hint.expiresAt > Date.now()) {
      const verified = [await metadata(root)];
      for (const child of hint.chain.slice(1)) {
        const parent = verified[verified.length - 1].id;
        const name = child.name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
        let pageToken;
        let match;
        do {
          const data = await get("files", {
            q: `'${parent}' in parents and trashed = false and name = '${name}'`,
            fields: `nextPageToken,files(${FIELDS})`,
            pageSize: "1000",
            supportsAllDrives: "true",
            includeItemsFromAllDrives: "true",
            ...(pageToken ? { pageToken } : {}),
          });
          match = data.files?.find((item) => item.id === child.id);
          pageToken = data.nextPageToken;
        } while (!match && pageToken);
        if (!match) {
          navigationPaths.delete(`${root}:${id}`);
          throw fail(
            404,
            "This resource has moved or is no longer in this library.",
          );
        }
        verified.push({ ...match, parents: [parent] });
      }
      return verified;
    }
    const result = [];
    const seen = new Set();
    let current = id;
    while (current && result.length < 40 && !seen.has(current)) {
      seen.add(current);
      const item = await metadata(current);
      if (item.trashed)
        throw fail(404, "This resource has been removed from the library.");
      result.unshift(item);
      if (item.id === root) return result;
      if (!item.parents) {
        const parentChain = await publicAncestry(item.id, root, item.name);
        result[0] = {
          ...item,
          parents: parentChain[parentChain.length - 1].parents,
        };
        return [...parentChain.slice(0, -1), ...result];
      }
      current = item.parents[0];
    }
    throw fail(403, "This resource is outside the selected library.");
  }
  return { get, metadata, ancestry, rememberPaths };
}

export function registerResourceRoutes(
  app,
  authenticateToken,
  drive = createDriveClient(),
) {
  const guard = (handler) => async (req, res) => {
    try {
      const root = LIBRARIES[req.params.library];
      if (!root) throw fail(404, "Library not found.");
      const id = req.params.id;
      if (!validId(id)) throw fail(400, "Invalid file or folder ID.");
      await handler(req, res, root, id);
    } catch (err) {
      // Do not expose Google responses, private keys, tokens, or API keys.
      if (!err.status) console.error("Resource request failed:", err.name);
      res.status(err.status || 502).json({
        error: err.status
          ? err.message
          : "The library could not be loaded. Please try again or open it in Drive.",
      });
    }
  };
  const base = "/api/resources/:library";
  app.get(
    `${base}/folders/:id`,
    authenticateToken,
    guard(async (req, res, root, id) => {
      const chain = await drive.ancestry(id, root);
      if (chain[chain.length - 1].mimeType !== FOLDER)
        throw fail(400, "This item is not a folder.");
      if (
        req.query.pageToken &&
        (typeof req.query.pageToken !== "string" ||
          req.query.pageToken.length > 4000)
      )
        throw fail(400, "Invalid page token.");
      const data = await drive.get("files", {
        q: `'${id}' in parents and trashed = false`,
        fields: `nextPageToken,files(${FIELDS})`,
        pageSize: "100",
        orderBy: "folder,name",
        supportsAllDrives: "true",
        includeItemsFromAllDrives: "true",
        ...(req.query.pageToken ? { pageToken: req.query.pageToken } : {}),
      });
      drive.rememberPaths?.(root, chain, data.files || []);
      res.set("Cache-Control", "private, no-store").json({
        ...data,
        breadcrumbs: chain.map(({ id, name }) => ({ id, name })),
      });
    }),
  );
  app.get(
    `${base}/files/:id`,
    authenticateToken,
    guard(async (req, res, root, id) => {
      const chain = await drive.ancestry(id, root);
      const item = chain[chain.length - 1];
      if (req.query.folder && !item.parents?.includes(req.query.folder))
        throw fail(404, "This file is not in the selected folder.");
      res.set("Cache-Control", "private, no-store").json(item);
    }),
  );
  app.get(
    `${base}/files/:id/content`,
    authenticateToken,
    guard(async (req, res, root, id) => {
      const chain = await drive.ancestry(id, root);
      const item = chain[chain.length - 1];
      if (!item.capabilities?.canDownload)
        throw fail(
          403,
          "Downloading or exporting this file is disabled by its owner.",
        );
      if (item.mimeType === FOLDER)
        throw fail(400, "Open folders in the library browser.");
      const isWorkspace = [DOC, SHEET].includes(item.mimeType);
      if (
        item.mimeType.startsWith("application/vnd.google-apps.") &&
        !isWorkspace
      )
        throw fail(415, "Open this file in Drive to view or download it.");
      const preview = req.query.preview === "true";
      if (preview && !isWorkspace && item.mimeType !== "application/pdf")
        throw fail(415, "This file type cannot be previewed as a PDF.");
      const mimeType =
        item.mimeType === SHEET && !preview
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf";
      const upstream = await drive.get(
        `files/${id}${isWorkspace ? "/export" : ""}`,
        isWorkspace
          ? { mimeType }
          : { alt: "media", supportsAllDrives: "true" },
        true,
      );
      res.set({
        "Cache-Control": "private, no-store",
        "Content-Type": isWorkspace ? mimeType : item.mimeType,
        "Content-Disposition": preview ? "inline" : "attachment",
        "X-Content-Type-Options": "nosniff",
      });
      // Stream documents instead of buffering entire libraries in server memory.
      const { Readable } = await import("node:stream");
      const body = Readable.fromWeb(upstream.body);
      body.on("error", () => res.destroy());
      res.on("close", () => body.destroy());
      body.pipe(res);
    }),
  );
}
