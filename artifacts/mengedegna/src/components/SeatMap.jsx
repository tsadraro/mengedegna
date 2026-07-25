import React, { useEffect, useState } from "react";
import { Disc3, Loader2, Shuffle, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLang } from "@/lib/LanguageContext";

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
        if (b.status === "held") return b.hold_expires_at && new Date(b.hold_expires_at).getTime() > now;
        return false;
      })
      .map((b) => parseInt(b.seat_number, 10))
      .filter(Boolean)
  );
}

function areAdjacent(seats) {
  if (seats.length <= 1) return true;
  const sorted = [...seats].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) return false;
  }
  return true;
}

export default function SeatMap({ route, selectedSeats = [], onSelect, maxSeats = 6 }) {
  const { t, lang } = useLang();
  const [takenSeats, setTakenSeats] = useState(null);
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

  // Auto-pick: find first available seat (or N adjacent seats for groups)
  const handleAutoPick = () => {
    if (!takenSeats) return;
    const count = selectedSeats.length > 0 ? selectedSeats.length : 1;
    const available = seats.filter((s) => !takenSeats.has(s));

    // Try to find `count` adjacent available seats
    for (let i = 0; i <= available.length - count; i++) {
      const candidate = available.slice(i, i + count);
      if (candidate.length === count && areAdjacent(candidate)) {
        onSelect(candidate);
        return;
      }
    }
    // Fallback: just pick the first available
    if (available.length > 0) onSelect([available[0]]);
  };

  const handleSeatClick = (seat) => {
    if (!takenSeats || takenSeats.has(seat)) return;
    let newSelected;
    if (selectedSeats.includes(seat)) {
      newSelected = selectedSeats.filter((s) => s !== seat);
    } else {
      if (selectedSeats.length >= maxSeats) return;
      newSelected = [...selectedSeats, seat];
    }
    if (newSelected.length > 1 && !areAdjacent(newSelected)) {
      setAdjacencyError(true);
      setTimeout(() => setAdjacencyError(false), 2500);
      return;
    }
    setAdjacencyError(false);
    onSelect(newSelected);
  };

  const availableCount = takenSeats ? seats.filter((s) => !takenSeats.has(s)).length : null;

  return (
    <div className="bg-card border border-border rounded-sm p-5 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="font-display font-bold text-xl">
            {lang === "am" ? "ወንበር ይምረጡ" : lang === "or" ? "Teessoo Filadhu" : "Choose Your Seat"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {route?.operator} · {route?.bus_type}
            {availableCount !== null && (
              <span className={`ml-2 font-semibold ${availableCount <= 7 ? "text-destructive" : "text-accent"}`}>
                · {availableCount} {lang === "am" ? "ወንበር አለ" : "seats available"}
              </span>
            )}
          </p>
        </div>

        {/* Auto-pick button */}
        {takenSeats && (
          <button
            onClick={handleAutoPick}
            className="flex items-center gap-2 text-sm border border-primary/50 text-primary px-4 py-2.5 rounded-sm hover:bg-primary/10 transition-all font-medium"
          >
            <Shuffle className="w-4 h-4" />
            {lang === "am" ? "ወንበር ለኔ ምረጥ" : lang === "or" ? "Teessoo Na Filadhu" : "Pick a seat for me"}
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        {[
          { color: "border border-border bg-card", label: lang === "am" ? "ተገኝቷል" : "Available" },
          { color: "bg-primary", label: lang === "am" ? "የተመረጠ" : "Your seat" },
          { color: "bg-muted-foreground/40", label: lang === "am" ? "ተሸጧል" : "Taken" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={`w-6 h-6 rounded-sm flex-shrink-0 ${item.color}`} />
            {item.label}
          </div>
        ))}
      </div>

      {/* Error banners */}
      {adjacencyError && (
        <div className="mb-4 flex items-start gap-3 border border-amber-500/40 bg-amber-500/10 rounded-sm px-4 py-3 text-sm text-amber-400">
          <span className="text-lg flex-shrink-0">⚠️</span>
          <div>
            <div className="font-semibold mb-0.5">
              {lang === "am" ? "አጠገብ ያሉ ወንበሮችን ይምረጡ" : "Please select seats next to each other"}
            </div>
            <div className="text-xs opacity-80">
              {lang === "am"
                ? "ቡድን ጉዞ ሲሆን ወንበሮቹ ተያያዥ መሆን አለባቸው።"
                : 'For group travel, seats must be side-by-side. Try the "Pick for me" button above.'}
            </div>
          </div>
        </div>
      )}

      {/* Selected seats summary */}
      {selectedSeats.length > 0 && (
        <div className="mb-5 flex items-center justify-between border border-primary/40 bg-primary/5 rounded-sm px-4 py-3">
          <div className="text-sm font-medium text-primary">
            ✓ {lang === "am" ? "ወንበር" : "Seat"}{selectedSeats.length > 1 ? "s" : ""}{" "}
            <span className="font-mono font-bold">
              {[...selectedSeats].sort((a, b) => a - b).join(", ")}
            </span>
            {" "}{lang === "am" ? "ተመርጧል" : "selected"}
          </div>
          <button
            onClick={() => onSelect([])}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {takenSeats === null ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm">{lang === "am" ? "ወንበሮችን እየጫነ ነው…" : "Loading seat availability…"}</span>
        </div>
      ) : (
        <div className="max-w-sm mx-auto">
          {/* Bus outline */}
          <div className="border-2 border-border rounded-t-[3rem] rounded-b-sm p-4 sm:p-6 bg-secondary/30">
            {/* Driver */}
            <div className="flex justify-center mb-5">
              <div className="w-12 h-12 rounded-full border-2 border-border bg-card flex items-center justify-center">
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
                      <div className="h-4 flex items-center justify-center">
                        <div className="w-3/4 border-t border-dashed border-border/60" />
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex gap-2">
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
                      {/* Aisle */}
                      <div className="w-4 sm:w-6 text-center">
                        {rowIdx === Math.floor(rows / 2) && (
                          <div className="text-[8px] text-muted-foreground/40 rotate-90 whitespace-nowrap">aisle</div>
                        )}
                      </div>
                      <div className="flex gap-2">
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

          {/* Help text */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            {lang === "am"
              ? `እስከ ${maxSeats} ወንበር መምረጥ ይችላሉ። ቡድን ከሆኑ ተያያዥ ወንበሮችን ይምረጡ።`
              : `Tap a seat to select it. You can pick up to ${maxSeats} seats for your group.`}
          </p>
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
      aria-label={`Seat ${seat}${isTaken ? " (taken)" : isSelected ? " (selected)" : ""}`}
      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-md text-xs font-bold flex items-center justify-center transition-all select-none touch-manipulation ${
        isTaken
          ? "bg-muted-foreground/25 cursor-not-allowed text-muted-foreground/40"
          : isSelected
          ? "bg-primary text-primary-foreground scale-105 shadow-md shadow-primary/30 ring-2 ring-primary/50"
          : "border-2 border-border hover:border-primary hover:bg-primary/10 active:scale-95 cursor-pointer"
      }`}
    >
      {seat}
    </button>
  );
}
