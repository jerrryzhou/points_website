import AdminNavbar from "../components/adminNavabar";
import { useEffect, useState } from "react";

export default function PointApprovals() {
  const [pendingRequests, setPendingRequests] = useState([]);

  const fetchPending = async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/point-requests?status=pending`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json().catch(() => []);
      setPendingRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading point requests:", err);
      setPendingRequests([]);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const approveRequest = async (id) => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/point-requests/${id}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to approve request");

      // remove from UI
      setPendingRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const denyRequest = async (id) => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/point-requests/${id}/deny`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ denyReason: "" }), // optional
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to deny request");

      // remove from UI
      setPendingRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-green-700 text-gray-800">
      <AdminNavbar />

      <h1 className="text-3xl font-bold text-white mt-3 ml-3 mb-6">
        Pending Point Approvals
      </h1>

      <div className="max-w-4xl mx-auto bg-white/20 backdrop-blur-lg p-4 rounded-xl shadow-lg">
        {pendingRequests.length === 0 ? (
          <p className="text-white text-lg">No point requests pending approval.</p>
        ) : (
          pendingRequests.map((req) => (
            <div
              key={req.id}
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white/10 p-4 rounded-lg mb-3 last:mb-0"
            >
              <div>
                <p className="text-xl font-semibold text-white">
                  {req.recipient_name}
                  <span className="text-gray-200 font-normal"> (+{req.points})</span>
                </p>

                <p className="text-gray-200">
                  From: <span className="font-medium">{req.giver_name}</span>
                </p>

                <p className="text-gray-200">
                  To: <span className="font-medium">{req.recipient_name}</span>
                </p>

                <p className="text-gray-200">
                  Reason: <span className="font-medium">{req.reason}</span>
                </p>

                <p className="text-gray-300 text-sm">
                  Submitted: {new Date(req.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => approveRequest(req.id)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg"
                >
                  Approve
                </button>

                <button
                  onClick={() => denyRequest(req.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                >
                  Deny
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}