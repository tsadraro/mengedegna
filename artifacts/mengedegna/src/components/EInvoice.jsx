import React, { useMemo } from "react";
import { Download, Send, ShieldAlert, Bus, Clock, Calendar, Armchair } from "lucide-react";
import { getRefundPolicyForBooking } from "@/lib/refundPolicy";

function genQR(data) {
  // Simple block QR-style matrix visual (not scannable — visual artifact)
  const size = 21;
  const cells = [];
  let h = 0;
  for (let i = 0; i < data.length; i++) h = (h * 31 + data.charCodeAt(i)) >>> 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const corner = (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);
      let on;
      if (corner) {
        const inFrame = (r === 0 || r === 6 || c === 0 || c === 6) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        on = inFrame;
      } else {
        on = ((h >> ((r * c) % 31)) & 1) === 1;
        h = (h * 1103515245 + 12345) & 0x7fffffff;
      }
      cells.push(on);
    }
  }
  return cells;
}

export default function EInvoice({ booking, route }) {
  const qrCells = useMemo(() => genQR(booking.invoice_number || "AK-INVOICE"), [booking.invoice_number]);
  const save = () => window.print();

  const policy = getRefundPolicyForBooking(
    booking.departure_date,
    booking.departure_time
  );
  const stampColorMap = {
    accent: "border-accent text-accent",
    primary: "border-primary text-primary",
    destructive: "border-destructive text-destructive",
  };

  return (
    <div className="animate-liquid max-w-2xl mx-auto">
      <div className="relative bg-card border-2 border-primary/40 rounded-sm overflow-hidden">
        {/* Refund policy stamp */}
        <div className="absolute top-6 right-6 rotate-[-8deg] z-10">
          <div className={`border-2 px-3 py-1 font-mono font-bold text-xs tracking-[0.15em] bg-card/80 ${stampColorMap[policy.color]}`}>
            {policy.label}
          </div>
        </div>

        {/* Header */}
        <div className="bg-primary text-primary-foreground px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bus className="w-7 h-7" strokeWidth={2.2} />
            <div className="leading-none">
              <div className="font-display font-extrabold tracking-tight text-lg">MEDA KINETICS</div>
              <div className="font-mono text-[9px] tracking-[0.3em] opacity-80">TRAVEL PASSPORT · E-INVOICE</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">INVOICE NO.</div>
              <div className="font-mono font-bold text-sm text-primary">{booking.invoice_number}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">STATUS</div>
              <div className="font-mono font-bold text-sm text-accent">PAID · CONFIRMED</div>
            </div>
          </div>

          {/* Journey */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-8 border-y border-dashed border-border">
            <div>
              <div className="font-display font-extrabold text-2xl">{booking.from_city}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Clock className="w-3 h-3" />{booking.departure_time}</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="font-mono text-[10px] text-muted-foreground">{route?.duration || "—"}</div>
              <div className="w-20 h-px bg-primary my-1" />
              <Bus className="w-4 h-4 text-primary" />
            </div>
            <div className="text-right">
              <div className="font-display font-extrabold text-2xl">{booking.to_city}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-end gap-1 mt-1">{booking.arrival_time}<Clock className="w-3 h-3 ml-1" /></div>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 mt-8 font-mono text-xs">
            <Detail label="PASSENGER" value={booking.passenger_name} />
            <Detail label="PHONE" value={`+251 ${booking.phone}`} />
            <Detail label="OPERATOR" value={booking.operator} icon={<Bus className="w-3 h-3" />} />
            <Detail label="BUS TYPE" value={route?.bus_type || "—"} />
            <Detail label="DATE" value={booking.departure_date} icon={<Calendar className="w-3 h-3" />} />
            <Detail label="SEAT" value={booking.seat_number} icon={<Armchair className="w-3 h-3" />} />
            <Detail label="FARE" value={`${booking.fare?.toLocaleString()} ETB`} />
            <Detail label="PAYMENT" value="TELEBIRR" />
          </div>

          {/* Footer: QR + terms */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-dashed border-border">
            <div className="flex items-center gap-4">
              <div className="grid grid-cols-21 gap-0" style={{ gridTemplateColumns: "repeat(21, 1fr)" }}>
                {qrCells.map((on, i) => (
                  <div key={i} className={on ? "bg-foreground" : "bg-transparent"} style={{ width: 4, height: 4 }} />
                ))}
              </div>
              <div>
                <div className="font-mono text-[9px] text-muted-foreground">SCAN AT BOARDING</div>
                <div className="font-mono text-[9px] text-primary">VALID ID REQUIRED</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-display font-extrabold text-2xl">{booking.fare?.toLocaleString()}<span className="text-xs text-muted-foreground ml-1">ETB</span></div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="grid grid-cols-3 gap-2 font-mono text-[9px] text-center">
              <div className={`p-2 border rounded-sm ${policy.pct === 100 ? "border-accent/60 text-accent bg-accent/10" : "border-border text-muted-foreground"}`}>
                <div className="font-bold">FULL REFUND</div>
                <div className="opacity-70">&gt; 24h before</div>
              </div>
              <div className={`p-2 border rounded-sm ${policy.pct === 50 ? "border-primary/60 text-primary bg-primary/10" : "border-border text-muted-foreground"}`}>
                <div className="font-bold">50% REFUND</div>
                <div className="opacity-70">18h – 24h before</div>
              </div>
              <div className={`p-2 border rounded-sm ${policy.pct === 0 ? "border-destructive/60 text-destructive bg-destructive/10" : "border-border text-muted-foreground"}`}>
                <div className="font-bold">NO REFUND</div>
                <div className="opacity-70">&lt; 18h before</div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 border border-border/50 bg-secondary/40 rounded-sm">
              <ShieldAlert className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Cancellation policy applied at booking time: <span className={`font-semibold ${policy.color === "accent" ? "text-accent" : policy.color === "primary" ? "text-primary" : "text-destructive"}`}>{policy.description}</span>{" "}
                This ticket is non-transferable. Present this QR code with valid identification at boarding 30 minutes before departure.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-5">
        <button onClick={save} className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all">
          <Download className="w-4 h-4" /> Save to Photos
        </button>
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(booking.invoice_number)}&text=${encodeURIComponent("My Abyssinian Kinetics ticket")}`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 border border-border text-foreground font-semibold py-3 rounded-sm flex items-center justify-center gap-2 hover:border-primary transition-all"
        >
          <Send className="w-4 h-4" /> Send to Telegram
        </a>
      </div>
    </div>
  );
}

function Detail({ label, value, icon }) {
  return (
    <div>
      <div className="text-[9px] tracking-[0.2em] text-muted-foreground mb-1 flex items-center gap-1">{icon}{label}</div>
      <div className="font-bold text-foreground uppercase tracking-wide">{value}</div>
    </div>
  );
}