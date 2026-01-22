import Navbar from "../components/navbar";
import PointsHistoryTable from "../components/pointsHistoryTable";
import { useEffect, useMemo, useState } from "react";

export default function PointsGiven() {
  const [pointsGiven, setPointsGiven] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    fetch(`${process.env.REACT_APP_API_URL}/api/me/point-given`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "Failed to fetch points given");
        }
        return res.json();
      })
      .then((data) => {
        setPointsGiven(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Failed to load points given");
        setLoading(false);
      });
  }, []);

  // Normalize data to match what PointsHistoryTable renders + filter + sort
  const tableRequests = useMemo(() => {
    const q = search.trim().toLowerCase();

    const normalized = pointsGiven.map((r) => ({
      ...r,
      // what your table displays:
      given_by_name: r.giver_name ?? "You",
      given_to_name: r.recipient_name ?? r.recipient_email ?? "—",
      // date field your table might use elsewhere
      approved_at: r.reviewed_at ?? r.created_at,
    }));

    const filtered =
      q.length === 0
        ? normalized
        : normalized.filter((r) => {
            const to = (r.given_to_name || "").toLowerCase();
            const by = (r.given_by_name || "").toLowerCase();
            const reason = (r.reason || "").toLowerCase();
            return to.includes(q) || by.includes(q) || reason.includes(q);
          });

    filtered.sort((a, b) => {
      const aTime = new Date(a.approved_at || a.created_at).getTime();
      const bTime = new Date(b.approved_at || b.created_at).getTime();
      return bTime - aTime;
    });

    return filtered;
  }, [pointsGiven, search]);

  return (
    <div className="min-h-screen bg-green-700 text-gray-800">
      <Navbar />

      <div className="max-w-6xl mx-auto mt-10 px-4 space-y-4">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Points Given</h1>
              <p className="text-sm text-gray-600">
                History of point requests you&apos;ve given.
              </p>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by recipient, giver, or reason..."
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
            Loading points given…
          </div>
        ) : (
          <PointsHistoryTable requests={tableRequests} pageSize={10} />
        )}
      </div>
    </div>
  );
}
