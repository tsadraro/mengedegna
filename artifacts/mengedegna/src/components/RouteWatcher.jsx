/**
 * RouteWatcher — mounts once in the app, listens for Route entity updates,
 * and fires in-app + email notifications for any registered alert watchers.
 */
import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function RouteWatcher({ user }) {
  useEffect(() => {
    if (!user?.id) return;

    const unsub = base44.entities.Route.subscribe(async (event) => {
      if (event.type !== "update") return;
      const updated = event.data;

      // Find all active alerts for this route
      let alerts = [];
      try {
        alerts = await base44.entities.RouteAlert.filter({ route_id: updated.id, active: true });
      } catch { return; }
      if (!alerts.length) return;

      for (const alert of alerts) {
        const seatsChanged = updated.available_seats !== undefined && alert.last_known_seats !== undefined
          && updated.available_seats !== alert.last_known_seats;
        const timeChanged = updated.departure_time && alert.last_known_time
          && updated.departure_time !== alert.last_known_time;

        if (!seatsChanged && !timeChanged) continue;

        let title = "";
        let message = "";
        let type = "seat_available";

        if (seatsChanged) {
          const diff = updated.available_seats - alert.last_known_seats;
          title = `Seats ${diff > 0 ? "freed up" : "filling fast"} — ${alert.from_city} → ${alert.to_city}`;
          message = `${alert.operator} now has ${updated.available_seats} seat${updated.available_seats !== 1 ? "s" : ""} available on ${alert.departure_date} at ${updated.departure_time || alert.departure_time}.`;
        }

        if (timeChanged) {
          title = `Schedule changed — ${alert.from_city} → ${alert.to_city}`;
          message = `${alert.operator} departure time changed from ${alert.last_known_time} to ${updated.departure_time} on ${alert.departure_date}.`;
          type = "schedule_change";
        }

        // In-app notification
        try {
          await base44.entities.InAppNotification.create({
            user_id: alert.user_id,
            title,
            message,
            route_id: updated.id,
            read: false,
            type,
          });
        } catch {}

        // Email (only reaches registered app users)
        if (alert.user_email) {
          try {
            await base44.integrations.Core.SendEmail({
              to: alert.user_email,
              subject: `Abyssinian Kinetics Alert: ${title}`,
              body: `Hi ${alert.user_name || "Passenger"},\n\n${message}\n\nVisit the routes page to book your seat before it fills up.\n\n— Abyssinian Kinetics`,
            });
          } catch {}
        }

        // Update last known values
        try {
          await base44.entities.RouteAlert.update(alert.id, {
            last_known_seats: updated.available_seats ?? alert.last_known_seats,
            last_known_time: updated.departure_time ?? alert.last_known_time,
          });
        } catch {}
      }
    });

    return unsub;
  }, [user?.id]);

  return null;
}