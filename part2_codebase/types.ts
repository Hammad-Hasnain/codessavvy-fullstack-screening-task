export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  service: "consultation" | "follow-up" | "onboarding";
  date: string; // ISO date string
  time: string; // "HH:MM" 24hr format
  duration: number; // in minutes
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  notes?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
