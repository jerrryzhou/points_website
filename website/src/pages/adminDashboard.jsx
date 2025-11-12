import AdminNavbar from "../components/adminNavabar";

export default function AdminDashboard() {
    return (
        <div className="min-h-screen bg-green-600 text-gray-800">
            <AdminNavbar/>
            <div className="flex flex-col items-center justify-center mt-20">
                <h1 className="text-5xl font-bold text-white mb-6">
                 Brother Name
                </h1>
                <h2 className="text-4xl font-bold text-white"> Points </h2>
            </div>
            <div className="max-w-4xl mx-auto mt-10 bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg">
  <h2 className="text-2xl font-semibold text-white mb-4">Points History</h2>

  <ul className="divide-y divide-gray-700">
    <li className="py-3 flex justify-between">
      <span className="text-gray-200">Attended Chapter Meeting</span>
      <span className="text-gray-200 text-sm">Nov 3, 2025</span>
    </li>
    <li className="py-3 flex justify-between">
      <span className="text-gray-200">Volunteered: Community Cleanup</span>
      <span className="text-gray-200 text-sm">Oct 28, 2025</span>
    </li>
    <li className="py-3 flex justify-between">
      <span className="text-gray-200">Paid Membership Dues</span>
      <span className="text-gray-200 text-sm">Oct 20, 2025</span>
    </li>
  </ul>
</div>
        </div>
    );
}