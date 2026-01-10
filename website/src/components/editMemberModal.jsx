import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion"

export default function EditMemberModal({ open, user, onClose, onDelete, onSave }) {
  const [position, setPosition] = useState("member");
  const [points, setPoints] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setPosition(user.position || "member");
      setPoints(Number(user.points ?? 0));
    }
  }, [user]);

  if (!open || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        position,
        points: Number(points),
      });
      onClose();
    } finally {
      setSaving(false);
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
        {/* Backdrop (ONLY backdrop) */}
        <div
          className="absolute inset-0 bg-black/60"
          onMouseDown={saving ? undefined : onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-lg mx-4 rounded-2xl bg-white shadow-xl"
          onMouseDown={(e) => e.stopPropagation()} // prevent backdrop close when clicking modal
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Edit Member</h3>
            <p className="text-sm text-gray-500">
              Update role and points for this member.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Read-only info */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2 text-gray-800">
                  {user.full_name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2 text-gray-800">
                  {user.email}
                </div>
              </div>
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="member">member</option>
                  <option value="position-holder">position holder</option>
                  <option value="admin">admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Points
                </label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm("Are you sure you want to delete this member?")
                  ) {
                    onDelete(user);
                    onClose();
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
}
