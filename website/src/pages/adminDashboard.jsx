import AdminNavbar from "../components/adminNavabar";
import { useState, useEffect } from "react"
import GivePointsModal from "../components/pointRequestModal";
// import { isJwtExpired } from "../utils/jwt";

export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [openGivePoints, setOpenGivePoints] = useState(false);
  const [members, setMembers] = useState([]);
  const [history, setHistory] = useState([]);


  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/get-approved-users`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then(setMembers)
      .catch(console.error);
  }, []);

  useEffect(() => {
  fetch(`${process.env.REACT_APP_API_URL}/api/me/point-requests`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  })
    .then(async (r) => {
      if (!r.ok) {
        // token expired / unauthorized / server error
        return [];
      }
      const data = await r.json();
      return Array.isArray(data) ? data : [];
    })
    .then((safeHistory) => {
      setHistory(safeHistory);
    })
    .catch((err) => {
      console.error(err);
      setHistory([]);
    });
}, []);

function StatusBadge({ status }) {
  const styles =
    status === "approved"
      ? "bg-green-500/20 text-green-100 border-green-400/30"
      : status === "pending"
      ? "bg-yellow-500/20 text-yellow-100 border-yellow-400/30"
      : "bg-red-500/20 text-red-100 border-red-400/30";

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${styles}`}>
      {status}
    </span>
  );
}

    return (
        <div className="min-h-screen bg-green-600 text-gray-800">
            <AdminNavbar/>
            <div className="flex flex-col items-center justify-center mt-20">
                <h1 className="text-5xl font-bold text-white mb-6">
                 {user ? user.full_name : "Brother name"}
                </h1>
                <h2 className="text-4xl font-bold text-white"> {user ? user.points : 0} Points </h2>
            </div>
            <div className="max-w-4xl mx-auto mt-10 bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg">
              {/* <h2 className="text-2xl font-semibold text-white mb-4">Points History</h2> */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-white">
                  Points History
                </h2>

                  <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium" onClick={() => setOpenGivePoints(true)}>
                    Give Points
                  </button>
                
              </div>
              
              <ul className="divide-y divide-gray-700">
                {Array.isArray(history) && history.map((h) => (
                  <li key={h.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-200 font-medium truncate">{h.reason}</span>

                        <StatusBadge status={h.status} />
                      </div>

                      <div className="text-gray-300 text-sm">
                        From: {h.giver_name}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-gray-200 font-semibold">
                        {h.points > 0 ? `+${h.points}` : h.points}
                      </div>
                      <div className="text-gray-200 text-sm">
                        {new Date(h.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                ))}

                {history.length === 0 && (
                  <li className="py-3 text-gray-200 text-sm">No point history yet.</li>
                )}
              </ul>
            </div>
            <GivePointsModal
              open={openGivePoints}
              onClose={() => setOpenGivePoints(false)}
              members={members}
              giverId={user?.id}
            />
        </div>
    );
}