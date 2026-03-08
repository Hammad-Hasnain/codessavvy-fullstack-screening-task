// ============================================================
// PART 1 — CODE REVIEW (30 minutes)
// ============================================================
//
// This file is a simplified order processing service.
// It has at least 4 issues — a mix of bugs and bad practices.
//
// Your task:
//   1. Find and fix all the bugs
//   2. Identify the bad practices and explain why they're bad
//   3. For each fix, write a short comment explaining what
//      was wrong and why your fix is correct
//
// Do NOT rewrite the entire file. Just fix what's broken
// and mark the bad practice.
// ============================================================

import { Request, Response } from "express";

interface Order {
  id: string;
  customerEmail: string;
  items: { name: string; price: number; qty: number }[];
  // BAD PRACTICE: Status values are defined here as inline string literals and then repeated manually elsewhere ("pending", "confirmed", "cancelled"). This leads to magic strings, risk of typos, and no single source of truth; better to use a const object or enum and reference it everywhere.
  status: "pending" | "confirmed" | "cancelled";
  createdAt: Date;
}

// In-memory store (simulating a database)
const orders: Order[] = [];

// --- Helper: generate a simple ID ---
// BAD PRACTICE: substr() is deprecated; use substring() or slice().
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// --- Helper: send confirmation email ---
async function sendConfirmationEmail(email: string, orderId: string): Promise<boolean> {
  // Simulates an async email API call
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Email sent to ${email} for order ${orderId}`);
      resolve(true);
    }, 100);
  });
}

// --- Helper: calculate order total ---
// Iterates through all items and sums up (price * qty) for each
// BUG FIX: Loop used i <= items.length, so when i === items.length we accessed items[length] (undefined), causing NaN or runtime error. Use i < items.length.
function calculateTotal(items: { name: string; price: number; qty: number }[]): number {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].qty;
  }
  return total;
}

// --- POST /orders — Create a new order ---
// Validates input, calculates total, saves order, sends email, and confirms
async function createOrder(req: Request, res: Response) {
  const { customerEmail, items } = req.body;

  // Validate required fields before processing
  // BAD PRACTICE: We don't validate that items is an array or that each item has price/qty; invalid input causes runtime errors in calculateTotal or corrupt data in the order.
  if (!customerEmail || !items) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const total = calculateTotal(items);

  const order: Order = {
    id: generateId(),
    customerEmail: customerEmail, // BAD PRACTICE: use ES6 shorthand when key and variable name match.
    items: items,         // BAD PRACTICE: use ES6 shorthand when key and variable name match.
    status: "pending", // BAD PRACTICE: magic string — use shared constant/enum for status (see Order interface).
    createdAt: new Date(),
  };

  orders.push(order);

  // Send confirmation email and then update status to confirmed
  // BUG FIX: We were not awaiting sendConfirmationEmail, so the response was sent and status set to "confirmed" before the email was actually sent. Now we await so the flow is correct; the order is only confirmed after we've attempted to send the email.
  await sendConfirmationEmail(order.customerEmail, order.id);
  // BAD PRACTICE: magic string — use shared constant/enum for status (see Order interface).
  order.status = "confirmed";

  return res.status(201).json({
    message: "Order created",
    orderId: order.id,
    total: total,
  });
}

// --- GET /orders/:id — Get order by ID ---
// BUG FIX: Code used loose equality (==); comment claimed "strict comparison". Use === to avoid type coercion and match the intended behavior.
function getOrder(req: Request, res: Response) {
  const order = orders.find((o) => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  return res.status(200).json(order);
}

// --- DELETE /orders/:id — Cancel an order ---
// BUG FIX: Same as getOrder — use === for strict comparison when finding by ID.
function cancelOrder(req: Request, res: Response) {
  const order = orders.find((o) => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  // BAD PRACTICE: magic string — use shared constant/enum for status (see Order interface).
  order.status = "cancelled";

  return res.status(200).json({ message: "Order cancelled", orderId: order.id });
}

export { createOrder, getOrder, cancelOrder };
