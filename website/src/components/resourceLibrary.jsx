import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "./protectedRoute";
import ResourceIcon, { ResourceSearch, ResourceExternal } from "./resourceIcon";

const FOLDER = "application/vnd.google-apps.folder";
const DOC = "application/vnd.google-apps.document";
const SHEET = "application/vnd.google-apps.spreadsheet";
const API = process.env.REACT_APP_API_URL || "";
function formatFileSize(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  const unit = bytes >= 1024 * 1024 ? "MB" : bytes >= 1024 ? "KB" : "B";
  const divisor = unit === "MB" ? 1024 * 1024 : unit === "KB" ? 1024 : 1;
  return `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(bytes / divisor)} ${unit}`;
}

export function fileType(file) {
  if (file.mimeType === FOLDER) return { label: "Folder", icon: "folder" };
  if (file.mimeType === DOC) return { label: "Google Doc", icon: "document" };
  if (file.mimeType === SHEET) return { label: "Google Sheet", icon: "sheet" };
  if (file.mimeType === "application/pdf") return { label: "PDF", icon: "pdf" };
  const extension = file.name.includes(".") ? file.name.split(".").pop() : null;
  return { label: extension?.toUpperCase() || "File", icon: "document" };
}

async function request(path, token, signal) {
  const response = await fetch(`${API}/api/resources/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data)
    throw new Error(
      data?.error ||
        "The library is unavailable. You can still open this folder in Google Drive.",
    );
  return data;
}

function FilePreview({ file, library, token }) {
  const [pdfUrl, setPdfUrl] = useState("");
  const [fallback, setFallback] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const downloadController = useRef(null);
  useEffect(() => () => downloadController.current?.abort(), []);
  const type = fileType(file);
  const canExport = [DOC, SHEET].includes(file.mimeType);
  const previewBase =
    file.mimeType === DOC
      ? "https://docs.google.com/document/d/"
      : file.mimeType === SHEET
        ? "https://docs.google.com/spreadsheets/d/"
        : "https://drive.google.com/file/d/";
  const nativeUrl = `${previewBase}${encodeURIComponent(file.id)}/preview`;
  const usePdf =
    (file.mimeType === "application/pdf" &&
      file.capabilities?.canDownload === true) ||
    (canExport && fallback);
  useEffect(() => {
    if (!usePdf) return;
    const controller = new AbortController();
    let objectUrl;
    setPreviewLoading(true);
    setPdfUrl("");
    setError("");
    fetch(
      `${API}/api/resources/${library.id}/files/${file.id}/content?preview=true`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      },
    )
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error);
        }
        return response.blob();
      })
      .then((blob) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      })
      .catch((err) => {
        if (!controller.signal.aborted)
          setError(
            err.message ||
              "Preview unavailable. Open the file in Drive to view it.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setPreviewLoading(false);
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.id, library.id, token, usePdf]);

  async function download() {
    if (downloading) return;
    const controller = new AbortController();
    downloadController.current = controller;
    setDownloading(true);
    setDownloadError("");
    try {
      const response = await fetch(
        `${API}/api/resources/${library.id}/files/${file.id}/content`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        },
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        file.name +
        (file.mimeType === DOC
          ? ".pdf"
          : file.mimeType === SHEET
            ? ".xlsx"
            : "");
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      if (controller.signal.aborted) return;
      setDownloadError(
        err.message || "Download unavailable. Try opening this file in Drive.",
      );
    } finally {
      if (!controller.signal.aborted) setDownloading(false);
    }
  }
  return (
    <section className="mr-preview" aria-label={`Preview of ${file.name}`}>
      <header className="mr-preview-header">
        <span className={`mr-file-icon mr-file-icon--${type.icon}`}>
          <ResourceIcon name={type.icon} size={27} />
        </span>
        <div className="mr-file-heading">
          <h2>{file.name}</h2>
          <p>
            {type.label}
            {!canExport && formatFileSize(file.size)
              ? ` · ${formatFileSize(file.size)}`
              : ""}
            {canExport && file.capabilities?.canDownload && (
              <button
                className="mr-preview-toggle"
                onClick={() => {
                  setPdfUrl("");
                  setFallback((value) => !value);
                  setError("");
                }}
              >
                {fallback ? "Google view" : "PDF view"}
              </button>
            )}
          </p>
        </div>
        <div className="mr-preview-actions">
          <ResourceExternal
            href={
              file.webViewLink ||
              `https://drive.google.com/file/d/${file.id}/view`
            }
            className="mr-button"
          >
            <ResourceIcon name="external" size={18} />
            <span>Open in Drive</span>
          </ResourceExternal>
          {file.capabilities?.canDownload && (
            <button
              className="mr-button"
              onClick={download}
              disabled={downloading}
              aria-busy={downloading}
            >
              <ResourceIcon name="download" size={18} />
              <span>{downloading ? "Downloading…" : "Download"}</span>
            </button>
          )}
        </div>
      </header>
      {downloadError && (
        <p className="mr-download-error" role="alert">
          {downloadError}
        </p>
      )}
      {error ? (
        <div className="mr-empty" role="alert">
          <ResourceIcon name="document" size={36} />
          <h3>Preview unavailable</h3>
          <p>{error}</p>
          <ResourceExternal
            href={file.webViewLink || nativeUrl}
            className="mr-button"
          >
            Open in Drive <ResourceIcon name="external" size={16} />
          </ResourceExternal>
        </div>
      ) : usePdf && (previewLoading || !pdfUrl) ? (
        <div className="mr-empty" role="status">
          <span className="mr-spinner" />
          <p>Preparing your document…</p>
        </div>
      ) : (
        <iframe
          title={`Document preview: ${file.name}`}
          className="mr-document-frame"
          src={
            usePdf
              ? pdfUrl
                ? `${pdfUrl}#view=FitH&navpanes=0`
                : undefined
              : nativeUrl
          }
          allow="fullscreen"
          referrerPolicy="no-referrer"
        />
      )}
    </section>
  );
}

export default function ResourceLibrary({ library }) {
  const { token } = useAuth();
  const [params, setParams] = useSearchParams();
  const isDocument = Boolean(library.fileId);
  const folderId = params.get("folder") || library.folderId;
  const selectedId = isDocument ? library.fileId : params.get("file");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ column: "name", descending: false });
  const [files, setFiles] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageError, setPageError] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [fileError, setFileError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (isDocument) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setPageError("");
    request(
      `${library.id}/folders/${encodeURIComponent(folderId)}`,
      token,
      controller.signal,
    )
      .then((data) => {
        if (!Array.isArray(data.files) || !Array.isArray(data.breadcrumbs)) {
          throw new Error(
            "The library returned an unexpected response. Please try again.",
          );
        }
        setFiles(data.files);
        setBreadcrumbs(data.breadcrumbs);
        setNextPage(data.nextPageToken || null);
      })
      .catch((err) => {
        if (!controller.signal.aborted)
          setError(
            err.message === "Failed to fetch"
              ? "The resource server is not connected yet. Open this library in Drive in the meantime."
              : err.message,
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [folderId, library.id, token, revision, isDocument]);
  useEffect(() => {
    setSelected(null);
    setFileError("");
    if (!selectedId) return;
    const controller = new AbortController();
    request(
      `${library.id}/files/${encodeURIComponent(selectedId)}${isDocument ? "" : `?folder=${encodeURIComponent(folderId)}`}`,
      token,
      controller.signal,
    )
      .then(setSelected)
      .catch((err) => {
        if (!controller.signal.aborted) setFileError(err.message);
      });
    return () => controller.abort();
  }, [selectedId, library.id, folderId, token, isDocument]);
  function openFolder(id) {
    setParams(id === library.folderId ? {} : { folder: id });
  }
  function changeSort(column) {
    setSort((previous) => ({
      column,
      descending: previous.column === column ? !previous.descending : false,
    }));
  }
  async function loadMore() {
    if (loadingMore || !nextPage) return;
    setLoadingMore(true);
    setPageError("");
    try {
      const data = await request(
        `${library.id}/folders/${encodeURIComponent(folderId)}?pageToken=${encodeURIComponent(nextPage)}`,
        token,
      );
      if (!Array.isArray(data.files))
        throw new Error("More files could not be loaded. Please try again.");
      setFiles((previous) =>
        Array.from(
          new Map(
            [...previous, ...data.files].map((file) => [file.id, file]),
          ).values(),
        ),
      );
      setNextPage(data.nextPageToken || null);
    } catch (err) {
      setPageError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }
  const visible = files
    .filter((file) =>
      file.name.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => {
      const folderOrder =
        Number(b.mimeType === FOLDER) - Number(a.mimeType === FOLDER);
      if (folderOrder) return folderOrder;
      const comparison =
        sort.column === "name"
          ? a.name.localeCompare(b.name, undefined, { numeric: true })
          : new Date(a.modifiedTime || 0) - new Date(b.modifiedTime || 0);
      return sort.descending ? -comparison : comparison;
    });
  const folderLink = `https://drive.google.com/drive/folders/${encodeURIComponent(folderId)}`;
  const parent =
    breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;
  return (
    <>
      <div className="mr-browser-top">
        <nav className="mr-breadcrumbs" aria-label="Resource breadcrumbs">
          {folderId !== library.folderId ? (
            <button
              className="mr-back"
              onClick={() => openFolder(parent?.id || library.folderId)}
            >
              <ResourceIcon name="back" size={22} />
              Back
            </button>
          ) : (
            <Link className="mr-back" to="/resources">
              <ResourceIcon name="back" size={22} />
              Back
            </Link>
          )}
          <span className="mr-crumb-divider" />
          <Link to="/resources">Member Resources</Link>
          <span>/</span>
          {breadcrumbs.length ? (
            breadcrumbs.map((crumb, index) => (
              <span className="mr-crumb" key={crumb.id}>
                {index > 0 && <span>/</span>}
                {index === breadcrumbs.length - 1 ? (
                  <span aria-current="page">
                    {index === 0 ? library.name : crumb.name}
                  </span>
                ) : (
                  <button onClick={() => openFolder(crumb.id)}>
                    {index === 0 ? library.name : crumb.name}
                  </button>
                )}
              </span>
            ))
          ) : (
            <span aria-current="page">{library.name}</span>
          )}
        </nav>
        {!isDocument && (
          <ResourceSearch
            value={query}
            onChange={setQuery}
            placeholder="Search this folder…"
          />
        )}
      </div>
      <header className="mr-heading mr-heading--library">
        <div>
          <h1>{library.name}</h1>
          <p>
            {isDocument
              ? "Read your officer guides and handoffs without leaving the site."
              : "Browse folders and preview files without leaving the site."}
          </p>
        </div>
      </header>
      {selectedId && !isDocument && (
        <button
          className="mr-mobile-back mr-text-button"
          onClick={() => openFolder(folderId)}
        >
          <ResourceIcon name="back" size={18} />
          Back to files
        </button>
      )}
      <div
        className={`mr-browser ${selectedId ? "mr-browser--selected" : ""} ${isDocument ? "mr-browser--document" : ""}`}
      >
        {!isDocument && (
          <section className="mr-file-list" aria-label="Folder contents">
            <div className="mr-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      aria-sort={
                        sort.column === "name"
                          ? sort.descending
                            ? "descending"
                            : "ascending"
                          : "none"
                      }
                    >
                      <button onClick={() => changeSort("name")}>
                        Name
                        {sort.column === "name" && (
                          <ResourceIcon
                            name="sort"
                            size={17}
                            style={{
                              transform: sort.descending
                                ? "rotate(180deg)"
                                : undefined,
                            }}
                          />
                        )}
                      </button>
                    </th>
                    <th scope="col">Type</th>
                    <th
                      scope="col"
                      aria-sort={
                        sort.column === "date"
                          ? sort.descending
                            ? "descending"
                            : "ascending"
                          : "none"
                      }
                    >
                      <button onClick={() => changeSort("date")}>
                        Last modified
                      </button>
                    </th>
                    <th scope="col">
                      <span className="mr-sr-only">Open externally</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((file) => {
                    const type = fileType(file);
                    return (
                      <tr
                        key={file.id}
                        className={selectedId === file.id ? "is-selected" : ""}
                      >
                        <td>
                          <button
                            className="mr-file-select"
                            onClick={() =>
                              file.mimeType === FOLDER
                                ? openFolder(file.id)
                                : setParams({
                                    ...(folderId !== library.folderId
                                      ? { folder: folderId }
                                      : {}),
                                    file: file.id,
                                  })
                            }
                            aria-current={
                              selectedId === file.id ? "true" : undefined
                            }
                          >
                            <span
                              className={`mr-file-icon mr-file-icon--${type.icon}`}
                            >
                              <ResourceIcon name={type.icon} size={27} />
                            </span>
                            <span>{file.name}</span>
                          </button>
                        </td>
                        <td>{type.label}</td>
                        <td>
                          {file.modifiedTime
                            ? new Date(file.modifiedTime).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </td>
                        <td>
                          <ResourceExternal
                            href={
                              file.webViewLink ||
                              `https://drive.google.com/${file.mimeType === FOLDER ? "drive/folders/" : "file/d/"}${file.id}`
                            }
                            className="mr-row-external"
                            aria-label={`Open ${file.name} in Drive`}
                          >
                            <ResourceIcon name="external" size={17} />
                          </ResourceExternal>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {loading && (
              <div className="mr-list-status" role="status">
                <span className="mr-spinner" /> Loading resources…
              </div>
            )}
            {error && (
              <div className="mr-empty mr-connection" role="alert">
                <ResourceIcon name="folder" size={38} />
                <h2>Your library lives here.</h2>
                <p>{error}</p>
                <div className="mr-state-actions">
                  <ResourceExternal href={folderLink} className="mr-button">
                    Open folder in Drive{" "}
                    <ResourceIcon name="external" size={17} />
                  </ResourceExternal>
                  <button
                    className="mr-text-button"
                    onClick={() => setRevision((value) => value + 1)}
                  >
                    <ResourceIcon name="refresh" size={17} />
                    Retry
                  </button>
                </div>
              </div>
            )}
            {!loading && !error && !visible.length && (
              <div className="mr-empty" role="status">
                <ResourceIcon name={query ? "search" : "folder"} size={36} />
                <h2>{query ? "No matching files" : "This folder is empty"}</h2>
                <p>
                  {query
                    ? "Try another filename or browse a different folder."
                    : "Files added in Google Drive will appear here."}
                </p>
                {query && (
                  <button className="mr-button" onClick={() => setQuery("")}>
                    Clear search
                  </button>
                )}
              </div>
            )}
            {nextPage && !error && (
              <div className="mr-load-more">
                <button
                  className="mr-button"
                  disabled={loadingMore}
                  aria-busy={loadingMore}
                  onClick={loadMore}
                >
                  {loadingMore
                    ? "Loading…"
                    : pageError
                      ? "Retry loading more files"
                      : "Load more files"}
                </button>
                <p>Search filters the files loaded in this folder.</p>
              </div>
            )}
            {pageError && (
              <p className="mr-pagination-error" role="alert">
                {pageError}
              </p>
            )}
            <footer className="mr-list-footer">
              <span>
                {files.length
                  ? `${files.length} ${files.length === 1 ? "item" : "items"}`
                  : "Google Drive library"}
              </span>
              <ResourceExternal href={folderLink}>
                Open folder in Drive <ResourceIcon name="external" size={14} />
              </ResourceExternal>
            </footer>
          </section>
        )}
        {selected ? (
          <div className="mr-preview-wrap">
            <FilePreview
              key={selected.id}
              file={selected}
              library={library}
              token={token}
            />
          </div>
        ) : (
          <section className="mr-preview mr-preview--empty">
            <div className="mr-empty" role="status">
              <span className="mr-preview-empty-icon">
                <ResourceIcon name="document" size={40} />
              </span>
              <h2>
                {fileError
                  ? "File unavailable"
                  : selectedId
                    ? "Opening your document…"
                    : "A little knowledge goes a long way."}
              </h2>
              <p>
                {fileError ||
                  (selectedId
                    ? "Fetching the latest version from Google Drive."
                    : "Choose a file to preview it here. Your place in the library stays right where you left it.")}
              </p>
              {!selectedId && (
                <span className="mr-format-hint">
                  PDFs · Google Docs · Google Sheets
                </span>
              )}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
