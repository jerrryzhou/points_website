import React, {useState} from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Registration() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  // console.log(process.env.REACT_APP_API_URL)

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      // Create popup message
      setMessage("Passwords do not match");
      toast.error("Passwords do not match")
      return;
    }
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          password,
        }),
      });
      const data = await res.json();
      console.log("Status:", res.status, "OK:", res.ok);
      if (res.ok) {
        console.log("success");
        toast.success("Account created! Tell your VPI to approve your account.")
        setMessage("Account created! Pending admin approval.");
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Registration failed")
        setMessage(`${data.error || "Registration failed"}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong")
      setMessage("Server error. Try again later.");
    }
    
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-emerald-800 to-gray-400 flex items-center justify-center p-6">
      <div className="absolute top-6 left-8 flex flex-col">
        <h1 className="text-5xl font-bold text-white tracking-wide">ΔΣΦ</h1>
        <h2 className="text-lg text-emerald-100 mt-1">ΔΔ</h2>
      </div>
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg w-full max-w-md p-8">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center text-emerald-200 mb-6">
          Register
        </h1>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-200 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full p-3 rounded-lg bg-white/20 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              onChange={(e) => setFirstName(e.target.value)}
              value={ firstName }
            />
          </div>

          <div>
            <label className="block text-gray-200 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="john@fraternity.org"
              className="w-full p-3 rounded-lg bg-white/20 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              onChange={(e) => setEmail(e.target.value)}
              value = { email }
            />
          </div>

          <div>
            <label className="block text-gray-200 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-3 rounded-lg bg-white/20 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              onChange={(e) => setPassword(e.target.value)}
              value = {password}
            />
          </div>

          <div>
            <label className="block text-gray-200 mb-1">Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-3 rounded-lg bg-white/20 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              onChange={(e) => setConfirmPassword(e.target.value)}
              value = {confirmPassword}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg shadow-md transition"
          >
            Register
          </button>
        </form>

        {/* Footer */}
        <p className="text-gray-400 text-sm text-center mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-emerald-300 hover:text-emerald-200">
            Sign in
          </a>
        </p>
      </div>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}