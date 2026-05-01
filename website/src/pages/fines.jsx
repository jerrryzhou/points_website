import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/navbar";
import AdminNavbar from "../components/adminNavabar";

export default function Fines() {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/me/fines`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then((data) => setFines(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalOutstanding = fines.reduce(
    (sum, f) => sum + (f.amount - f.alleviation_amount),
    0
  );

  return (
    <div className="min-h-screen bg-green-700 text-gray-800">
      {user?.position === "admin" ? <AdminNavbar /> : <Navbar />}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="max-w-4xl mx-auto mt-10 px-4 space-y-6">
          {/* Outstanding summary */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg">
            <p className="text-white/70 text-sm font-medium uppercase tracking-wide">
              Total Outstanding
            </p>
            <p className="text-5xl font-bold text-white mt-1">${totalOutstanding}</p>
          </div>

          {/* Fines list */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-white mb-4">Fine History</h2>
            <ul className="divide-y divide-gray-700">
              {loading && (
                <li className="py-3 text-gray-200 text-sm">Loading...</li>
              )}
              {!loading && fines.length === 0 && (
                <li className="py-3 text-gray-200 text-sm">No fines on record.</li>
              )}
              {fines.map((f) => {
                const outstanding = f.amount - f.alleviation_amount;
                return (
                  <li key={f.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-gray-200 font-medium truncate">{f.reason}</span>
                      <div className="text-gray-300 text-sm mt-0.5">
                        {new Date(f.created_at).toLocaleDateString()}
                      </div>
                      {f.alleviation_amount > 0 && (
                        <div className="text-gray-400 text-sm">
                          Alleviated ${f.alleviation_amount}
                          {f.alleviation_date && (
                            <span> · {new Date(f.alleviation_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-gray-200 font-semibold">${f.amount}</div>
                      <div className={`text-sm font-medium ${outstanding === 0 ? "text-green-400" : "text-red-400"}`}>
                        {outstanding === 0 ? "Cleared" : `$${outstanding} outstanding`}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
