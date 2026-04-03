import { useEffect, useState } from "react";

function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm border border-white/10"
            type="button"
          >
            Close
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-sm text-white/80 mb-1">{label}</div>
      {children}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full rounded-xl px-3 py-2 bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/25"
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className="w-full rounded-xl px-3 py-2 min-h-[100px] bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/25"
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className="w-full rounded-xl px-3 py-2 bg-white/10 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-white/25"
    />
  );
}

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AddEventModal({
  open,
  onClose,
  defaultDate,
  onCreated,
}) {
  const [title, setTitle] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");
  const [location, setLocation] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const base = defaultDate ? new Date(defaultDate) : new Date();
    base.setHours(9, 0, 0, 0);

    const end = new Date(base);
    end.setHours(10, 0, 0, 0);

    setTitle("");
    setAllDay(false);
    setStartLocal(toLocalInputValue(base));
    setEndLocal(toLocalInputValue(end));
    setLocation("");
    setColor("#3b82f6");
    setDescription("");
    setError("");
  }, [open, defaultDate]);

  async function handleCreate() {
    setError("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    const start = new Date(startLocal);
    const end = new Date(endLocal);

    if (end <= start) {
      setError("End must be after start.");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            description: description || null,
            start_datetime: start.toISOString(),
            end_datetime: end.toISOString(),
            all_day: allDay,
            location: location || null,
            color: color || null,
          }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to create event.");
        setSaving(false);
        return;
      }

      onCreated?.(data);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Event">
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm text-white">
            {error}
          </div>
        )}

        <Field label="Title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event name"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Start">
            <Input
              type="datetime-local"
              value={startLocal}
              onChange={(e) => setStartLocal(e.target.value)}
            />
          </Field>

          <Field label="End">
            <Input
              type="datetime-local"
              value={endLocal}
              onChange={(e) => setEndLocal(e.target.value)}
            />
          </Field>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
          />
          <span className="text-sm text-white/80">All day event</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Location">
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Optional"
            />
          </Field>

          <Field label="Color">
            <Select value={color} onChange={(e) => setColor(e.target.value)}>
              <option value="#22c55e" className="text-black">Green</option>
              <option value="#3b82f6" className="text-black">Blue</option>
              <option value="#a855f7" className="text-black">Purple</option>
              <option value="#f59e0b" className="text-black">Amber</option>
              <option value="#ef4444" className="text-black">Red</option>
            </Select>
          </Field>
        </div>

        <Field label="Description">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details..."
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm border border-white/15"
            type="button"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            disabled={saving}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm disabled:opacity-60"
            type="button"
          >
            {saving ? "Creating..." : "Create Event"}
          </button>
        </div>
      </div>
    </Modal>
  );
}