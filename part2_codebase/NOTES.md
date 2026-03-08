# Part 2 — Implementation Notes

## Requirements checklist (all met)

### Task 1: Bug fix — time conflict detection
- **Requirement:** Check for time conflicts with existing **scheduled** appointments on the same date.  
  **Done:** Only appointments with `status === "scheduled"` on the same `date` are considered; cancelled and no-show do not block new bookings.
- **Requirement:** Two appointments conflict if their time ranges overlap (start time + duration).  
  **Done:** Helper `appointmentsOverlap()` compares ranges in minutes; overlap when `startA < endB && startB < endA`.
- **Requirement:** On conflict return **409** with a clear error showing which appointment conflicts.  
  **Done:** Response includes `conflictingAppointmentId`, `conflictingAppointment` (id, time, duration, service), and `error` message. Seed conflict (a1 and a3 on 2026-03-10) is correctly rejected.

### Task 2: GET /schedule/:date
- **Requirement:** Return all **scheduled** appointments for that day, **sorted by time**.  
  **Done:** Filter by `date` and `status === "scheduled"`, then sort by `timeToMinutes(a.time)`.
- **Requirement:** Each appointment includes **client name and email** (not just clientId).  
  **Done:** Each item has `client: { name, email }` looked up from `clients` by `clientId`.
- **Requirement:** Show **free slots** between appointments (working hours 09:00–17:00).  
  **Done:** `freeSlots` array with `{ start, end }` in "HH:MM"; gaps between 09:00 and first appointment, between consecutive appointments, and from last end to 17:00.
- **Requirement:** **Summary** with total appointments, total booked minutes, total free minutes (within 09:00–17:00).  
  **Done:** `summary.totalAppointments`, `summary.bookedMinutes`, `summary.freeMinutes` (free = 480 − booked, never negative).
- **Requirement:** Date format.  
  **Done:** `:date` validated as YYYY-MM-DD; invalid format returns 400.

### Edge cases (from spec)
- **No appointments for the day:** `appointments` = [], `freeSlots` = [{ start: "09:00", end: "17:00" }], summary zeros except freeMinutes = 480.
- **All slots booked:** `freeSlots` = [].
- **Appointments extending past 17:00:** POST /appointments now rejects any booking that would **end** after 17:00 with **400** and a clear message (`endTimeWouldBe`, `workingHoursEnd`). Start before 09:00 is also rejected with 400.

### Additional validations (client request)
- **Past date:** Appointment date cannot be before **today**. If `date < todayStr` → **400** with message and `receivedDate` / `currentDate` so the client can show why the booking failed.
- **Working hours on create:** Start must be ≥ 09:00 and end ≤ 17:00; otherwise 400 with a clear error.

---

## Approach and trade-offs

**Task 1:** Helpers `timeToMinutes`, `appointmentEndMinutes`, and `appointmentsOverlap` keep conflict logic in one place and use minute-based comparison so overlap is unambiguous. Only scheduled appointments on the same date are considered, so cancelled/no-show do not block.

**Task 2:** Free slots are computed by sorting the day’s appointments by start time and recording gaps; the working day is fixed at 09:00–17:00 (480 minutes). Summary `freeMinutes` is `max(0, 480 - bookedMinutes)`. Date param is validated with a simple YYYY-MM-DD regex.

**Trade-offs:** Working hours (9–5) and “today” are based on the server’s local date/time; for multiple time zones you’d pass timezone or use UTC and document it. We did not add validation for “today but time already passed” (e.g. block 10:00 if it’s already 11:00); only the calendar date is checked for past-date validation.
