import React, {useState, useMemo} from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from "react-select"

export default function Registration() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [pledgePre, setPledgePre] = useState(null);
  const [pledgePost, setPledgePost] = useState(null);
  // console.log(process.env.REACT_APP_API_URL)

  const greekAlphabetOptions = useMemo(
    () => [
      { value: "Alpha", label: "Alpha (Α)" },
      { value: "Beta", label: "Beta (Β)" },
      { value: "Gamma", label: "Gamma (Γ)" },
      { value: "Delta", label: "Delta (Δ)" },
      { value: "Epsilon", label: "Epsilon (Ε)" },
      { value: "Zeta", label: "Zeta (Ζ)" },
      { value: "Eta", label: "Eta (Η)" },
      { value: "Theta", label: "Theta (Θ)" },
      { value: "Iota", label: "Iota (Ι)" },
      { value: "Kappa", label: "Kappa (Κ)" },
      { value: "Lambda", label: "Lambda (Λ)" },
      { value: "Mu", label: "Mu (Μ)" },
      { value: "Nu", label: "Nu (Ν)" },
      { value: "Xi", label: "Xi (Ξ)" },
      { value: "Omicron", label: "Omicron (Ο)" },
      { value: "Pi", label: "Pi (Π)" },
      { value: "Rho", label: "Rho (Ρ)" },
      { value: "Sigma", label: "Sigma (Σ)" },
      { value: "Tau", label: "Tau (Τ)" },
      { value: "Upsilon", label: "Upsilon (Υ)" },
      { value: "Phi", label: "Phi (Φ)" },
      { value: "Chi", label: "Chi (Χ)" },
      { value: "Psi", label: "Psi (Ψ)" },
      { value: "Omega", label: "Omega (Ω)" },
    ],
    []
  );

  const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderRadius: "0.75rem",          // rounded-lg
    border: "none",
    minHeight: "20px",
    boxShadow: state.isFocused
      ? "0 0 0 2px rgba(52,211,153,0.5)" // emerald focus ring
      : "none",
    "&:hover": { border: "none" },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0.5rem",               // p-3
  }),
  input: (base) => ({
    ...base,
    color: "#f3f4f6",                 // text-gray-100
  }),
  singleValue: (base) => ({
    ...base,
    color: "#f3f4f6",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#9ca3af",                 // placeholder-gray-400
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "rgba(15, 23, 42, 0.95)", // slate-900
    // borderRadius: "0.75rem",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused
      ? "rgba(16,185,129,0.3)"         // emerald hover
      : "transparent",
    color: "#f3f4f6",
    cursor: "pointer",
  }),
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      // Create popup message
      setMessage("Passwords do not match");
      toast.error("Passwords do not match")
      return;
    }
    if (!pledgePre || !pledgePost) {
      toast.error("Please select your pledge class.");
      setMessage("Please select your pledge class.");
      return;
    }
    if (email.trim().length === 0) {
      toast.error("Please enter an email");
      setMessage("Please enter an email");
      return;
    }
    const pledgeClass = `${pledgePre.value} ${pledgePost.value}`;
    
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          password,
          pledge_class: pledgeClass,
        }),
      });
      const data = await res.json();
      console.log("Status:", res.status, "OK:", res.ok);
      if (res.ok) {
        console.log("success");
        setMessage("Account created! Pending admin approval.");
        toast.success(message)
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        navigate("/login");
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
          {/* Pledge Class */}
          <div>
            <label className="block text-gray-200 mb-1">Pledge Class</label>
            <div className="grid grid-cols-2 gap-3">
            <Select
                value={pledgePre}
                onChange={setPledgePre}
                options={greekAlphabetOptions}
                placeholder="Letter"
                styles={selectStyles}
                classNamePrefix="react-select"
              />
              <Select
                value={pledgePost}
                onChange={setPledgePost}
                options={greekAlphabetOptions}
                placeholder="Letter"
                styles={selectStyles}
                classNamePrefix="react-select"
              />
              </div>
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