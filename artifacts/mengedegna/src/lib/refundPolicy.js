/**
 * Refund policy logic for Abyssinian Kinetics.
 *
 * Rules:
 *  - Cancelled 24h or more before departure → FULL REFUND
 *  - Cancelled between 12h–24h before departure → 50% REFUND
 *  - Cancelled less than 12h before departure → NO REFUND
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
  if (hoursRemaining >= 24) {
    return {
      label: "FULLY REFUNDABLE",
      pct: 100,
      color: "accent", // cyan
      description: "Cancellations made 24 hours or more before departure receive a full refund.",
    };
  } else if (hoursRemaining >= 12) {
    return {
      label: "50% REFUNDABLE",
      pct: 50,
      color: "primary", // gold
      description: "Cancellations made between 12 and 24 hours before departure receive a 50% refund.",
    };
  } else {
    return {
      label: "NON-REFUNDABLE",
      pct: 0,
      color: "destructive",
      description: "Cancellations made less than 12 hours before departure are non-refundable.",
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