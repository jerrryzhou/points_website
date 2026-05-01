import { useEffect, useMemo, useState } from "react";

export default function FinesHistoryTable({ fines = [], pageSize = 30, onUpdateAmount }) {
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [draftAmount, setDraftAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const totalPages = Math.max(1, Math.ceil(fines.length / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return fines.slice(start, start + pageSize);
  }, [fines, page, pageSize]);

  const startRow = fines.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow = Math.min(page * pageSize, fines.length);

  const startEdit = (f) => {
    setEditingId(f.id);
    setDraftAmount(String(f.amount));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftAmount("");
  };

  const saveEdit = async (f) => {
    const n = Number(draftAmount);
    if (!Number.isFinite(n) || n <= 0) return alert("Amount must be a positive number");
    try {
      setSaving(true);
      await onUpdateAmount?.(f.id, n);
      cancelEdit();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto bg-white/10 backdrop-blur-md rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-white/10">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Member</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-300 uppercase">Amount</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-300 uppercase">Alleviated</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-300 uppercase">Outstanding</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {paged.map((f) => {
              const isEditing = editingId === f.id;
              const outstanding = f.amount - f.alleviation_amount;
              return (
                <tr key={f.id} className="hover:bg-white/5">
                  <td className="px-6 py-4 font-medium text-white">{f.member_name}</td>
                  <td className="px-6 py-4 text-gray-200 max-w-xs">
                    <div className="truncate" title={f.reason}>{f.reason}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-300 whitespace-nowrap">
                    {new Date(f.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-200">
                    {isEditing ? (
                      <input
                        type="number"
                        min="1"
                        value={draftAmount}
                        onChange={(e) => setDraftAmount(e.target.value)}
                        className="w-24 px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-green-400 text-right"
                        disabled={saving}
                      />
                    ) : (
                      <span className="font-semibold">${f.amount}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {f.alleviation_amount > 0 ? (
                      <div>
                        <div className="text-green-300 font-medium">${f.alleviation_amount}</div>
                        {f.alleviation_date && (
                          <div className="text-xs text-gray-400">
                            {new Date(f.alleviation_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-semibold ${outstanding === 0 ? "text-green-300" : "text-red-400"}`}>
                      {outstanding === 0 ? "Cleared" : `$${outstanding}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => saveEdit(f)}
                          disabled={saving}
                          className="text-green-300 hover:text-green-100 font-medium disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="text-gray-400 hover:text-gray-200 font-medium disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(f)}
                        className="text-green-300 hover:text-green-100 font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {fines.length === 0 && (
              <tr>
                <td className="px-6 py-6 text-center text-gray-300" colSpan={7}>
                  No fines on record.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-xl shadow-lg px-4 py-3">
        <div className="text-sm text-gray-300">
          Showing <span className="font-semibold text-white">{startRow}</span>–
          <span className="font-semibold text-white">{endRow}</span> of{" "}
          <span className="font-semibold text-white">{fines.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(1)} disabled={page === 1} className="px-3 py-2 rounded-lg border border-white/20 text-sm text-gray-200 disabled:opacity-40 hover:bg-white/10">First</button>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-2 rounded-lg border border-white/20 text-sm text-gray-200 disabled:opacity-40 hover:bg-white/10">Prev</button>
          <span className="text-sm text-gray-300">Page <span className="font-semibold text-white">{page}</span> of <span className="font-semibold text-white">{totalPages}</span></span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-2 rounded-lg border border-white/20 text-sm text-gray-200 disabled:opacity-40 hover:bg-white/10">Next</button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-3 py-2 rounded-lg border border-white/20 text-sm text-gray-200 disabled:opacity-40 hover:bg-white/10">Last</button>
        </div>
      </div>
    </div>
  );
}
