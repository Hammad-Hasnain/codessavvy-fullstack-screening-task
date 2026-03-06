# Part 2 — Work on an Existing Codebase (90 minutes)

## Context

You're joining a small agency mid-project. A previous developer built a **Client Appointment System** for a client. The code works but has issues, and the client has requested a new feature.

The codebase has 3 files:
- `types.ts` — TypeScript interfaces
- `store.ts` — In-memory data store with seed data
- `server.ts` — Express API routes

**Read and understand the code before making changes.**

---

## Task 1: Fix the Bug (30 mins)

The client reported this issue:

> "When we try to book two appointments at the same time on the same day, the system allows it. We had a situation where two clients were both booked for 09:00 on March 10th — one for a 60-min consultation and another for a 90-min onboarding starting at 09:30. Their times overlap but the system didn't catch it."

**Look at the seed data in `store.ts` to see this exact conflict (a1 and a3).**

Fix the `POST /appointments` route so that:
- It checks for time conflicts with existing **scheduled** appointments on the same date
- Two appointments conflict if their time ranges overlap (consider start time + duration)
- If there's a conflict, return a `409` status with a clear error message showing which appointment conflicts
- Cancelled and no-show appointments should NOT block new bookings

---

## Task 2: Add a Feature (60 mins)

The client wants a **Daily Schedule** endpoint:

### `GET /schedule/:date`

Given a date (e.g., `/schedule/2026-03-10`), return:

1. **All scheduled appointments for that day**, sorted by time
2. **Each appointment should include the client's name and email** (not just clientId)
3. **Show time gaps** — identify free slots between appointments (assuming working hours are 09:00 to 17:00)
4. A **summary** with:
   - Total appointments for the day
   - Total booked minutes
   - Total free minutes (within 09:00-17:00)

Example response shape (you decide the exact structure):
```json
{
  "success": true,
  "data": {
    "date": "2026-03-10",
    "appointments": [
      {
        "id": "a1",
        "client": { "name": "Ali Hassan", "email": "ali@example.com" },
        "service": "consultation",
        "time": "09:00",
        "duration": 60,
        "status": "scheduled"
      }
    ],
    "freeSlots": [
      { "start": "10:00", "end": "10:30" }
    ],
    "summary": {
      "totalAppointments": 3,
      "bookedMinutes": 165,
      "freeMinutes": 315
    }
  }
}
```

---

## What We're Looking For

- **Can you read and understand unfamiliar code?** (This matters more than writing from scratch)
- **Does your fix actually work?** (Test the conflict detection with the seed data)
- **Is your feature consistent with the existing code style?** (Follow the patterns already in the codebase — response format, error handling, naming)
- **How do you handle edge cases?** (What if no appointments? What if all slots are booked? What about appointments that extend past 17:00?)

---

## Submission

- Commit your changes to your repo (only modify the files you need to change)
- **Write 3-4 sentences explaining your approach** in your commit message or a separate `NOTES.md` — what did you change, why, and any trade-offs you considered
- Run `npm install` first, then start with `npx ts-node server.ts`

---

## Time: 90 minutes

Work like you would on a real project — understand first, then change. Don't rewrite everything.
