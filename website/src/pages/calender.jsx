import AdminNavbar from "../components/adminNavabar";
import Navbar from "../components/navbar";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import AddEventModal from "../components/AddEventModal";

/**
 * Modern, clean Admin Calendar page (month view)
 * - Same vibe as your dashboard: green background, frosted glass card, white text
 * - Fetches events in a month range and shows them on each day
 *
 * Expected API response shape (array):
 * [
 *   {
 *     id: "uuid-or-number",
 *     title: "Event title",
 *     start_datetime: "2026-02-10T14:00:00.000Z",
 *     end_datetime: "2026-02-10T15:00:00.000Z",
 *     all_day: false,
 *     color: "#22c55e" // optional
 *   }
 * ]
 *
 * Endpoint used below:
 * GET /api/events?start=ISO&end=ISO
 */



function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function startOfWeek(d, weekStartsOnMonday = true) {
  const day = d.getDay(); // 0 Sun - 6 Sat
  const diff = weekStartsOnMonday ? (day === 0 ? -6 : 1 - day) : -day;
  const out = new Date(d);
  out.setDate(d.getDate() + diff);
  out.setHours(0, 0, 0, 0);
  return out;
}
function endOfWeek(d, weekStartsOnMonday = true) {
  const s = startOfWeek(d, weekStartsOnMonday);
  const out = new Date(s);
  out.setDate(s.getDate() + 6);
  out.setHours(23, 59, 59, 999);
  return out;
}
function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function formatMonthYear(d) {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
function formatTime(dt) {
  return dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Put event on every day it overlaps (handles multi-day events)
function expandEventsIntoDays(events) {
  const map = new Map(); // key: YYYY-MM-DD -> events[]
  for (const ev of events) {
    const start = new Date(ev.start_datetime);
    const end = new Date(ev.end_datetime);

    // normalize to midnight boundaries for day stepping
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);

    const last = new Date(end);
    last.setHours(0, 0, 0, 0);

    // If end is before start (bad data), skip safely
    if (last < cursor) continue;

    while (cursor <= last) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(cursor.getDate()).padStart(2, "0")}`;

      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);

      cursor.setDate(cursor.getDate() + 1);
    }
  }

  // Sort each day’s events: all-day first then by start time
  for (const [k, list] of map.entries()) {
    list.sort((a, b) => {
      const ad = a.all_day ? 0 : 1;
      const bd = b.all_day ? 0 : 1;
      if (ad !== bd) return ad - bd;
      return new Date(a.start_datetime) - new Date(b.start_datetime);
    });
    map.set(k, list);
  }

  return map;
}

function EventPill({ event, onClick }) {
  const start = new Date(event.start_datetime);
  const end = new Date(event.end_datetime);

  const label = event.all_day
    ? "All day"
    : `${formatTime(start)}–${formatTime(end)}`;

  const border = event.color ? event.color : "rgba(255,255,255,0.25)";
  const bg = event.color ? `${event.color}22` : "rgba(255,255,255,0.10)";

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick?.(event); }}
      className="w-full text-left rounded-lg px-2 py-1.5 border hover:bg-white/15 transition cursor-pointer"
      style={{ borderColor: border, backgroundColor: bg }}
      title={event.title}
    >
      <div className="text-xs text-gray-200/90">{label}</div>
      <div className="text-sm text-white font-medium truncate">{event.title}</div>
    </div>
  );
}

function Modal({ open, onClose, title, children, actions }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        role="button"
        tabIndex={0}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl"
        onClick={(e) => e.stopPropagation()} // ✅ IMPORTANT
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white truncate">{title}</h3>

          <div className="flex items-center gap-2">
            {actions}
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm"
              type="button"
            >
              Close
            </button>
          </div>
        </div>

        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export default function AdminCalendarPage() {
  const [anchorMonth, setAnchorMonth] = useState(() => startOfMonth(new Date()));
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [openAddEvent, setOpenAddEvent] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.position === "admin";
  const userId = user?.id;

 const canDeleteSelected =
  !!selectedEvent && !!userId && String(selectedEvent.created_by) === String(userId);

  const range = useMemo(() => {
    // For a month grid, fetch from start-of-grid week to end-of-grid week
    const monthStart = startOfMonth(anchorMonth);
    const monthEnd = endOfMonth(anchorMonth);
    const gridStart = startOfWeek(monthStart, true);
    const gridEnd = endOfWeek(monthEnd, true);
    return { gridStart, gridEnd, monthStart, monthEnd };
  }, [anchorMonth]);

  const days = useMemo(() => {
    const out = [];
    const d = new Date(range.gridStart);
    while (d <= range.gridEnd) {
      out.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }, [range.gridStart, range.gridEnd]);

  const eventsByDay = useMemo(() => expandEventsIntoDays(events), [events]);

  async function refreshEvents() {
    if (!token) return;

    const start = range.gridStart.toISOString();
    const end = range.gridEnd.toISOString();

    try {
        const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/events?start=${encodeURIComponent(
            start
        )}&end=${encodeURIComponent(end)}`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
        );

        if (!res.ok) {
        setEvents([]);
        return;
        }

        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
        console.error(err);
        setEvents([]);
    }
    }

  useEffect(() => {
  refreshEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [token, range.gridStart, range.gridEnd]);

  const today = new Date();

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const selectedDayKey = useMemo(() => {
    if (!selectedDay) return null;
    return `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(selectedDay.getDate()).padStart(2, "0")}`;
  }, [selectedDay]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDayKey) return [];
    return eventsByDay.get(selectedDayKey) || [];
  }, [eventsByDay, selectedDayKey]);

  async function handleDeleteSelectedEvent() {
    if (!token || !selectedEvent?.id) return;
    const ok = window.confirm(`Delete "${selectedEvent.title}"? This cannot be undone.`);
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/events/${selectedEvent.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Delete failed:", err);
        return;
      }

      setSelectedEvent(null);
      await refreshEvents();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-green-700 text-gray-800">
      {isAdmin ? <AdminNavbar /> : <Navbar />}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="min-h-screen"
      >
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-12">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white">
                Calendar
              </h1>
                <button type ="button" className="px-4 py-2 mt-6 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium" onClick={() => setOpenAddEvent(true)}>
                    + Add Event
                </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAnchorMonth(addMonths(anchorMonth, -1))}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-medium border border-white/15"
                type="button"
              >
                Prev
              </button>

              <button
                onClick={() => setAnchorMonth(startOfMonth(new Date()))}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-medium border border-white/15"
                type="button"
              >
                Today
              </button>

              <button
                onClick={() => setAnchorMonth(addMonths(anchorMonth, 1))}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-medium border border-white/15"
                type="button"
              >
                Next
              </button>
            </div>
          </div>

          {/* Month Card */}
          <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-lg border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-white">
                {formatMonthYear(anchorMonth)}
              </h2>

              <div className="text-sm text-white/70">
                {events.length} event{events.length === 1 ? "" : "s"} in view
              </div>
            </div>

            {/* Weekday row */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekdays.map((w) => (
                <div
                  key={w}
                  className="text-xs uppercase tracking-wide text-white/70 px-2 py-1"
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => {
                const inMonth = isSameMonth(day, anchorMonth);
                const isToday = isSameDay(day, today);

                const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(
                  2,
                  "0"
                )}-${String(day.getDate()).padStart(2, "0")}`;

                const dayEvents = eventsByDay.get(key) || [];
                const maxToShow = 3;
                const overflow = clamp(dayEvents.length - maxToShow, 0, 999);

                const isSelected = selectedDay && isSameDay(day, selectedDay);

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(day)}
                    type="button"
                    className={[
                      "group rounded-xl border p-2 sm:p-2.5 text-left transition",
                      "bg-white/5 hover:bg-white/10",
                      "border-white/10 hover:border-white/20",
                      isSelected ? "ring-2 ring-white/30" : "",
                      !inMonth ? "opacity-60" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={[
                          "text-sm font-semibold",
                          isToday ? "text-white" : "text-white/90",
                        ].join(" ")}
                      >
                        {day.getDate()}
                      </div>

                      {isToday && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 border border-white/20 text-white">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {dayEvents.slice(0, maxToShow).map((ev) => (
                        <EventPill
                          key={ev.id}
                          event={ev}
                          onClick={(e) => {
                            // prevent day button click from overriding modal selection
                            setSelectedDay(day);
                            setSelectedEvent(e);
                          }}
                        />
                      ))}

                      {overflow > 0 && (
                        <div className="text-xs text-white/70 px-2">
                          +{overflow} more
                        </div>
                      )}

                      {dayEvents.length === 0 && (
                        <div className="text-xs text-white/40 px-2 py-1">
                          No events
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day details card */}
          <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-lg border border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">
                {selectedDay
                  ? selectedDay.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Select a day"}
              </h3>

              <div className="text-sm text-white/70">
                {selectedDay ? `${selectedDayEvents.length} event(s)` : ""}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {!selectedDay && (
                <div className="text-white/70 text-sm">
                  Click a day in the calendar to see its events.
                </div>
              )}

              {selectedDay && selectedDayEvents.length === 0 && (
                <div className="text-white/70 text-sm">
                  No events scheduled for this day.
                </div>
              )}

              {selectedDay &&
                selectedDayEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    type="button"
                    className="w-full text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">
                          {ev.title}
                        </div>
                        <div className="text-white/70 text-sm mt-1">
                          {ev.all_day ? (
                            "All day"
                          ) : (
                            <>
                              {formatTime(new Date(ev.start_datetime))} –{" "}
                              {formatTime(new Date(ev.end_datetime))}
                            </>
                          )}
                        </div>
                      </div>

                      <span
                        className="shrink-0 w-3 h-3 rounded-full border border-white/30 mt-1"
                        style={{
                          backgroundColor: ev.color || "rgba(255,255,255,0.35)",
                        }}
                      />
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Event Modal */}
        <Modal
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent?.title || "Event"}
          actions={
            canDeleteSelected ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSelectedEvent();
                }}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-red-300/30 bg-red-500/20 hover:bg-red-500/30 text-white disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            ) : null
          }
        >
          {selectedEvent && (
            <div className="space-y-3 text-white/85">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-white/70">When</div>
                <div className="text-sm text-white text-right">
                  {selectedEvent.all_day ? (
                    "All day"
                  ) : (
                    <>
                      {new Date(selectedEvent.start_datetime).toLocaleString()}{" "}
                      <span className="text-white/70">to</span>{" "}
                      {new Date(selectedEvent.end_datetime).toLocaleString()}
                    </>
                  )}
                </div>
              </div>

              {selectedEvent.description && (
                <div className="pt-2 border-t border-white/10">
                  <div className="text-sm text-white/70 mb-1">Details</div>
                  <div className="text-sm whitespace-pre-wrap">
                    {selectedEvent.description}
                  </div>
                </div>
              )}

              {!selectedEvent.description && (
                <div className="text-sm text-white/70">
                  No description provided.
                </div>
              )}
              
            </div>
          )}
        </Modal>
        <AddEventModal
            open={openAddEvent}
            onClose={() => setOpenAddEvent(false)}
            defaultDate={selectedDay}
            onCreated={() => refreshEvents()}
            />
      </motion.div>
    </div>
  );
}