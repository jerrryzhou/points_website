export default function Navbar() {
  return (
    <nav className="bg-emerald-50 border-b border-emerald-100 px-6 py-3 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <span className="text-green-800 font-semibold text-2xl">ΔΣΦ</span>
      </div>

      {/* Links */}
      <div className="hidden md:flex space-x-6">
        <a href="#" className="text-green-900 hover:text-green-700 font-medium">
          Dashboard
        </a>
        <a href="#" className="text-green-900 hover:text-green-700 font-medium">
          Events
        </a>
        <a href="#" className="text-green-900 hover:text-green-700 font-medium">
          Fines
        </a>
        <a href="#" className="text-green-900 hover:text-green-700 font-medium">
          Leaderboard
        </a>
      </div>

      {/* Profile Icon */}
      <div className="flex items-center space-x-2">
        
      </div>
    </nav>
  );
}