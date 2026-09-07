import AdminNavbar from "../components/adminNavabar";
import { useState, useEffect } from "react"
import GivePointsModal from "../components/pointRequestModal";
import SuggestionBox from "../components/suggestionBox";
// import { isJwtExpired } from "../utils/jwt";
import { motion } from "framer-motion"

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [openGivePoints, setOpenGivePoints] = useState(false);
  const [members, setMembers] = useState([]);
  const [history, setHistory] = useState([]);
  const [events, setEvents] = useState([]);
  const [finesTotal, setFinesTotal] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsStatus, setSuggestionsStatus] = useState("new");
  const [suggestionsHasMore, setSuggestionsHasMore] = useState(false);
  const SUGGESTIONS_PAGE_SIZE = 50;

  useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) return;

  fetch(`${process.env.REACT_APP_API_URL}/api/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Not authenticated");
      return res.json();
    })
    .then(setUser)
    .catch((err) => {
      console.error(err);
      // optional: force logout
      localStorage.removeItem("token");
    });
},[]);


  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/get-approved-users`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then(setMembers)
      .catch(console.error);
  }, []);

  useEffect(() => {
    const now = new Date();
    const later = new Date();
    later.setDate(later.getDate() + 30);
    fetch(
      `${process.env.REACT_APP_API_URL}/api/events?start=${encodeURIComponent(now.toISOString())}&end=${encodeURIComponent(later.toISOString())}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    )
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/me/fines`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFinesTotal(data.reduce((sum, f) => sum + (f.amount - f.alleviation_amount), 0));
        }
      })
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

  const fetchSuggestions = (status, offset, append) => {
    fetch(
      `${process.env.REACT_APP_API_URL}/api/suggestions?status=${status}&limit=${SUGGESTIONS_PAGE_SIZE}&offset=${offset}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    )
      .then((r) => r.json())
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        setSuggestions((prev) => (append ? [...prev, ...rows] : rows));
        setSuggestionsHasMore(rows.length === SUGGESTIONS_PAGE_SIZE);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchSuggestions(suggestionsStatus, 0, false);
  }, [suggestionsStatus]);

  const archiveSuggestion = (id, status) => {
    fetch(`${process.env.REACT_APP_API_URL}/api/suggestions/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ status }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to update suggestion");
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
      })
      .catch(console.error);
  };

function StatusBadge({ status }) {
  const styles =
    status === "approved"
      ? "bg-green-500/20 text-green-800 border-green-400/30"
      : status === "pending"
      ? "bg-yellow-500/20 text-yellow-800 border-yellow-400/30"
      : "bg-red-500/20 text-red-800 border-red-400/30";

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${styles}`}>
      {status}
    </span>
  );
}

    return (
      
        <div className="min-h-screen bg-green-700 text-gray-800">
        
            <AdminNavbar/>
            <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="min-h-screen"
    >
            <div className="flex flex-col items-center justify-center mt-20">
                <h1 className="text-5xl font-bold text-white mb-6">
                 {user ? user.full_name : "\u00A0"}
                </h1>
                <h2 className="text-4xl font-bold text-white"> {user ? user.points : "\u00A0"} Points </h2>
                {finesTotal > 0 && (
                  <p className="mt-3 text-red-300 font-medium text-lg">${finesTotal} in fines due</p>
                )}
            </div>
            <div className="max-w-6xl mx-auto mt-10 flex flex-col lg:flex-row gap-6 items-start">
              {/* Points History */}
              <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-white">Points History</h2>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium" onClick={() => setOpenGivePoints(true)}>
                      Give Points
                    </button>
                  </div>
                </div>
                <ul className="divide-y divide-gray-700">
                  {Array.isArray(history) && history.map((h) => (
                    <li key={h.id} className="py-3 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="text-gray-200 font-medium break-words min-w-0 max-w-[200px] sm:max-w-xs">{h.reason}</span>
                          <StatusBadge status={h.status} />
                        </div>
                        <div className="text-gray-300 text-sm">From: {h.giver_name}</div>
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

              {/* Upcoming Events */}
              <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg">
                  <h2 className="text-2xl font-semibold text-white mb-4">Upcoming Events</h2>
                  <ul className="space-y-3">
                    {events.map((ev) => {
                      const start = new Date(ev.start_datetime);
                      return (
                        <li key={ev.id} className="flex gap-3 items-start">
                          <div
                            className="mt-1 w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: ev.color || "rgba(255,255,255,0.5)" }}
                          />
                          <div className="min-w-0">
                            <div className="text-white font-medium truncate">{ev.title}</div>
                            <div className="text-gray-300 text-sm">
                              {ev.all_day
                                ? start.toLocaleDateString(undefined, { month: "short", day: "numeric" })
                                : start.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                    {events.length === 0 && (
                      <li className="text-gray-200 text-sm">No upcoming events.</li>
                    )}
                  </ul>
                </div>
                <SuggestionBox />
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold text-white">Suggestions</h2>
                    <div className="flex gap-3 text-sm">
                      {["new", "archived"].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSuggestionsStatus(s)}
                          className={`capitalize pb-1 border-b-2 ${
                            suggestionsStatus === s
                              ? "border-white text-white"
                              : "border-transparent text-gray-300 hover:text-white"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ul className="space-y-3 max-h-80 overflow-y-auto">
                    {suggestions.map((s) => (
                      <li key={s.id} className="bg-white/5 rounded-lg p-3">
                        <p className="text-gray-100 text-sm break-words">{s.body}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-gray-400 text-xs">
                            {new Date(s.created_at).toLocaleString()}
                          </p>
                          <button
                            onClick={() =>
                              archiveSuggestion(s.id, suggestionsStatus === "new" ? "archived" : "new")
                            }
                            className="text-xs text-green-300 hover:text-green-200 font-medium"
                          >
                            {suggestionsStatus === "new" ? "Archive" : "Restore"}
                          </button>
                        </div>
                      </li>
                    ))}
                    {suggestions.length === 0 && (
                      <li className="text-gray-200 text-sm">
                        No {suggestionsStatus} suggestions.
                      </li>
                    )}
                  </ul>
                  {suggestionsHasMore && (
                    <button
                      onClick={() => fetchSuggestions(suggestionsStatus, suggestions.length, true)}
                      className="mt-3 w-full text-center text-sm text-gray-300 hover:text-white"
                    >
                      Load more
                    </button>
                  )}
                </div>
              </div>
            </div>
            <GivePointsModal
              open={openGivePoints}
              onClose={() => setOpenGivePoints(false)}
              members={members}
              giverId={user?.id}
            />
            </motion.div>
        </div>

    );
}