import { useState } from "react";

export default function SuggestionBox() {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // "success" | "error" | null

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/suggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ body: text.trim() }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setText("");
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg">
      <h2 className="text-2xl font-semibold text-white mb-1">Suggestion Box</h2>
      <p className="text-gray-300 text-sm mb-4">
        Share anything anonymously 🥷
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setStatus(null);
          }}
          maxLength={2000}
          rows={3}
          placeholder="Type your suggestion..."
          className="w-full rounded-lg border-none px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-sm">
            {status === "success" && (
              <span className="text-green-300">Thanks! Your suggestion was submitted.</span>
            )}
            {status === "error" && (
              <span className="text-red-300">Something went wrong. Please try again.</span>
            )}
          </span>
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
