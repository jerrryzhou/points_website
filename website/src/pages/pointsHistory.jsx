import AdminNavbar from "../components/adminNavabar";
import ApprovedPointRequestsTable from "../components/pointsTable";
import { useEffect, useMemo, useState } from "react";

export default function PointsHistory() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchApprovedRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/point-requests?status=approved`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to load approved requests");
      }

      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedRequests();
  }, []);

  // Normalize field names for the table
  const normalizedRequests = useMemo(() => {
    return requests.map((r) => ({
      ...r,
      given_by_name: r.giver_name,
      given_to_name: r.recipient_name,
      approved_at: r.reviewed_at ?? r.created_at,
    }));
  }, [requests]);

  // Placeholder — wire this to your real update endpoint
  const onUpdatePoints = async (requestId, newPoints) => {
    const prev = requests;

    // optimistic update
    setRequests((curr) =>
      curr.map((r) =>
        r.id === requestId ? { ...r, points: newPoints } : r
      )
    );

    try {
      const res = await fetch(`/api/point-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: newPoints }),
      });

      if (!res.ok) {
        throw new Error("Failed to update points");
      }

      await fetchApprovedRequests();
    } catch (err) {
      setRequests(prev);
      alert(err.message || "Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-green-700 text-gray-800">
      <AdminNavbar />

      <div className="max-w-6xl mx-auto mt-10 px-4 space-y-4">
        <div className="bg-white rounded-xl shadow p-4">
          <h1 className="text-xl font-bold text-gray-900">
            Approved Point Requests
          </h1>
          <p className="text-sm text-gray-600">
            History of approved point requests.
          </p>
        </div>

        {error && (
          <div className="bg-white rounded-xl shadow p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-600">
            Loading approved requests…
          </div>
        ) : (
          <ApprovedPointRequestsTable
            requests={normalizedRequests}
            pageSize={10}
            onUpdatePoints={onUpdatePoints}
          />
        )}
      </div>
    </div>
  );
}