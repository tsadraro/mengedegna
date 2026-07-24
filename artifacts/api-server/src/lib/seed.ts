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

function buildRoutes() {
  const d2 = futureDate(2);
  const d3 = futureDate(3);
  const d4 = futureDate(4);
  const d5 = futureDate(5);

  return [
    // Addis Ababa → Bahir Dar
    { from_city: "Addis Ababa", to_city: "Bahir Dar",   departure_date: d2, departure_time: "06:00", arrival_time: "14:00", operator: "selam-bus",        operator_name: "Selam Bus",        available_seats: 32, fare: 450, featured: true  },
    { from_city: "Addis Ababa", to_city: "Bahir Dar",   departure_date: d2, departure_time: "07:30", arrival_time: "15:30", operator: "odaa-integrated",   operator_name: "ODAA Integrated",  available_seats: 18, fare: 520, featured: false },
    { from_city: "Addis Ababa", to_city: "Bahir Dar",   departure_date: d3, departure_time: "06:00", arrival_time: "14:00", operator: "zemen-bus",         operator_name: "Zemen Bus",        available_seats: 45, fare: 480, featured: false },
    // Addis Ababa → Gondar
    { from_city: "Addis Ababa", to_city: "Gondar",      departure_date: d2, departure_time: "06:00", arrival_time: "17:00", operator: "selam-bus",        operator_name: "Selam Bus",        available_seats: 28, fare: 620, featured: true  },
    { from_city: "Addis Ababa", to_city: "Gondar",      departure_date: d3, departure_time: "06:00", arrival_time: "17:00", operator: "yegna-bus",        operator_name: "Yegna Bus",        available_seats: 40, fare: 680, featured: false },
    // Addis Ababa → Mekelle
    { from_city: "Addis Ababa", to_city: "Mekelle",     departure_date: d2, departure_time: "06:00", arrival_time: "21:00", operator: "selam-bus",        operator_name: "Selam Bus",        available_seats: 15, fare: 850, featured: true  },
    { from_city: "Addis Ababa", to_city: "Mekelle",     departure_date: d3, departure_time: "06:00", arrival_time: "21:00", operator: "odaa-integrated",  operator_name: "ODAA Integrated",  available_seats: 35, fare: 920, featured: false },
    // Addis Ababa → Hawassa
    { from_city: "Addis Ababa", to_city: "Hawassa",     departure_date: d2, departure_time: "07:00", arrival_time: "11:00", operator: "zemen-bus",        operator_name: "Zemen Bus",        available_seats: 38, fare: 220, featured: true  },
    { from_city: "Addis Ababa", to_city: "Hawassa",     departure_date: d2, departure_time: "09:00", arrival_time: "13:00", operator: "golden-bus",       operator_name: "Golden Bus",       available_seats: 42, fare: 200, featured: false },
    { from_city: "Addis Ababa", to_city: "Hawassa",     departure_date: d3, departure_time: "14:00", arrival_time: "18:00", operator: "velocity-express", operator_name: "Velocity Express", available_seats: 30, fare: 250, featured: false },
    // Addis Ababa → Dire Dawa
    { from_city: "Addis Ababa", to_city: "Dire Dawa",   departure_date: d2, departure_time: "06:30", arrival_time: "15:30", operator: "selam-bus",        operator_name: "Selam Bus",        available_seats: 22, fare: 550, featured: false },
    { from_city: "Addis Ababa", to_city: "Dire Dawa",   departure_date: d3, departure_time: "06:30", arrival_time: "15:30", operator: "golden-bus",       operator_name: "Golden Bus",       available_seats: 44, fare: 500, featured: false },
    // Addis Ababa → Harar
    { from_city: "Addis Ababa", to_city: "Harar",       departure_date: d2, departure_time: "06:00", arrival_time: "16:00", operator: "golden-bus",       operator_name: "Golden Bus",       available_seats: 36, fare: 580, featured: true  },
    // Addis Ababa → Jimma
    { from_city: "Addis Ababa", to_city: "Jimma",       departure_date: d2, departure_time: "07:00", arrival_time: "13:00", operator: "selam-bus",        operator_name: "Selam Bus",        available_seats: 27, fare: 320, featured: false },
    { from_city: "Addis Ababa", to_city: "Jimma",       departure_date: d3, departure_time: "08:00", arrival_time: "14:00", operator: "zemen-bus",        operator_name: "Zemen Bus",        available_seats: 45, fare: 300, featured: false },
    // Addis Ababa → Adama
    { from_city: "Addis Ababa", to_city: "Adama",       departure_date: d2, departure_time: "08:00", arrival_time: "10:30", operator: "velocity-express", operator_name: "Velocity Express", available_seats: 30, fare: 120, featured: false },
    // Bahir Dar → Gondar
    { from_city: "Bahir Dar",   to_city: "Gondar",      departure_date: d2, departure_time: "08:00", arrival_time: "12:00", operator: "selam-bus",        operator_name: "Selam Bus",        available_seats: 20, fare: 180, featured: false },
    // Addis Ababa → Arbaminch
    { from_city: "Addis Ababa", to_city: "Arbaminch",   departure_date: d3, departure_time: "06:00", arrival_time: "14:00", operator: "selam-bus",        operator_name: "Selam Bus",        available_seats: 18, fare: 420, featured: false },
    // Addis Ababa → Dessie
    { from_city: "Addis Ababa", to_city: "Dessie",      departure_date: d2, departure_time: "06:00", arrival_time: "14:00", operator: "odaa-integrated",  operator_name: "ODAA Integrated",  available_seats: 33, fare: 380, featured: false },
    // Extra future dates so routes don't expire quickly
    { from_city: "Addis Ababa", to_city: "Bahir Dar",   departure_date: d4, departure_time: "06:00", arrival_time: "14:00", operator: "selam-bus",        operator_name: "Selam Bus",        available_seats: 40, fare: 450, featured: false },
    { from_city: "Addis Ababa", to_city: "Gondar",      departure_date: d4, departure_time: "06:00", arrival_time: "17:00", operator: "zemen-bus",        operator_name: "Zemen Bus",        available_seats: 35, fare: 640, featured: false },
    { from_city: "Addis Ababa", to_city: "Hawassa",     departure_date: d4, departure_time: "07:00", arrival_time: "11:00", operator: "golden-bus",       operator_name: "Golden Bus",       available_seats: 38, fare: 210, featured: false },
    { from_city: "Addis Ababa", to_city: "Dire Dawa",   departure_date: d5, departure_time: "06:30", arrival_time: "15:30", operator: "yegna-bus",        operator_name: "Yegna Bus",        available_seats: 30, fare: 530, featured: false },
    { from_city: "Addis Ababa", to_city: "Mekelle",     departure_date: d5, departure_time: "06:00", arrival_time: "21:00", operator: "zemen-bus",        operator_name: "Zemen Bus",        available_seats: 25, fare: 880, featured: false },
  ];
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

  if (Number(count[0]?.count ?? 0) > 0) {
    // Routes already exist — refresh their departure dates so they stay in the future
    await refreshRouteDates();
    return;
  }

  console.log("[seed] Seeding route data...");
  const routes = buildRoutes();
  for (const route of routes) {
    await db.insert(entitiesTable).values({
      id: crypto.randomUUID(),
      appId: APP_ID,
      entityName: "Route",
      data: route,
    });
  }
  console.log(`[seed] Inserted ${routes.length} routes.`);
}

/**
 * Re-roll departure dates on all existing routes so they always point
 * at least 2 days into the future from today.  Preserves all other data.
 */
async function refreshRouteDates() {
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

  for (const row of rows) {
    const data = row.data as Record<string, unknown>;
    const depDate = new Date(data["departure_date"] as string);
    depDate.setHours(0, 0, 0, 0);
    const daysUntil = Math.round((depDate.getTime() - today.getTime()) / 86400000);

    // If departure is within 1 day, push it forward by 7 days
    if (daysUntil <= 1) {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 3);
      const newDateStr = newDate.toISOString().slice(0, 10);
      await db
        .update(entitiesTable)
        .set({ data: { ...data, departure_date: newDateStr } })
        .where(eq(entitiesTable.id, row.id));
    }
  }
}
