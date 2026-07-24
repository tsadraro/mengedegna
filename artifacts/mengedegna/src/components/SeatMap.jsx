import React, { useEffect, useState } from "react";
import { Disc3, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Fetch taken seats: confirmed bookings + non-expired holds
async function fetchTakenSeats(routeId) {
  const existing = await base44.entities.Booking.filter(
    { route_id: routeId },
    "created_date",
    500
  );
  const now = Date.now();
  return new Set(
    existing
      .filter((b) => {
        if (b.status === "confirmed") return true;
        if (b.status === "held") {
          return b.hold_expires_at && new Date(b.hold_expires_at).getTime() > now;
        }
        return false;
      })
      .map((b) => parseInt(b.seat_number, 10))
      .filter(Boolean)
  );
}

// Check if a set of seat numbers are all adjacent (consecutive integers)
function areAdjacent(seats) {
  if (seats.length <= 1) return true;
  const sorted = [...seats].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) return false;
  }
  return true;
}

/**
 * SeatMap — multi-select with adjacency enforcement
 *
 * Props:
 *   route          - route object
 *   selectedSeats  - number[] of selected seat numbers
 *   onSelect       - (seats: number[]) => void
 *   maxSeats       - max seats passenger can pick (default 6)
 */
export default function SeatMap({ route, selectedSeats = [], onSelect, maxSeats = 6 }) {
  const [takenSeats, setTakenSeats] = useState(null); // null = loading
  const [adjacencyError, setAdjacencyError] = useState(false);

  useEffect(() => {
    if (!route?.id) return;
    setTakenSeats(null);
    fetchTakenSeats(route.id).then(setTakenSeats).catch(() => setTakenSeats(new Set()));
  }, [route?.id]);

  const layout = route?.seat_layout || {};
  const leftCols = layout.left_cols ?? 2;
  const rightCols = layout.right_cols ?? 2;
  const seatsPerRow = leftCols + rightCols;
  const total = route?.total_seats || 45;
  const rows = layout.rows ?? Math.ceil(total / seatsPerRow);
  const gapRows = layout.gap_rows ?? [];
  const seats = Array.from({ length: total }, (_, i) => i + 1);

  const handleSeatClick = (seat) => {
    if (!takenSeats || takenSeats.has(seat)) return;

    let newSelected;
    if (selectedSeats.includes(seat)) {
      // Deselect
      newSelected = selectedSeats.filter((s) => s !== seat);
    } else {
      if (selectedSeats.length >= maxSeats) return;
      newSelected = [...selectedSeats, seat];
    }

    // Enforce adjacency — only allow if result is adjacent
    if (newSelected.length > 1 && !areAdjacent(newSelected)) {
      setAdjacencyError(true);
      setTimeout(() => setAdjacencyError(false), 2000);
      return;
    }

    setAdjacencyError(false);
    onSelect(newSelected);
  };

  return (
    <div className="bg-card border border-border rounded-sm p-6 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-lg">Select Your Seats</h3>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {route?.operator} · {route?.bus_type} · {leftCols}+{rightCols} layout
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap justify-end">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border border-border" />Available</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-muted-foreground/40" />Taken</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary" />Selected</span>
        </div>
      </div>

      {/* Adjacency error */}
      {adjacencyError && (
        <div className="mb-4 px-4 py-2.5 border border-destructive/50 bg-destructive/10 rounded-sm text-xs text-destructive font-mono">
          ⚠ Seats must be adjacent — select seats next to each other so your group sits together.
        </div>
      )}

      {/* Seat count info */}
      {selectedSeats.length > 0 && (
        <div className="mb-4 px-4 py-2.5 border border-primary/40 bg-primary/5 rounded-sm text-xs font-mono text-primary">
          {selectedSeats.length === 1
            ? `Seat ${selectedSeats[0]} selected`
            : `Seats ${[...selectedSeats].sort((a, b) => a - b).join(", ")} selected — your group sits together`}
          {selectedSeats.length < maxSeats && (
            <span className="text-muted-foreground ml-2">· click more adjacent seats (up to {maxSeats})</span>
          )}
        </div>
      )}

      {takenSeats === null ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="max-w-md mx-auto">
          <div className="border border-border rounded-t-[3rem] rounded-b-sm p-5 bg-secondary/40">
            {/* Driver */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center">
                <Disc3 className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2.5">
              {Array.from({ length: rows }).map((_, rowIdx) => {
                const rowSeats = seats.slice(rowIdx * seatsPerRow, rowIdx * seatsPerRow + seatsPerRow);
                if (rowSeats.length === 0) return null;
                const leftSeats = rowSeats.slice(0, leftCols);
                const rightSeats = rowSeats.slice(leftCols);
                const hasGap = gapRows.includes(rowIdx + 1);
                return (
                  <React.Fragment key={rowIdx}>
                    {hasGap && (
                      <div className="h-3 flex items-center justify-center">
                        <div className="w-3/4 border-t border-dashed border-border/60" />
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex gap-1.5">
                        {leftSeats.map((seat) => (
                          <SeatButton
                            key={seat}
                            seat={seat}
                            isTaken={takenSeats.has(seat)}
                            isSelected={selectedSeats.includes(seat)}
                            onClick={handleSeatClick}
                          />
                        ))}
                      </div>
                      <div className="w-8" />
                      <div className="flex gap-1.5">
                        {rightSeats.map((seat) => (
                          <SeatButton
                            key={seat}
                            seat={seat}
                            isTaken={takenSeats.has(seat)}
                            isSelected={selectedSeats.includes(seat)}
                            onClick={handleSeatClick}
                          />
                        ))}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SeatButton({ seat, isTaken, isSelected, onClick }) {
  return (
    <button
      disabled={isTaken}
      onClick={() => onClick(seat)}
      className={`w-7 h-7 rounded-sm text-[10px] font-mono flex items-center justify-center transition-all ${
        isTaken
          ? "bg-muted-foreground/30 cursor-not-allowed text-muted-foreground/60"
          : isSelected
          ? "bg-primary text-primary-foreground scale-110 shadow-lg"
          : "border border-border hover:border-primary hover:bg-primary/10"
      }`}
    >
      {seat}
    </button>
  );
}