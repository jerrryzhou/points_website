import { useMemo, useState } from "react";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";

export default function GivePointsModal({ open, onClose, members, giverId }) {
  const [recipientId, setRecipientId] = useState("");
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const recipientOptions = useMemo(() => {
    return (members || []).filter((m) => String(m.id) !== String(giverId));
  }, [members, giverId]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    const pts = Number(points);
    if (!recipientId) return alert("Choose a recipient");
    if (!Number.isFinite(pts)) return alert("Points must be a number");
    if (!reason.trim()) return alert("Reason is required");

    try {
      setSubmitting(true);
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/point-requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            recipientUserId: Number(recipientId),
            points: pts,
            reason: reason.trim(),
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to submit point request");
      }

      setRecipientId("");
      setPoints("");
      setReason("");
      onClose();
      alert("Point request submitted for approval!");
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
          {/* Backdrop (ONLY thing that closes) */}
          <div className="absolute inset-0 bg-black/60" onMouseDown={onClose} />

          {/* Modal (stops outside-close) */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-lg mx-4 rounded-xl bg-white p-6 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Give Points</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient
                </label>
                <Select
                  options={recipientOptions.map((m) => ({
                    value: m.id,
                    label: m.full_name,
                  }))}
                  onChange={(opt) => setRecipientId(opt?.value ?? "")}
                  placeholder="Search member..."
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points
                </label>
                <input
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  type="number"
                  step="1"
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="e.g. 5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2"
                  rows={3}
                  placeholder="Why are you giving these points?"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}