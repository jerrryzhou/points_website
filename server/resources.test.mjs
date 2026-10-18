import test from "node:test";
import assert from "node:assert/strict";
import { createDriveClient, registerResourceRoutes } from "./resources.js";

const ROOT = "1nkG81KBkCJpLAWgXyqmKswqVjrwkYNcx";
const folder = (id, parents = []) => ({
  id,
  name: id,
  parents,
  mimeType: "application/vnd.google-apps.folder",
});
function client(items) {
  return createDriveClient(
    { GOOGLE_DRIVE_API_KEY: "test-key" },
    async (url) => {
      const id = new URL(url).pathname.split("/").pop();
      return Response.json(items[id], { status: items[id] ? 200 : 404 });
    },
  );
}

test("allows nested files inside an approved root and returns root-first breadcrumbs", async () => {
  const drive = client({
    [ROOT]: folder(ROOT),
    child: folder("child", [ROOT]),
    file: { id: "file", parents: ["child"] },
  });
  assert.deepEqual(
    (await drive.ancestry("file", ROOT)).map((item) => item.id),
    [ROOT, "child", "file"],
  );
});

test("rejects files outside the selected library, trashed files, and parent cycles", async () => {
  for (const items of [
    { private: folder("private") },
    { private: { ...folder("private", [ROOT]), trashed: true } },
    {
      private: folder("private", ["cycle"]),
      cycle: folder("cycle", ["private"]),
    },
  ]) {
    await assert.rejects(client(items).ancestry("private", ROOT), (err) =>
      [403, 404].includes(err.status),
    );
  }
});

test("missing credentials gives a useful setup message without requesting Google", async () => {
  const drive = createDriveClient({}, () =>
    assert.fail("must not contact Google"),
  );
  await assert.rejects(
    drive.metadata(ROOT),
    (err) => err.status === 503 && /not connected/.test(err.message),
  );
});

test("Google errors never expose credentials or upstream error bodies", async () => {
  const drive = createDriveClient(
    { GOOGLE_DRIVE_API_KEY: "secret" },
    async () => Response.json({ error: "secret detail" }, { status: 403 }),
  );
  await assert.rejects(
    drive.metadata(ROOT),
    (err) => err.status === 403 && !err.message.includes("secret"),
  );
});

test("all endpoints authenticate; invalid roots and IDs are rejected before querying Drive", async () => {
  const routes = [];
  const auth = () => {};
  registerResourceRoutes({ get: (...args) => routes.push(args) }, auth, {
    ancestry: () => assert.fail("must not contact Drive"),
  });
  assert.equal(routes.length, 3);
  for (const [, middleware, handler] of routes) {
    assert.equal(middleware, auth);
    for (const [library, id, expected] of [
      ["unknown", ROOT, 404],
      ["academic", "bad'id", 400],
    ]) {
      const res = {
        status(code) {
          this.code = code;
          return this;
        },
        json(body) {
          this.body = body;
        },
      };
      await handler({ params: { library, id }, query: {} }, res);
      assert.equal(res.code, expected);
    }
  }
});

test("download restrictions are respected before fetching file content", async () => {
  const routes = [];
  registerResourceRoutes({ get: (...args) => routes.push(args) }, () => {}, {
    ancestry: async () => [
      {
        id: "file",
        mimeType: "application/pdf",
        capabilities: { canDownload: false },
      },
    ],
    get: () => assert.fail("must not download a restricted file"),
  });
  const res = {
    status(code) {
      this.code = code;
      return this;
    },
    json() {},
  };
  await routes[2][2](
    { params: { library: "academic", id: "file" }, query: {} },
    res,
  );
  assert.equal(res.code, 403);
});

test("public files with omitted parents are checked against parent-scoped listings", async () => {
  const items = {
    [ROOT]: folder(ROOT),
    file: { id: "file", name: "Member's Notes", mimeType: "application/pdf" },
  };
  const drive = createDriveClient(
    { GOOGLE_DRIVE_API_KEY: "test-key" },
    async (input) => {
      const url = new URL(input);
      if (url.pathname.endsWith("/files")) {
        assert.match(
          url.searchParams.get("q"),
          new RegExp(`'${ROOT}' in parents`),
        );
        assert.ok(url.searchParams.get("q").includes("Member\\'s Notes"));
        return Response.json({ files: [items.file] });
      }
      return Response.json(items[url.pathname.split("/").pop()]);
    },
  );
  const chain = await drive.ancestry("file", ROOT);
  assert.deepEqual(
    chain.map((item) => item.id),
    [ROOT, "file"],
  );
  assert.deepEqual(chain[1].parents, [ROOT]);
});

test("an unrelated public file is rejected even when its parents are omitted", async () => {
  const drive = createDriveClient(
    { GOOGLE_DRIVE_API_KEY: "test-key" },
    async (input) => {
      const url = new URL(input);
      if (url.pathname.endsWith("/files")) return Response.json({ files: [] });
      const id = url.pathname.split("/").pop();
      return Response.json(
        id === ROOT ? folder(ROOT) : { id, name: "Unrelated public file" },
      );
    },
  );
  await assert.rejects(
    drive.ancestry("unrelated", ROOT),
    (err) => err.status === 403,
  );
});

test("a configured document root is valid without a parent folder", async () => {
  const drive = createDriveClient(
    { GOOGLE_DRIVE_API_KEY: "test-key" },
    async () =>
      Response.json({
        id: "document-root",
        name: "Officer guide",
        mimeType: "application/vnd.google-apps.document",
      }),
  );
  assert.equal(
    (await drive.ancestry("document-root", "document-root")).length,
    1,
  );
});

test("remembered navigation paths are revalidated before serving a moved file", async () => {
  let listingCalls = 0;
  const drive = createDriveClient(
    { GOOGLE_DRIVE_API_KEY: "test-key" },
    async (input) => {
      const url = new URL(input);
      if (url.pathname.endsWith("/files")) {
        listingCalls++;
        return Response.json({ files: [] });
      }
      return Response.json(folder(ROOT));
    },
  );
  drive.rememberPaths(
    ROOT,
    [folder(ROOT)],
    [{ id: "moved", name: "Moved.pdf" }],
  );
  await assert.rejects(
    drive.ancestry("moved", ROOT),
    (err) => err.status === 404,
  );
  assert.equal(listingCalls, 1);
});
