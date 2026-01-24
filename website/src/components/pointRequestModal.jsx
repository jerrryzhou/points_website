import { useMemo, useState } from "react";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";

const makeRow = () => ({ recipientId: "", points: "" });

export default function GivePointsModal({ open, onClose, members, giverId }) {
  const [rows, setRows] = useState([makeRow()]);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const recipientOptions = useMemo(() => {
    return (members || [])
      .filter((m) => String(m.id) !== String(giverId))
      .map((m) => ({ value: String(m.id), label: m.full_name }));
  }, [members, giverId]);

  const selectedIds = useMemo(
    () => new Set(rows.map((r) => String(r.recipientId)).filter(Boolean)),
    [rows]
  );

  const optionsForRow = (rowIndex) => {
    const current = String(rows[rowIndex].recipientId || "");
    return recipientOptions.map((opt) => ({
      ...opt,
      isDisabled: opt.value !== current && selectedIds.has(opt.value),
    }));
  };

  const updateRow = (idx, patch) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, makeRow()]);

  const removeRow = (idx) => {
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : [makeRow()];
    });
  };

  // ✅ hooks first, early return after
  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();

    const trimmedReason = reason.trim();
    if (!trimmedReason) return alert("Reason is required");

    const cleaned = rows
      .map((r) => ({
        recipientId: String(r.recipientId || ""),
        points: Number(r.points),
      }))
      .filter((r) => r.recipientId);

    if (cleaned.length === 0) return alert("Add at least one recipient");

    for (const r of cleaned) {
      if (!Number.isFinite(r.points)) return alert("Points must be a number");
      if (r.points <= 0) return alert("Points must be greater than 0");
    }

    try {
      setSubmitting(true);

      const token = localStorage.getItem("token");
      const url = `${process.env.REACT_APP_API_URL}/api/point-requests`;

      const results = await Promise.allSettled(
        cleaned.map((r) =>
          fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              recipientUserId: Number(r.recipientId),
              points: r.points,
              reason: trimmedReason,
            }),
          }).then(async (res) => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error || "Failed to submit point request");
            }
            return true;
          })
        )
      );

      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length) {
        alert(
          `Some requests failed (${failed.length}). Check selections/points and try again.`
        );
        return;
      }

      setRows([makeRow()]);
      setReason("");
      onClose();
      alert(`Submitted ${cleaned.length} point request(s) for approval!`);
    } catch (err) {
      console.log(err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60" onMouseDown={onClose} />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-2xl mx-4 rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header stays fixed */}
            <div className="p-6 pb-3 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Give Points</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <form
              onSubmit={submit}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
                {/* Rows */}
                <div className="space-y-3">
                  {rows.map((row, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                    >
                      <div className="sm:col-span-7">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Recipient {rows.length > 1 ? `#${idx + 1}` : ""}
                        </label>
                        <Select
                          options={optionsForRow(idx)}
                          value={
                            row.recipientId
                              ? recipientOptions.find(
                                  (o) => o.value === String(row.recipientId)
                                ) || null
                              : null
                          }
                          onChange={(opt) =>
                            updateRow(idx, { recipientId: opt?.value ?? "" })
                          }
                          placeholder="Search member..."
                          menuPortalTarget={document.body}
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Points
                        </label>
                        <input
                          value={row.points}
                          onChange={(e) =>
                            updateRow(idx, { points: e.target.value })
                          }
                          type="number"
                          step="1"
                          min="1"
                          className="w-full rounded-lg border px-3 py-2"
                          placeholder="e.g. 5"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        {/* ✅ No remove button on the first entry */}
                        {idx !== 0 ? (
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            className="w-full px-3 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
                            disabled={submitting}
                            title="Remove"
                          >
                            Remove
                          </button>
                        ) : (
                          <div className="h-[42px]" /> // keeps alignment
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addRow}
                    className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                    disabled={submitting}
                  >
                    + Add another member
                  </button>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason (applies to all)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                    rows={3}
                    placeholder="Why are you giving these points?"
                  />
                </div>
              </div>

              {/* Footer stays fixed */}
              <div className="p-6 pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Request(s)"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
