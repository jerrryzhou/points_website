import { useEffect, useMemo, useState } from "react";

export default function ApprovedPointRequestsTable({
  requests = [],
  pageSize = 10,
  onUpdatePoints, // async (requestId, newPoints) => void
}) {
  const [page, setPage] = useState(1);

  // inline edit state
  const [editingId, setEditingId] = useState(null);
  const [draftPoints, setDraftPoints] = useState("");
  const [saving, setSaving] = useState(false);

  const totalPages = Math.max(1, Math.ceil(requests.length / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const pagedRequests = useMemo(() => {
    const start = (page - 1) * pageSize;
    return requests.slice(start, start + pageSize);
  }, [requests, page, pageSize]);

  const startRow = requests.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow = Math.min(page * pageSize, requests.length);

  const startEdit = (r) => {
    setEditingId(r.id);
    setDraftPoints(String(r.points ?? ""));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftPoints("");
  };

  const saveEdit = async (r) => {
    const n = Number(draftPoints);
    if (!Number.isFinite(n)) return alert("Points must be a number");
    if (n < 0) return alert("Points cannot be negative");

    try {
      setSaving(true);
      await onUpdatePoints?.(r.id, n);
      cancelEdit();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Given By
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Given To
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Points
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Approved On
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {pagedRequests.map((r) => {
              const isEditing = editingId === r.id;

              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {r.given_by_name || r.given_by_email || "—"}
                  </td>

                  <td className="px-6 py-4 text-gray-700">
                    {r.given_to_name || r.given_to_email || "—"}
                  </td>

                  <td className="px-6 py-4 text-gray-600 max-w-[520px]">
                    <div className="truncate" title={r.reason || ""}>
                      {r.reason || "—"}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-700">
                    {isEditing ? (
                      <input
                        type="number"
                        value={draftPoints}
                        onChange={(e) => setDraftPoints(e.target.value)}
                        className="w-24 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-400"
                        disabled={saving}
                      />
                    ) : (
                      <span className="font-semibold">{r.points}</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {r.approved_at
                      ? new Date(r.approved_at).toLocaleString()
                      : "—"}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => saveEdit(r)}
                          disabled={saving}
                          className="text-green-700 hover:text-green-900 font-medium disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="text-gray-500 hover:text-gray-700 font-medium disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(r)}
                        className="text-green-700 hover:text-green-900 font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {requests.length === 0 && (
              <tr>
                <td className="px-6 py-6 text-center text-gray-500" colSpan={6}>
                  No approved point requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow px-4 py-3">
        <div className="text-sm text-gray-600">
          Showing <span className="font-semibold">{startRow}</span>–
          <span className="font-semibold">{endRow}</span> of{" "}
          <span className="font-semibold">{requests.length}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
          >
            First
          </button>

          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
          >
            Prev
          </button>

          <span className="text-sm text-gray-700">
            Page <span className="font-semibold">{page}</span> of{" "}
            <span className="font-semibold">{totalPages}</span>
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
          >
            Next
          </button>

          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}