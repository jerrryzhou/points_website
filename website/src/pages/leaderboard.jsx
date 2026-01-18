import AppNavbar from "../components/selector";
import { useEffect, useState } from "react";

export default function Leaderboard() {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/leaderboard`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setMembers([]);
      });
  }, []);

  return (
    <div className="min-h-screen bg-green-700 text-gray-800">
      <AppNavbar />

      <div className="max-w-4xl mx-auto mt-10 px-4">
        <h1 className="text-3xl font-bold text-white mb-4">Leaderboard</h1>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 shadow-lg">
          <ul className="divide-y divide-gray-700">
            {members.map((m, idx) => (
              <li key={m.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 text-white font-bold">{idx + 1}</span>
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{m.full_name}</p>
                    <p className="text-gray-200 text-sm">{m.position}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-white font-bold text-lg">{m.points ?? 0}</p>
                  <p className="text-gray-200 text-sm">points</p>
                </div>
              </li>
            ))}
          </ul>

          {members.length === 0 && (
            <p className="text-white text-sm">No members found.</p>
          )}
        </div>
      </div>
    </div>
  );
}