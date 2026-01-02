import AdminNavbar from "./adminNavabar";
import Navbar from "./navbar";

export default function AppNavbar() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (user?.position === "admin") {
    return <AdminNavbar />;
  }

  return <Navbar />;
}