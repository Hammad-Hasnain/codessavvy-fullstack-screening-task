import express from "express";
import { clients, appointments, generateId } from "./store";
import { Appointment, ApiResponse } from "./types";

const app = express();
app.use(express.json());

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
