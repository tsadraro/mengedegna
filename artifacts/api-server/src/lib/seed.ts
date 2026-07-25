import { db } from "@workspace/db";
import { entitiesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";

const APP_ID = "mengedegna";

/** Return "YYYY-MM-DD" for today + offsetDays */
function futureDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Build a 3-week rolling schedule.
 * Each route template defines the service pattern; we generate one departure
 * per day it runs across the next 21 days.
 */
function buildRoutes() {
  // Route templates: each entry can repeat on specific day-of-week patterns
  // daysOfWeek: 0=Sun … 6=Sat, undefined = every day
  const templates: Array<{
    from_city: string;
    to_city: string;
    departure_time: string;
    arrival_time: string;
    operator: string;
    operator_name: string;
    total_seats: number;
    available_seats: number;
    fare: number;
    bus_type?: string;
    featured?: boolean;
    daysOfWeek?: number[]; // which days of week this service runs
  }> = [
    // ── Addis Ababa → Bahir Dar ─────────────────────────────────────────────
    { from_city: "Addis Ababa", to_city: "Bahir Dar", departure_time: "06:00", arrival_time: "14:00", operator: "selam-bus",        operator_name: "Selam Bus",        total_seats: 45, available_seats: 32, fare: 450, bus_type: "Luxury", featured: true  },
    { from_city: "Addis Ababa", to_city: "Bahir Dar", departure_time: "07:30", arrival_time: "15:30", operator: "odaa-integrated",   operator_name: "ODAA Integrated",  total_seats: 45, available_seats: 40, fare: 520, bus_type: "VIP",    featured: false },
    { from_city: "Addis Ababa", to_city: "Bahir Dar", departure_time: "14:00", arrival_time: "22:00", operator: "zemen-bus",         operator_name: "Zemen Bus",        total_seats: 45, available_seats: 45, fare: 480, bus_type: "Economy",featured: false, daysOfWeek: [1,3,5,6] },

    // ── Addis Ababa → Gondar ─────────────────────────────────────────────────
    { from_city: "Addis Ababa", to_city: "Gondar", departure_time: "06:00", arrival_time: "17:00", operator: "selam-bus",     operator_name: "Selam Bus",    total_seats: 45, available_seats: 28, fare: 620, bus_type: "Luxury", featured: true  },
    { from_city: "Addis Ababa", to_city: "Gondar", departure_time: "06:30", arrival_time: "17:30", operator: "yegna-bus",     operator_name: "Yegna Bus",    total_seats: 45, available_seats: 40, fare: 680, bus_type: "VIP",    featured: false, daysOfWeek: [0,2,4,6] },
    { from_city: "Addis Ababa", to_city: "Gondar", departure_time: "07:00", arrival_time: "18:00", operator: "zemen-bus",     operator_name: "Zemen Bus",    total_seats: 45, available_seats: 45, fare: 640, bus_type: "Economy",featured: false, daysOfWeek: [1,3,5] },

    // ── Addis Ababa → Mekelle ─────────────────────────────────────────────────
    { from_city: "Addis Ababa", to_city: "Mekelle", departure_time: "06:00", arrival_time: "21:00", operator: "selam-bus",       operator_name: "Selam Bus",       total_seats: 45, available_seats: 15, fare: 850,  bus_type: "Luxury", featured: true,  daysOfWeek: [1,3,5] },
    { from_city: "Addis Ababa", to_city: "Mekelle", departure_time: "06:00", arrival_time: "21:00", operator: "odaa-integrated", operator_name: "ODAA Integrated", total_seats: 45, available_seats: 35, fare: 920,  bus_type: "VIP",    featured: false, daysOfWeek: [0,2,4,6] },

    // ── Addis Ababa → Hawassa ─────────────────────────────────────────────────
    { from_city: "Addis Ababa", to_city: "Hawassa", departure_time: "07:00", arrival_time: "11:00", operator: "zemen-bus",        operator_name: "Zemen Bus",        total_seats: 45, available_seats: 38, fare: 220, bus_type: "Luxury", featured: true  },
    { from_city: "Addis Ababa", to_city: "Hawassa", departure_time: "09:00", arrival_time: "13:00", operator: "golden-bus",       operator_name: "Golden Bus",       total_seats: 45, available_seats: 42, fare: 200, bus_type: "Economy",featured: false },
    { from_city: "Addis Ababa", to_city: "Hawassa", departure_time: "14:00", arrival_time: "18:00", operator: "velocity-express", operator_name: "Velocity Express", total_seats: 45, available_seats: 30, fare: 250, bus_type: "VIP",    featured: false },

    // ── Addis Ababa → Dire Dawa ───────────────────────────────────────────────
    { from_city: "Addis Ababa", to_city: "Dire Dawa", departure_time: "06:30", arrival_time: "15:30", operator: "selam-bus",   operator_name: "Selam Bus",   total_seats: 45, available_seats: 22, fare: 550, bus_type: "Luxury", featured: false, daysOfWeek: [0,2,4,6] },
    { from_city: "Addis Ababa", to_city: "Dire Dawa", departure_time: "07:00", arrival_time: "16:00", operator: "golden-bus",  operator_name: "Golden Bus",  total_seats: 45, available_seats: 44, fare: 500, bus_type: "Economy",featured: false, daysOfWeek: [1,3,5] },
    { from_city: "Addis Ababa", to_city: "Dire Dawa", departure_time: "06:30", arrival_time: "15:30", operator: "yegna-bus",   operator_name: "Yegna Bus",   total_seats: 45, available_seats: 30, fare: 530, bus_type: "VIP",    featured: false, daysOfWeek: [0,2,5] },

    // ── Addis Ababa → Harar ───────────────────────────────────────────────────
    { from_city: "Addis Ababa", to_city: "Harar", departure_time: "06:00", arrival_time: "16:00", operator: "golden-bus", operator_name: "Golden Bus", total_seats: 45, available_seats: 36, fare: 580, bus_type: "Luxury", featured: true, daysOfWeek: [1,3,5,6] },

    // ── Addis Ababa → Jimma ───────────────────────────────────────────────────
    { from_city: "Addis Ababa", to_city: "Jimma", departure_time: "07:00", arrival_time: "13:00", operator: "selam-bus", operator_name: "Selam Bus", total_seats: 45, available_seats: 27, fare: 320, bus_type: "Luxury", featured: false },
    { from_city: "Addis Ababa", to_city: "Jimma", departure_time: "08:00", arrival_time: "14:00", operator: "zemen-bus", operator_name: "Zemen Bus", total_seats: 45, available_seats: 45, fare: 300, bus_type: "Economy",featured: false, daysOfWeek: [0,2,4,6] },

    // ── Addis Ababa → Adama ───────────────────────────────────────────────────
    { from_city: "Addis Ababa", to_city: "Adama", departure_time: "07:00", arrival_time: "09:30", operator: "velocity-express", operator_name: "Velocity Express", total_seats: 45, available_seats: 30, fare: 120, bus_type: "Economy",featured: false },
    { from_city: "Addis Ababa", to_city: "Adama", departure_time: "09:00", arrival_time: "11:30", operator: "golden-bus",       operator_name: "Golden Bus",       total_seats: 45, available_seats: 45, fare: 130, bus_type: "Economy",featured: false },
    { from_city: "Addis Ababa", to_city: "Adama", departure_time: "14:00", arrival_time: "16:30", operator: "zemen-bus",        operator_name: "Zemen Bus",        total_seats: 45, available_seats: 45, fare: 120, bus_type: "Economy",featured: false },

    // ── Addis Ababa → Dessie ──────────────────────────────────────────────────
    { from_city: "Addis Ababa", to_city: "Dessie", departure_time: "06:00", arrival_time: "14:00", operator: "odaa-integrated", operator_name: "ODAA Integrated", total_seats: 45, available_seats: 33, fare: 380, bus_type: "Luxury", featured: false, daysOfWeek: [0,2,4,6] },

    // ── Addis Ababa → Arbaminch ───────────────────────────────────────────────
    { from_city: "Addis Ababa", to_city: "Arbaminch", departure_time: "06:00", arrival_time: "14:00", operator: "selam-bus", operator_name: "Selam Bus", total_seats: 45, available_seats: 18, fare: 420, bus_type: "Luxury", featured: false, daysOfWeek: [1,3,5] },

    // ── Bahir Dar → Gondar ────────────────────────────────────────────────────
    { from_city: "Bahir Dar", to_city: "Gondar", departure_time: "08:00", arrival_time: "12:00", operator: "selam-bus",  operator_name: "Selam Bus",  total_seats: 45, available_seats: 20, fare: 180, bus_type: "Economy",featured: false },
    { from_city: "Bahir Dar", to_city: "Gondar", departure_time: "10:00", arrival_time: "14:00", operator: "yegna-bus", operator_name: "Yegna Bus",  total_seats: 45, available_seats: 45, fare: 200, bus_type: "Economy",featured: false, daysOfWeek: [0,2,4,6] },

    // ── Gondar → Bahir Dar ────────────────────────────────────────────────────
    { from_city: "Gondar", to_city: "Bahir Dar", departure_time: "08:00", arrival_time: "12:00", operator: "selam-bus",  operator_name: "Selam Bus",  total_seats: 45, available_seats: 30, fare: 180, bus_type: "Economy",featured: false },
  ];

  const routes: Array<Record<string, unknown>> = [];

  // Generate one entry per day (days 1–21) for each template
  for (let day = 1; day <= 21; day++) {
    const dateStr = futureDate(day);
    const dow = new Date(dateStr).getDay(); // 0=Sun … 6=Sat

    for (const tpl of templates) {
      if (tpl.daysOfWeek && !tpl.daysOfWeek.includes(dow)) continue;

      routes.push({
        from_city: tpl.from_city,
        to_city: tpl.to_city,
        departure_date: dateStr,
        departure_time: tpl.departure_time,
        arrival_time: tpl.arrival_time,
        operator: tpl.operator,
        operator_name: tpl.operator_name,
        bus_type: tpl.bus_type ?? "Economy",
        total_seats: tpl.total_seats,
        available_seats: tpl.available_seats,
        fare: tpl.fare,
        featured: tpl.featured ?? false,
      });
    }
  }

  return routes;
}

export async function seedIfEmpty() {
  const count = await db
    .select({ count: sql<number>`count(*)` })
    .from(entitiesTable)
    .where(
      and(
        eq(entitiesTable.appId, APP_ID),
        eq(entitiesTable.entityName, "Route"),
      ),
    );

  const existing = Number(count[0]?.count ?? 0);

  if (existing > 0) {
    // Routes already exist — keep the 3-week window fresh
    await refreshSchedule();
    return;
  }

  console.log("[seed] Seeding 3-week route schedule...");
  const routes = buildRoutes();
  for (const route of routes) {
    await db.insert(entitiesTable).values({
      id: crypto.randomUUID(),
      appId: APP_ID,
      entityName: "Route",
      data: route,
    });
  }
  console.log(`[seed] Inserted ${routes.length} routes across 21 days.`);
}

/**
 * Keep the schedule rolling:
 * - Delete routes whose departure date has passed.
 * - Regenerate tomorrow's routes if they're missing (covers the daily rollover).
 */
async function refreshSchedule() {
  const rows = await db
    .select()
    .from(entitiesTable)
    .where(
      and(
        eq(entitiesTable.appId, APP_ID),
        eq(entitiesTable.entityName, "Route"),
      ),
    );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  // 1. Delete routes that have already departed (past today)
  for (const row of rows) {
    const data = row.data as Record<string, unknown>;
    const dep = data["departure_date"] as string;
    if (dep < todayStr) {
      await db.delete(entitiesTable).where(eq(entitiesTable.id, row.id));
    }
  }

  // 2. Find which future dates already have routes
  const existingDates = new Set(
    rows
      .map((r) => (r.data as Record<string, unknown>)["departure_date"] as string)
      .filter((d) => d >= todayStr),
  );

  // 3. For any of the next 21 days that has no routes yet, insert them
  const templates = buildRoutes();
  const byDate = new Map<string, Array<Record<string, unknown>>>();
  for (const route of templates) {
    const d = route["departure_date"] as string;
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(route);
  }

  let added = 0;
  for (const [date, dayRoutes] of byDate) {
    if (!existingDates.has(date)) {
      for (const route of dayRoutes) {
        await db.insert(entitiesTable).values({
          id: crypto.randomUUID(),
          appId: APP_ID,
          entityName: "Route",
          data: route,
        });
        added++;
      }
    }
  }

  if (added > 0) {
    console.log(`[seed] Rolling refresh: added ${added} routes for new dates.`);
  }
}
