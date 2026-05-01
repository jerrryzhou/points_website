import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/navbar";
import AdminNavbar from "../components/adminNavabar";
import FinesHistoryTable from "../components/finesHistoryTable";

export default function FinesList() {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchFines = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/fines/all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setFines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFines(); }, []);

  const totalOutstanding = useMemo(
    () => fines.reduce((sum, f) => sum + (f.amount - f.alleviation_amount), 0),
    [fines]
  );

  const memberSummary = useMemo(() => {
    const map = {};
    for (const f of fines) {
      const outstanding = f.amount - f.alleviation_amount;
      if (outstanding <= 0) continue;
      if (!map[f.member_name]) map[f.member_name] = 0;
      map[f.member_name] += outstanding;
    }
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [fines]);

  const handleUpdateAmount = async (fineId, newAmount) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/fines/${fineId}/amount`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ amount: newAmount }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      throw new Error(error || "Failed to update amount");
    }
    await fetchFines();
  };

  return (
    <div className="min-h-screen bg-green-700 text-gray-800">
      {user?.position === "admin" ? <AdminNavbar /> : <Navbar />}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="max-w-5xl mx-auto mt-10 px-4 space-y-6">
          {/* Total outstanding */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg">
            <p className="text-white/70 text-sm font-medium uppercase tracking-wide">
              Total Outstanding (All Members)
            </p>
            <p className="text-5xl font-bold text-white mt-1">${totalOutstanding}</p>
          </div>

          {/* Per-member summary */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-2xl font-semibold text-white">Amount Due by Member</h2>
            </div>
            {loading ? (
              <div className="p-6 text-center text-gray-300">Loading...</div>
            ) : memberSummary.length === 0 ? (
              <div className="p-6 text-center text-gray-300">No outstanding fines.</div>
            ) : (
              <table className="min-w-full divide-y divide-white/10">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Member</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-300 uppercase">Amount Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {memberSummary.map(({ name, amount }) => (
                    <tr key={name} className="hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">{name}</td>
                      <td className="px-6 py-4 text-right font-semibold text-red-400">${amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Full history */}
          <div className="space-y-2">
            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg px-6 py-4">
              <h2 className="text-2xl font-semibold text-white">Fine History</h2>
              <p className="text-sm text-gray-300">All fines across all members. Click Edit to change an amount.</p>
            </div>
            {loading ? (
              <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-6 text-center text-gray-300">Loading...</div>
            ) : (
              <FinesHistoryTable fines={fines} onUpdateAmount={handleUpdateAmount} />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
