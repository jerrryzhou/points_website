import AdminNavbar from "../components/adminNavabar";
import MembersTable from "../components/table";
import EditMemberModal from "../components/editMemberModal";
import { useState, useMemo, useEffect } from "react"

export default function Manage() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [positionFilter, setPositionFilter] = useState("all");
    
        useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/get-approved-users`)
          .then((res) => res.json())
          .then((data) => setUsers(data))
          .catch((err) => console.error("Error loading users:", err));
      }, []);

    const handleEditUser = (user) => {
        setSelectedUser(user);
    };
    
    const filteredUsers = useMemo(() => {
        const q = searchTerm.trim().toLocaleLowerCase();
        return users.filter((u) => {
            const matchesSearch = !q || u.full_name?.toLowerCase().includes(q);

            const matchesRole = positionFilter === "all" || u.position === positionFilter;
            return matchesSearch && matchesRole;
        });

    }, [users, searchTerm, positionFilter]);
    const handleClose = () => setSelectedUser(null);

    const handleDelete = async (userToDelete) => {
        try {
            const res = await fetch(
            `${process.env.REACT_APP_API_URL}/api/members/${userToDelete.id}`,
            {
                method: "DELETE",
                headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
            );

            if (!res.ok) throw new Error("Delete failed");

            setUsers((prev) =>
            prev.filter((u) => u.email !== userToDelete.email)
            );
        } catch (err) {
            console.error(err);
            alert("Failed to delete user");
            }
        };


    const handleSave = async (updates) => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/members/${selectedUser.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify(updates),
                }
            )
             if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                console.log("SAVE ERROR BODY:", errBody);
                throw new Error(errBody.error || "Save failed");
                }


            const updatedUser = await res.json();

            setUsers((prev) =>
                prev.map((u) =>
                    u.email === updatedUser.email ? updatedUser : u
                )
            );
        } catch(err) {
            console.error(err);
            alert("Failed to save changes");
        }
    };
    // Add delete button, error handling for point inputs, roles, add error checking for blank names in registration
    return (
        <div className="min-h-screen bg-green-700 text-gray-800">
            <AdminNavbar/>
            {/* <div className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full sm:max-w-md rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />

                <select
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                    className="w-full sm:w-56 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    <option value="all">All roles</option>
                    <option value="member">member</option>
                    <option value="position-holder">position holder</option>
                    <option value="admin">admin</option>
                </select>
                </div> */}
            <div className="max-w-6xl mx-auto mt-10 px-4">
            <div className="bg-white rounded-xl shadow p-4 flex flex-col mb-3 sm:flex-row gap-3 sm:items-center sm:justify-between">
                <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full sm:max-w-md rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />

                <select
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                    className="w-full sm:w-56 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    <option value="all">All roles</option>
                    <option value="member">member</option>
                    <option value="position-holder">position holder</option>
                    <option value="admin">admin</option>
                </select>
                </div>
                <MembersTable users={filteredUsers} onEdit={handleEditUser} />
            </div>
            <EditMemberModal
                open={!!selectedUser}
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
                onSave={handleSave}
                onDelete={handleDelete}
            />
        </div>
        );
}