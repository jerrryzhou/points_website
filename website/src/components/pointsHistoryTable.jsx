import { useEffect, useMemo, useState } from "react";

export default function PointsHistoryTable({
  requests = [],
  pageSize = 10,
  onUpdatePoints, // async (requestId, newPoints) => void
}) {
  const [page, setPage] = useState(1);


  const totalPages = Math.max(1, Math.ceil(requests.length / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const pagedRequests = useMemo(() => {
    const start = (page - 1) * pageSize;
    return requests.slice(start, start + pageSize);
  }, [requests, page, pageSize]);

  const startRow = requests.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow = Math.min(page * pageSize, requests.length);

  function StatusBadge({ status }) {
  const styles =
    status === "approved"
      ? "bg-green-500/20 text-green-100 border-green-400/30"
      : status === "pending"
      ? "bg-yellow-500/20 text-yellow-800 border-yellow-400/30"
      : "bg-red-500/20 text-red-100 border-red-400/30";

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${styles}`}>
      {status}
    </span>
  );
}


  return (
    <div className="space-y-3">
      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Given By
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Given To
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Points
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Status
              </th>
              
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {pagedRequests.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                    {r.giver_name || "You"}
                </td>

                <td className="px-6 py-4 text-gray-900">
                    {r.recipient_name || "—"}
                </td>

                <td className="px-6 py-4 text-gray-600 max-w-[520px]">
                    <div className="truncate" title={r.reason || ""}>
                    {r.reason || "—"}
                    </div>
                </td>

                <td className="px-6 py-4 text-gray-900 font-semibold">
                    {r.points}
                </td>

                <td className="px-6 py-4 text-gray-700">
                    {<StatusBadge status={r.status} />}
                </td>
                </tr>
            ))}

            {requests.length === 0 && (
                <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-gray-500">
                    No points given yet.
                </td>
                </tr>
            )}
            </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow px-4 py-3">
        <div className="text-sm text-gray-600">
          Showing <span className="font-semibold">{startRow}</span>–
          <span className="font-semibold">{endRow}</span> of{" "}
          <span className="font-semibold">{requests.length}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
          >
            First
          </button>

          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
          >
            Prev
          </button>

          <span className="text-sm text-gray-700">
            Page <span className="font-semibold">{page}</span> of{" "}
            <span className="font-semibold">{totalPages}</span>
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
          >
            Next
          </button>

          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}