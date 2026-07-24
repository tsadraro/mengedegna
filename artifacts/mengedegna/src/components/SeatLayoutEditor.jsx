import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Settings2, Check, Loader2, ChevronDown, ChevronUp } from "lucide-react";

const PRESETS = [
  { label: "2+2 Standard (51 seats)", left: 2, right: 2, rows: 13 },
  { label: "2+1 Executive (39 seats)", left: 2, right: 1, rows: 13 },
  { label: "1+1 VIP (26 seats)", left: 1, right: 1, rows: 13 },
  { label: "2+3 High-Capacity (65 seats)", left: 2, right: 3, rows: 13 },
];

function BusPreview({ left, right, rows, gapRows }) {
  const totalSeats = rows * (left + right);
  const seatsPerRow = left + right;
  return (
    <div className="bg-secondary/40 border border-border rounded-t-3xl rounded-b-sm p-4 max-w-[200px] mx-auto">
      <div className="flex justify-center mb-3">
        <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-muted-foreground/40" />
        </div>
      </div>
      <div className="space-y-1.5">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx}>
            {gapRows.includes(rowIdx + 1) && (
              <div className="h-2 flex items-center justify-center mb-1">
                <div className="w-full h-px border-t border-dashed border-border/60" />
              </div>
            )}
            <div className="flex items-center justify-center gap-1.5">
              <div className="flex gap-1">
                {Array.from({ length: left }).map((_, i) => (
                  <div key={i} className="w-5 h-5 rounded-sm border border-border bg-secondary/60" />
                ))}
              </div>
              <div className="w-4" />
              <div className="flex gap-1">
                {Array.from({ length: right }).map((_, i) => (
                  <div key={i} className="w-5 h-5 rounded-sm border border-border bg-secondary/60" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-center font-mono text-[9px] text-muted-foreground">{totalSeats} SEATS</div>
    </div>
  );
}

export default function SeatLayoutEditor({ route, onSaved }) {
  const existing = route.seat_layout || {};
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState(existing.left_cols ?? 2);
  const [right, setRight] = useState(existing.right_cols ?? 2);
  const [rows, setRows] = useState(existing.rows ?? Math.ceil((route.total_seats || 51) / 4));
  const [gapRows, setGapRows] = useState(existing.gap_rows ?? []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const totalSeats = rows * (left + right);

  const applyPreset = (preset) => {
    setLeft(preset.left);
    setRight(preset.right);
    setRows(preset.rows);
    setSaved(false);
  };

  const toggleGapRow = (rowNum) => {
    setGapRows((prev) =>
      prev.includes(rowNum) ? prev.filter((r) => r !== rowNum) : [...prev, rowNum].sort((a, b) => a - b)
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Route.update(route.id, {
      seat_layout: { left_cols: left, right_cols: right, rows, gap_rows: gapRows },
      total_seats: totalSeats,
    });
    setSaving(false);
    setSaved(true);
    onSaved?.({ ...route, seat_layout: { left_cols: left, right_cols: right, rows, gap_rows: gapRows }, total_seats: totalSeats });
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="mt-4 border-t border-border pt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
      >
        <Settings2 className="w-3.5 h-3.5" />
        SEAT LAYOUT
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {existing.left_cols && (
          <span className="ml-1 text-primary/70">{existing.left_cols}+{existing.right_cols} · {route.total_seats} seats</span>
        )}
      </button>

      {open && (
        <div className="mt-4 grid lg:grid-cols-[1fr_180px] gap-6 animate-liquid">
          <div className="space-y-5">
            {/* Presets */}
            <div>
              <label className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground block mb-2">QUICK PRESETS</label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p)}
                    className={`text-xs px-3 py-1.5 rounded-sm border transition-all ${
                      left === p.left && right === p.right && rows === p.rows
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual controls */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground block mb-2">LEFT SEATS/ROW</label>
                <input
                  type="number" min={1} max={3} value={left}
                  onChange={(e) => { setLeft(Math.max(1, Math.min(3, +e.target.value))); setSaved(false); }}
                  className="w-full bg-secondary border border-border rounded-sm px-3 py-2 font-mono text-sm font-bold text-center focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground block mb-2">RIGHT SEATS/ROW</label>
                <input
                  type="number" min={1} max={3} value={right}
                  onChange={(e) => { setRight(Math.max(1, Math.min(3, +e.target.value))); setSaved(false); }}
                  className="w-full bg-secondary border border-border rounded-sm px-3 py-2 font-mono text-sm font-bold text-center focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground block mb-2">ROWS</label>
                <input
                  type="number" min={1} max={30} value={rows}
                  onChange={(e) => { setRows(Math.max(1, Math.min(30, +e.target.value))); setSaved(false); }}
                  className="w-full bg-secondary border border-border rounded-sm px-3 py-2 font-mono text-sm font-bold text-center focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Gap rows (emergency exits) */}
            <div>
              <label className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground block mb-2">
                EMERGENCY EXIT GAPS — click a row number to add/remove a gap above it
              </label>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: rows }, (_, i) => i + 1).map((rowNum) => (
                  <button
                    key={rowNum}
                    onClick={() => toggleGapRow(rowNum)}
                    className={`w-7 h-7 rounded-sm text-[10px] font-mono transition-all ${
                      gapRows.includes(rowNum)
                        ? "bg-accent/20 border border-accent/60 text-accent"
                        : "border border-border text-muted-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    {rowNum}
                  </button>
                ))}
              </div>
              {gapRows.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Gaps above rows: {gapRows.join(", ")}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-sm hover:brightness-110 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4" /> Saved</> : "Save Layout"}
              </button>
              <span className="font-mono text-xs text-muted-foreground">
                Total: <span className="text-foreground font-bold">{totalSeats}</span> seats
              </span>
            </div>
          </div>

          {/* Live preview */}
          <div>
            <label className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground block mb-2">PREVIEW</label>
            <BusPreview left={left} right={right} rows={Math.min(rows, 10)} gapRows={gapRows} />
            {rows > 10 && (
              <p className="text-[10px] text-muted-foreground text-center mt-1">Preview shows first 10 rows</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}