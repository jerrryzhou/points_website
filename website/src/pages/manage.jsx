import AdminNavbar from "../components/adminNavabar";
import MembersTable from "../components/table";
import EditMemberModal from "../components/editMemberModal";
import { useState, useEffect } from "react"

export default function Manage() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    
        useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/get-approved-users`)
          .then((res) => res.json())
          .then((data) => setUsers(data))
          .catch((err) => console.error("Error loading users:", err));
      }, []);

    const handleEditUser = (user) => {
        setSelectedUser(user);
    };
    
    const handleClose = () => setSelectedUser(null);

    const handleSave = async (updates) => {
        // TEMP: update UI locally until you add the backend PATCH route
        setUsers((prev) =>
        prev.map((u) =>
            u.email === selectedUser.email ? { ...u, ...updates } : u
        )
        );

        // When your backend is ready, replace the above with a PATCH call.
    };
    // Add delete button, error handling for point inputs, roles, add error checking for blank names in registration
    return (
        <div className="min-h-screen bg-green-600 text-gray-800">
            <AdminNavbar/>
            <div className="max-w-6xl mx-auto mt-10 px-4">
                <MembersTable users={users} onEdit={handleEditUser} />
            </div>
            <EditMemberModal
                open={!!selectedUser}
                user={selectedUser}
                onClose={handleClose}
                onSave={handleSave}
            />
        </div>
        );
}