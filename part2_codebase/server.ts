import express from "express";
import { clients, appointments, generateId } from "./store.ts";
import type { Appointment, ApiResponse } from "./types.ts";

const app = express();
app.use(express.json());

// --- Helpers for time conflict detection (HH:MM, 24hr) ---
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function appointmentEndMinutes(time: string, duration: number): number {
  return timeToMinutes(time) + duration;
}

function appointmentsOverlap(
  timeA: string,
  durationA: number,
  timeB: string,
  durationB: number
): boolean {
  const startA = timeToMinutes(timeA);
  const endA = appointmentEndMinutes(timeA, durationA);
  const startB = timeToMinutes(timeB);
  const endB = appointmentEndMinutes(timeB, durationB);
  return startA < endB && startB < endA;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// ============================================================
// CLIENT ROUTES
// ============================================================

// GET /clients — list all clients
app.get("/clients", (req, res) => {
  res.json({ success: true, data: clients });
});

// GET /clients/:id — get single client
app.get("/clients/:id", (req, res) => {
  const client = clients.find((c) => c.id === req.params.id);
  if (!client) {
    return res.status(404).json({ success: false, error: "Client not found" });
  }
  res.json({ success: true, data: client });
});

// ============================================================
// APPOINTMENT ROUTES
// ============================================================

// GET /appointments — list appointments with optional filters
app.get("/appointments", (req, res) => {
  let result = [...appointments];

  if (req.query.clientId) {
    result = result.filter((a) => a.clientId === req.query.clientId);
  }

  if (req.query.status) {
    result = result.filter((a) => a.status === req.query.status);
  }

  if (req.query.date) {
    result = result.filter((a) => a.date === req.query.date);
  }

  res.json({ success: true, data: result });
});

// POST /appointments — create new appointment
app.post("/appointments", (req, res) => {
  const { clientId, service, date, time, duration, notes } = req.body;

  // Validate required fields
  if (!clientId || !service || !date || !time || !duration) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: clientId, service, date, time, duration",
    });
  }

  // Appointment date cannot be in the past (use today or a future date only)
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  if (date < todayStr) {
    return res.status(400).json({
      success: false,
      error: "Appointment date cannot be in the past. Please choose today or a future date.",
      receivedDate: date,
      currentDate: todayStr,
    });
  }

  // Validate client exists
  const client = clients.find((c) => c.id === clientId);
  if (!client) {
    return res.status(400).json({ success: false, error: "Client not found" });
  }

  // Validate service type
  const validServices = ["consultation", "follow-up", "onboarding"];
  if (!validServices.includes(service)) {
    return res.status(400).json({
      success: false,
      error: "Invalid service. Must be: consultation, follow-up, or onboarding",
    });
  }

  // Working hours: 09:00–17:00 — appointment must start and end within this window
  const WORK_START_MIN = 9 * 60;
  const WORK_END_MIN = 17 * 60;
  const startMin = timeToMinutes(time);
  const endMin = appointmentEndMinutes(time, duration);
  if (startMin < WORK_START_MIN) {
    return res.status(400).json({
      success: false,
      error: "Appointment cannot start before working hours. Working hours are 09:00 to 17:00.",
    });
  }
  if (endMin > WORK_END_MIN) {
    const endTimeStr = minutesToTime(endMin);
    return res.status(400).json({
      success: false,
      error: `Appointment extends past working hours (17:00). End time would be ${endTimeStr}. Please choose an earlier time or shorter duration so the appointment ends by 17:00.`,
      endTimeWouldBe: endTimeStr,
      workingHoursEnd: "17:00",
    });
  }

  // Check for time conflict with existing scheduled appointments on the same date
  const scheduledOnDate = appointments.filter(
    (a) => a.date === date && a.status === "scheduled"
  );
  const conflicting = scheduledOnDate.find((a) =>
    appointmentsOverlap(a.time, a.duration, time, duration)
  );
  if (conflicting) {
    return res.status(409).json({
      success: false,
      error: `Time conflict with existing appointment`,
      conflictingAppointmentId: conflicting.id,
      conflictingAppointment: {
        id: conflicting.id,
        time: conflicting.time,
        duration: conflicting.duration,
        service: conflicting.service,
      },
    });
  }

  const newAppointment: Appointment = {
    id: generateId(),
    clientId,
    service,
    date,
    time,
    duration,
    status: "scheduled",
    notes: notes || undefined,
    createdAt: new Date().toISOString(),
  };

  appointments.push(newAppointment);

  res.status(201).json({ success: true, data: newAppointment });
});

// PATCH /appointments/:id — update appointment status
app.patch("/appointments/:id", (req, res) => {
  const appointment = appointments.find((a) => a.id === req.params.id);

  if (!appointment) {
    return res.status(404).json({ success: false, error: "Appointment not found" });
  }

  const { status, notes } = req.body;

  if (status) {
    const validStatuses = ["scheduled", "completed", "cancelled", "no-show"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }
    appointment.status = status;
  }

  if (notes !== undefined) {
    appointment.notes = notes;
  }

  res.json({ success: true, data: appointment });
});

// GET /schedule/:date — daily schedule with appointments, free slots, and summary
app.get("/schedule/:date", (req, res) => {
  const date = req.params.date;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return res.status(400).json({
      success: false,
      error: "Invalid date format. Use YYYY-MM-DD (e.g. 2026-03-10)",
    });
  }

  const WORK_START_MIN = 9 * 60;
  const WORK_END_MIN = 17 * 60;
  const WORK_DAY_MINUTES = WORK_END_MIN - WORK_START_MIN;

  const dayAppointments = appointments
    .filter((a) => a.date === date && a.status === "scheduled")
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  const appointmentsWithClient = dayAppointments.map((a) => {
    const client = clients.find((c) => c.id === a.clientId);
    return {
      id: a.id,
      client: {
        name: client?.name ?? "Unknown",
        email: client?.email ?? "",
      },
      service: a.service,
      time: a.time,
      duration: a.duration,
      status: a.status,
    };
  });

  const freeSlots: { start: string; end: string }[] = [];
  let prevEnd = WORK_START_MIN;
  for (const a of dayAppointments) {
    const startMin = timeToMinutes(a.time);
    const endMin = Math.min(appointmentEndMinutes(a.time, a.duration), WORK_END_MIN);
    if (startMin > prevEnd) {
      freeSlots.push({
        start: minutesToTime(prevEnd),
        end: minutesToTime(Math.min(startMin, WORK_END_MIN)),
      });
    }
    prevEnd = Math.max(prevEnd, endMin);
  }
  if (prevEnd < WORK_END_MIN) {
    freeSlots.push({
      start: minutesToTime(prevEnd),
      end: minutesToTime(WORK_END_MIN),
    });
  }

  const bookedMinutes = dayAppointments.reduce((sum, a) => sum + a.duration, 0);
  const freeMinutes = Math.max(0, WORK_DAY_MINUTES - Math.min(bookedMinutes, WORK_DAY_MINUTES));

  res.json({
    success: true,
    data: {
      date,
      appointments: appointmentsWithClient,
      freeSlots,
      summary: {
        totalAppointments: dayAppointments.length,
        bookedMinutes,
        freeMinutes,
      },
    },
  });
});

// ============================================================
// GET /clients/:id/summary — client summary with appointment history
// ============================================================
app.get("/clients/:id/summary", (req, res) => {
  const client = clients.find((c) => c.id === req.params.id);
  if (!client) {
    return res.status(404).json({ success: false, error: "Client not found" });
  }

  const clientAppointments = appointments.filter((a) => a.clientId === client.id);

  const total = clientAppointments.length;
  const completed = clientAppointments.filter((a) => a.status === "completed").length;
  const cancelled = clientAppointments.filter((a) => a.status === "cancelled").length;
  const noShows = clientAppointments.filter((a) => a.status === "no-show").length;
  const upcoming = clientAppointments.filter((a) => a.status === "scheduled");

  res.json({
    success: true,
    data: {
      client,
      stats: { total, completed, cancelled, noShows },
      upcoming,
    },
  });
});

// ============================================================
// START SERVER
// ============================================================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
