import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { OPERATOR_PROFILES } from "@/lib/operatorProfiles";
import { Check, X, ChevronDown, ChevronUp, Star, Users, Clock, Zap } from "lucide-react";

const CLASS_BADGE = {
  luxury:     "bg-primary/15 text-primary border-primary/30",
  established:"bg-muted text-muted-foreground border-border",
  regional:   "bg-secondary text-secondary-foreground border-border",
  electric:   "bg-accent/15 text-accent border-accent/30",
};

const ALL_AMENITIES = [
  "Air Conditioning", "Wi-Fi", "Free Wi-Fi", "Charging Ports",
  "Entertainment", "Reclining Seats", "2x2 Reclining", "Toilet",
  "Breakfast", "Safety Belts", "100% Electric",
];

function Stars({ val }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= Math.round(val) ? "text-primary fill-primary" : "text-border"}`} />
      ))}
      <span className="font-mono text-[10px] text-muted-foreground ml-1">{val?.toFixed(1)}</span>
    </span>
  );
}

export default function TripComparison({ currentRoute }) {
  const [alternatives, setAlternatives] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentRoute) return;
    base44.entities.Route.filter({
      from_city: currentRoute.from_city,
      to_city: currentRoute.to_city,
      departure_date: currentRoute.departure_date,
    }).then((routes) => {
      setAlternatives(routes.filter((r) => r.id !== currentRoute.id));
    }).catch(() => {});
  }, [currentRoute?.id]);

  if (!alternatives.length) return null;

  const allRoutes = [currentRoute, ...alternatives];
  const lowestFare = Math.min(...allRoutes.map(r => r.fare));

  return (
    <div className="border border-border rounded-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-secondary/40 hover:bg-secondary/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="font-display font-bold text-sm">Compare Alternatives</span>
          <span className="font-mono text-[10px] text-muted-foreground bg-secondary border border-border px-2 py-0.5 rounded-sm">
            {alternatives.length} other trip{alternatives.length > 1 ? "s" : ""} on this route
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <td className="px-4 py-3 font-mono text-[9px] tracking-[0.2em] text-muted-foreground w-32">DETAILS</td>
                {allRoutes.map((r, i) => (
                  <td key={r.id} className={`px-4 py-3 text-center ${i === 0 ? "bg-primary/5 border-x border-primary/20" : ""}`}>
                    <div className="font-display font-bold text-sm">{r.operator}</div>
                    {i === 0 && <div className="font-mono text-[9px] text-primary tracking-wider mt-0.5">YOUR SELECTION</div>}
                    <div className={`inline-block mt-1 px-2 py-0.5 border rounded-sm font-mono text-[9px] tracking-wider capitalize ${CLASS_BADGE[r.operator_class] || CLASS_BADGE.established}`}>
                      {r.operator_class || "standard"}
                    </div>
                  </td>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {/* Fare */}
              <Row label="FARE">
                {allRoutes.map((r, i) => (
                  <td key={r.id} className={`px-4 py-3 text-center ${i === 0 ? "bg-primary/5 border-x border-primary/20" : ""}`}>
                    <span className={`font-mono font-bold ${r.fare === lowestFare ? "text-accent" : "text-foreground"}`}>
                      {r.fare?.toLocaleString()} ETB
                    </span>
                    {r.fare === lowestFare && <div className="font-mono text-[9px] text-accent">BEST PRICE</div>}
                  </td>
                ))}
              </Row>

              {/* Departure */}
              <Row label="DEPARTS">
                {allRoutes.map((r, i) => (
                  <td key={r.id} className={`px-4 py-3 text-center font-mono ${i === 0 ? "bg-primary/5 border-x border-primary/20" : ""}`}>
                    {r.departure_time}
                  </td>
                ))}
              </Row>

              {/* Duration */}
              <Row label="DURATION">
                {allRoutes.map((r, i) => (
                  <td key={r.id} className={`px-4 py-3 text-center ${i === 0 ? "bg-primary/5 border-x border-primary/20" : ""}`}>
                    <span className="flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      {r.duration || "—"}
                    </span>
                  </td>
                ))}
              </Row>

              {/* Seats available */}
              <Row label="SEATS LEFT">
                {allRoutes.map((r, i) => (
                  <td key={r.id} className={`px-4 py-3 text-center ${i === 0 ? "bg-primary/5 border-x border-primary/20" : ""}`}>
                    <span className={`flex items-center justify-center gap-1 font-mono font-bold ${
                      r.available_seats <= 5 ? "text-destructive" : r.available_seats <= 15 ? "text-primary" : "text-accent"
                    }`}>
                      <Users className="w-3 h-3" />
                      {r.available_seats ?? "—"}
                    </span>
                    {r.available_seats <= 5 && <div className="font-mono text-[9px] text-destructive">FILLING FAST</div>}
                  </td>
                ))}
              </Row>

              {/* Safety rating */}
              <Row label="SAFETY">
                {allRoutes.map((r, i) => {
                  const profile = OPERATOR_PROFILES[r.operator];
                  return (
                    <td key={r.id} className={`px-4 py-3 text-center ${i === 0 ? "bg-primary/5 border-x border-primary/20" : ""}`}>
                      {profile ? <Stars val={profile.safetyRating} /> : <span className="text-muted-foreground">—</span>}
                    </td>
                  );
                })}
              </Row>

              {/* Passenger rating */}
              <Row label="PASSENGER">
                {allRoutes.map((r, i) => {
                  const profile = OPERATOR_PROFILES[r.operator];
                  return (
                    <td key={r.id} className={`px-4 py-3 text-center ${i === 0 ? "bg-primary/5 border-x border-primary/20" : ""}`}>
                      {profile ? <Stars val={profile.passengerRating} /> : <span className="text-muted-foreground">—</span>}
                    </td>
                  );
                })}
              </Row>

              {/* Amenities */}
              {ALL_AMENITIES.map((amenity) => {
                const anyHas = allRoutes.some(r => r.amenities?.includes(amenity));
                if (!anyHas) return null;
                return (
                  <Row key={amenity} label={amenity.toUpperCase()}>
                    {allRoutes.map((r, i) => (
                      <td key={r.id} className={`px-4 py-3 text-center ${i === 0 ? "bg-primary/5 border-x border-primary/20" : ""}`}>
                        {r.amenities?.includes(amenity)
                          ? <Check className="w-4 h-4 text-accent mx-auto" />
                          : <X className="w-4 h-4 text-border mx-auto" />}
                      </td>
                    ))}
                  </Row>
                );
              })}

              {/* Book buttons */}
              <tr className="border-t border-border">
                <td className="px-4 py-4" />
                {allRoutes.map((r, i) => (
                  <td key={r.id} className={`px-4 py-4 text-center ${i === 0 ? "bg-primary/5 border-x border-b border-primary/20" : ""}`}>
                    {i === 0 ? (
                      <span className="font-mono text-[10px] text-primary border border-primary/40 px-3 py-1.5 rounded-sm">
                        CURRENT
                      </span>
                    ) : (
                      <button
                        onClick={() => navigate(`/booking?route=${r.id}`)}
                        className="font-mono text-[10px] bg-secondary hover:bg-primary hover:text-primary-foreground border border-border hover:border-primary px-3 py-1.5 rounded-sm transition-all"
                      >
                        SWITCH →
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }) {
  return (
    <tr>
      <td className="px-4 py-3 font-mono text-[9px] tracking-[0.15em] text-muted-foreground whitespace-nowrap">{label}</td>
      {children}
    </tr>
  );
}