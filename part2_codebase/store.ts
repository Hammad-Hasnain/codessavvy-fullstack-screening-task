import { Client, Appointment } from "./types";

// --- In-memory data store ---

export const clients: Client[] = [
  {
    id: "c1",
    name: "Ali Hassan",
    email: "ali@example.com",
    phone: "03001234567",
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "c2",
    name: "Sara Ahmed",
    email: "sara@example.com",
    phone: "03119876543",
    createdAt: "2026-02-01T09:30:00Z",
  },
  {
    id: "c3",
    name: "Bilal Khan",
    email: "bilal@example.com",
    phone: "03215556677",
    createdAt: "2026-02-20T14:00:00Z",
  },
];

export const appointments: Appointment[] = [
  {
    id: "a1",
    clientId: "c1",
    service: "consultation",
    date: "2026-03-10",
    time: "09:00",
    duration: 60,
    status: "scheduled",
    createdAt: "2026-03-01T08:00:00Z",
  },
  {
    id: "a2",
    clientId: "c1",
    service: "follow-up",
    date: "2026-03-12",
    time: "14:00",
    duration: 30,
    status: "completed",
    createdAt: "2026-03-01T08:15:00Z",
  },
  {
    id: "a3",
    clientId: "c2",
    service: "onboarding",
    date: "2026-03-10",
    time: "09:30",
    duration: 90,
    status: "scheduled",
    createdAt: "2026-03-02T11:00:00Z",
  },
  {
    id: "a4",
    clientId: "c2",
    service: "consultation",
    date: "2026-03-15",
    time: "11:00",
    duration: 60,
    status: "cancelled",
    createdAt: "2026-03-03T09:00:00Z",
  },
  {
    id: "a5",
    clientId: "c3",
    service: "consultation",
    date: "2026-03-10",
    time: "10:00",
    duration: 45,
    status: "scheduled",
    createdAt: "2026-03-04T16:00:00Z",
  },
];

// --- Helper ---
export function generateId(): string {
  return "a" + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
}
