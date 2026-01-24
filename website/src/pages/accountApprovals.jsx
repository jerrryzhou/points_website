import AdminNavbar from "../components/adminNavabar";
import  { useEffect, useState } from "react"

export default function AccountApprovals() {
    const [pendingUsers, setPendingUsers] = useState([]);

    useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/unapproved-users`)
      .then((res) => res.json())
      .then((data) => setPendingUsers(data))
      .catch((err) => console.error("Error loading users:", err));
  }, []);

  const approveUser = async (id) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/approve-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      setPendingUsers(pendingUsers.filter((u) => u.id !== id));
    }
  };

  const denyUser = async (id) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/deny-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      setPendingUsers(pendingUsers.filter((u) => u.id !== id));
      console.log("denied");
    }
  };

    return (
        <div className="min-h-screen bg-green-700 text-gray-800">
            <AdminNavbar/>
            <h1 className="max-w-4xl mx-auto px-4 text-3xl font-bold text-white mt-10 mb-6">Pending Approvals</h1>

    <div className="max-w-4xl mx-auto bg-white/20 backdrop-blur-lg p-4 rounded-xl shadow-lg">
      {pendingUsers.length === 0 ? (
        <p className="text-white text-lg">No users pending approval.</p>
      ) : (
        pendingUsers.map((user) => (
          <div
            key={user.id}
            className="flex justify-between items-center bg-white/10 p-4 rounded-lg mb-3"
          >
            <div>
              <p className="text-xl font-semibold text-white">{user.full_name}</p>
              <p className="text-gray-200">{user.email}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => approveUser(user.id)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg"
              >
                Approve
              </button>

              <button
                onClick={() => denyUser(user.id)}
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