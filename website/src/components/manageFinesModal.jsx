import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";

export default function ManageFinesModal({ open, onClose, members }) {
  const [tab, setTab] = useState("give");

  // Give tab state
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  // Alleviate tab state
  const [alleviateMemberId, setAlleviateMemberId] = useState("");
  const [membersWithFines, setMembersWithFines] = useState([]);
  const [memberFines, setMemberFines] = useState([]);
  const [selectedFine, setSelectedFine] = useState(null);
  const [alleviationAmount, setAlleviationAmount] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setTab("give");
      setMemberId("");
      setAmount("");
      setReason("");
      setAlleviateMemberId("");
      setMembersWithFines([]);
      setMemberFines([]);
      setSelectedFine(null);
      setAlleviationAmount("");
    }
  }, [open]);

  useEffect(() => {
    if (!open || tab !== "alleviate") return;
    fetch(`${process.env.REACT_APP_API_URL}/api/fines/members-with-fines`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then(setMembersWithFines)
      .catch(console.error);
  }, [open, tab]);

  useEffect(() => {
    if (!alleviateMemberId) {
      setMemberFines([]);
      setSelectedFine(null);
      return;
    }
    fetch(
      `${process.env.REACT_APP_API_URL}/api/fines?member_id=${alleviateMemberId}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    )
      .then((r) => r.json())
      .then(setMemberFines)
      .catch(console.error);
  }, [alleviateMemberId]);

  const handleGive = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/fines`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          member_id: Number(memberId),
          amount: Number(amount),
          reason: reason.trim(),
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to issue fine");
      }
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAlleviate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/fines/${selectedFine.id}/alleviate`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ alleviation_amount: Number(alleviationAmount) }),
        }
      );
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to alleviate fine");
      }
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const memberOptions = useMemo(
    () => (members || []).map((m) => ({ value: String(m.id), label: m.full_name })),
    [members]
  );

  const membersWithFinesOptions = useMemo(
    () => membersWithFines.map((m) => ({ value: String(m.id), label: m.full_name })),
    [membersWithFines]
  );

  const selectStyles = {
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/60"
            onMouseDown={saving ? undefined : onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-lg mx-4 rounded-2xl bg-white shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Manage Fines</h3>
              <div className="flex gap-4 mt-3">
                {["give", "alleviate"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`text-sm font-medium pb-1 border-b-2 capitalize ${
                      tab === t
                        ? "border-green-600 text-green-700"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {t === "give" ? "Give Fine" : "Alleviate Fine"}
                  </button>
                ))}
              </div>
            </div>

            {/* Give Fine */}
            {tab === "give" && (
              <form onSubmit={handleGive} className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Member</label>
                  <div className="mt-1">
                    <Select
                      options={memberOptions}
                      value={memberOptions.find((o) => o.value === String(memberId)) || null}
                      onChange={(opt) => setMemberId(opt?.value ?? "")}
                      placeholder="Search member..."
                      menuPortalTarget={document.body}
                      styles={selectStyles}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reason</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
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
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Issue Fine"}
                  </button>
                </div>
              </form>
            )}

            {/* Alleviate Fine */}
            {tab === "alleviate" && (
              <form onSubmit={handleAlleviate} className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Member</label>
                  <div className="mt-1">
                    <Select
                      options={membersWithFinesOptions}
                      value={membersWithFinesOptions.find((o) => o.value === String(alleviateMemberId)) || null}
                      onChange={(opt) => {
                        setAlleviateMemberId(opt?.value ?? "");
                        setSelectedFine(null);
                        setAlleviationAmount("");
                      }}
                      placeholder="Search member..."
                      menuPortalTarget={document.body}
                      styles={selectStyles}
                    />
                  </div>
                </div>

                {alleviateMemberId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Outstanding Fines
                    </label>
                    {memberFines.length === 0 ? (
                      <p className="text-sm text-gray-500">No outstanding fines.</p>
                    ) : (
                      <ul className="divide-y rounded-lg border overflow-hidden">
                        {memberFines.map((f) => (
                          <li
                            key={f.id}
                            onClick={() => {
                              setSelectedFine(f);
                              setAlleviationAmount("");
                            }}
                            className={`px-3 py-2 cursor-pointer text-sm ${
                              selectedFine?.id === f.id
                                ? "bg-green-50 border-l-4 border-green-600"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <span className="font-medium">
                              ${f.amount - f.alleviation_amount} outstanding
                            </span>
                            <span className="text-gray-500 ml-2">— {f.reason}</span>
                            <span className="text-gray-400 ml-2 text-xs">
                              {new Date(f.created_at).toLocaleDateString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {selectedFine && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Alleviation Amount
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedFine.amount - selectedFine.alleviation_amount}
                      value={alleviationAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const max = selectedFine.amount - selectedFine.alleviation_amount;
                        if (val <= max) setAlleviationAmount(e.target.value);
                      }}
                      required
                      className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Max: ${selectedFine.amount - selectedFine.alleviation_amount} outstanding
                    </p>
                  </div>
                )}

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
                    type="submit"
                    disabled={saving || !selectedFine || !alleviationAmount}
                    className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Alleviate"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
