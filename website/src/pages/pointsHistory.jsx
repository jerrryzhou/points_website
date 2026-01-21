import AdminNavbar from "../components/adminNavabar";
import ApprovedPointRequestsTable from "../components/pointsTable";
import { useEffect, useMemo, useState } from "react";

export default function PointsHistory() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("")

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

   // Normalize -> filter by recipient -> sort most recent
  const tableRequests = useMemo(() => {
    const q = search.trim().toLowerCase();

    const normalized = requests.map((r) => ({
      ...r,
      given_by_name: r.giver_name,
      given_to_name: r.recipient_name,
      // keep your table happy
      approved_at: r.reviewed_at ?? r.approved_at ?? r.created_at,
    }));

    const filtered =
      q.length === 0
        ? normalized
        : normalized.filter((r) =>
            (r.given_to_name || "").toLowerCase().includes(q)
          );

    // Sort by most recent (DESC)
    filtered.sort((a, b) => {
      const aTime = new Date(a.approved_at || a.created_at).getTime();
      const bTime = new Date(b.approved_at || b.created_at).getTime();
      return bTime - aTime;
    });

    return filtered;
  }, [requests, search]);

  const onUpdatePoints = async (requestId, newPoints) => {
  const res = await fetch(
    `${process.env.REACT_APP_API_URL}/api/point-requests/${requestId}/points`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ points: newPoints }),
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || "Failed to update points");
  }

  // re-fetch approved list (or optimistically update)
  await fetchApprovedRequests();
};

  return (
    <div className="min-h-screen bg-green-700 text-gray-800">
      <AdminNavbar />

      <div className="max-w-6xl mx-auto mt-10 px-4 space-y-4">
        <div className="bg-white rounded-xl shadow p-4">
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      {/* Left side: title */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Approved Point Requests
        </h1>
        <p className="text-sm text-gray-600">
          History of approved point requests.
        </p>
      </div>

      {/* Right side: search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email..."
        className="w-full sm:w-72 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
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
            requests={tableRequests}
            pageSize={10}
            onUpdatePoints={onUpdatePoints}
          />
        )}
      </div>
    </div>
  );
}