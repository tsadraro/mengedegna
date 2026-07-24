/**
 * Refund policy logic for Abyssinian Kinetics.
 *
 * Rules:
 *  - Cancelled MORE than 24h before departure → FULL REFUND
 *  - Cancelled between 18h–24h before departure → 50% REFUND
 *  - Cancelled WITHIN 18h of departure → NO REFUND
 */

/**
 * Given a departure date string ("YYYY-MM-DD") and time ("HH:MM"),
 * returns how many hours remain until departure from now.
 */
export function hoursUntilDeparture(departureDate, departureTime) {
  const [h, m] = departureTime.split(":").map(Number);
  const dep = new Date(departureDate);
  dep.setHours(h, m, 0, 0);
  return (dep.getTime() - Date.now()) / (1000 * 60 * 60);
}

/**
 * Returns the refund tier based on hours remaining before departure.
 * @returns {{ label: string, pct: number, color: string, description: string }}
 */
export function getRefundPolicy(hoursRemaining) {
  if (hoursRemaining > 24) {
    return {
      label: "FULLY REFUNDABLE",
      pct: 100,
      color: "accent", // cyan
      description: "Cancel more than 24 hours before departure for a full refund.",
    };
  } else if (hoursRemaining > 18) {
    return {
      label: "50% REFUNDABLE",
      pct: 50,
      color: "primary", // gold
      description: "Cancel between 18–24 hours before departure for a 50% refund.",
    };
  } else {
    return {
      label: "NON-REFUNDABLE",
      pct: 0,
      color: "destructive",
      description: "Cancellations within 18 hours of departure are not eligible for any refund.",
    };
  }
}

/**
 * Returns the refund policy for a booking given its departure date+time.
 * Pass the booking's departure_date and departure_time.
 */
export function getRefundPolicyForBooking(departureDate, departureTime) {
  const hours = hoursUntilDeparture(departureDate, departureTime);
  return getRefundPolicy(hours);
}