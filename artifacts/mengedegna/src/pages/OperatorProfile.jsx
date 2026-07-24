import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getOperatorBySlug, SEATING_RULE } from "@/lib/operatorProfiles";
import OperatorReviews from "@/components/OperatorReviews";
import FleetGallery from "@/components/FleetGallery";
import { base44 } from "@/api/base44Client";
import {
  Bus, Star, ShieldCheck, ArrowRight, Zap, MapPin, Calendar,
  Users, Layers, Award, CheckCircle, Wifi, Wind, Armchair,
  Tv, Plug, Bath, Coffee, Leaf
} from "lucide-react";

const CLASS_BADGE = {
  luxury:     { label: "LUXURY CLASS",    cls: "border-primary/50 text-primary bg-primary/10" },
  electric:   { label: "ELECTRIC FLEET",  cls: "border-accent/50 text-accent bg-accent/10" },
  established:{ label: "ESTABLISHED",     cls: "border-muted-foreground/40 text-muted-foreground bg-secondary" },
  regional:   { label: "REGIONAL",        cls: "border-border text-muted-foreground bg-secondary" },
};

const AMENITY_ICONS = {
  "Air Conditioning": Wind,
  "Reclining Seats": Armchair,
  "2x2 Reclining": Armchair,
  "Comfortable Seating": Armchair,
  "Entertainment": Tv,
  "Safety Belts": ShieldCheck,
  "Free Wi-Fi": Wifi,
  "Wi-Fi": Wifi,
  "Charging Ports": Plug,
  "Chargers": Plug,
  "Toilet": Bath,
  "Breakfast": Coffee,
  "100% Electric": Zap,
  "Zero Emissions": Leaf,
  "Premium Seating": Armchair,
};

function StarRating({ value, max = 5 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < Math.round(value) ? "text-primary fill-primary" : "text-border"}`}
        />
      ))}
      <span className="font-mono font-bold text-sm ml-1">{value}</span>
    </div>
  );
}

export default function OperatorProfile() {
  const { slug } = useParams();
  const op = getOperatorBySlug(slug);
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

  if (!op) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Bus className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="font-display text-xl mb-2">Operator not found.</p>
          <Link to="/operators" className="text-primary hover:underline">View all operators</Link>
        </div>
      </div>
    );
  }

  const badge = CLASS_BADGE[op.klass] || CLASS_BADGE.regional;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-14 bg-secondary/30 border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 topo-bg" />
        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative">
          <Link to="/operators" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-6 font-mono">
            ← ALL OPERATORS
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-sm bg-card border border-border flex items-center justify-center flex-shrink-0">
                {op.klass === "electric" ? (
                  <Zap className="w-8 h-8 text-accent" />
                ) : (
                  <Bus className="w-8 h-8 text-primary" />
                )}
              </div>
              <div>
                <span className={`font-mono text-[9px] tracking-[0.2em] font-bold px-2 py-1 border rounded-sm ${badge.cls}`}>
                  {badge.label}
                </span>
                <h1 className="heading-mega text-4xl sm:text-5xl mt-2">{op.name}</h1>
                <p className="text-muted-foreground mt-2 text-sm max-w-xl">{op.tagline}</p>
              </div>
            </div>
            <Link
              to={`/routes?operator=${encodeURIComponent(op.name)}`}
              className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-sm hover:brightness-110 transition-all flex items-center gap-2 whitespace-nowrap self-end"
            >
              Book a Seat <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14 space-y-14">

        {/* Key stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: <Calendar className="w-5 h-5 text-primary" />, label: "Est.", value: op.est },
            { icon: <Layers className="w-5 h-5 text-primary" />, label: "Fleet", value: op.fleetSize },
            { icon: <Users className="w-5 h-5 text-primary" />, label: "Team", value: op.employees },
            { icon: <Bus className="w-5 h-5 text-primary" />, label: "Trips Completed", value: op.totalTrips },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-sm p-5">
              <div className="flex items-center gap-2 mb-2">{s.icon}<span className="font-mono text-[9px] tracking-wider text-muted-foreground">{s.label.toUpperCase()}</span></div>
              <div className="font-display font-extrabold text-xl">{s.value}</div>
            </div>
          ))}
        </div>

        {/* About + Ratings */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-10">
          <div>
            <h2 className="font-display font-bold text-2xl mb-4">About {op.name}</h2>
            <p className="text-muted-foreground leading-relaxed">{op.desc}</p>

            {/* Routes */}
            <h3 className="font-display font-bold text-base mt-8 mb-3">Operated Routes</h3>
            <div className="flex flex-wrap gap-2">
              {op.routes.map((r) => (
                <span key={r} className="flex items-center gap-1.5 text-xs border border-border bg-secondary/60 px-3 py-1.5 rounded-sm text-muted-foreground">
                  <MapPin className="w-3 h-3 text-primary" />{r}
                </span>
              ))}
            </div>

            {/* Certifications */}
            <h3 className="font-display font-bold text-base mt-8 mb-3">Certifications</h3>
            <div className="space-y-2">
              {op.certifications.map((c) => (
                <div key={c} className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ratings card */}
          <div className="bg-card border border-border rounded-sm p-6 h-fit">
            <h3 className="font-display font-bold text-base mb-5">Passenger Ratings</h3>
            <div className="space-y-4">
              {[
                { label: "Safety", val: op.safetyRating },
                { label: "Service Quality", val: op.passengerRating },
                { label: "Punctuality", val: op.punctualityRating },
              ].map((r) => (
                <div key={r.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{r.label}</span>
                    <span className="font-mono font-bold text-sm text-primary">{r.val}/5</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(r.val / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-border">
              <div className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground mb-2">OVERALL RATING</div>
              <StarRating value={((op.safetyRating + op.passengerRating + op.punctualityRating) / 3).toFixed(1) * 1} />
            </div>
          </div>
        </div>

        {/* Fleet Gallery */}
        {op.gallery?.length > 0 && (
          <FleetGallery images={op.gallery} operatorName={op.name} />
        )}

        {/* Fleet */}
        <div>
          <h2 className="font-display font-bold text-2xl mb-6">Bus Fleet</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {op.fleet.map((bus, i) => (
              <div key={i} className="bg-card border border-border rounded-sm p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-sm bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                    <Bus className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-mono text-[9px] tracking-wider text-muted-foreground border border-border px-2 py-1 rounded-sm">{bus.type}</span>
                </div>
                <h4 className="font-display font-bold text-sm leading-snug">{bus.model}</h4>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  {[
                    { label: "UNITS", val: bus.count },
                    { label: "SEATS", val: bus.capacity },
                    { label: "YEAR", val: bus.year },
                  ].map((d) => (
                    <div key={d.label} className="bg-secondary/60 rounded-sm py-2 px-1">
                      <div className="font-mono font-bold text-sm">{d.val}</div>
                      <div className="font-mono text-[8px] tracking-wider text-muted-foreground mt-0.5">{d.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Amenities + Safety */}
        <div className="grid lg:grid-cols-2 gap-10">
          <div>
            <h2 className="font-display font-bold text-2xl mb-6">Onboard Amenities</h2>
            <div className="grid grid-cols-2 gap-3">
              {op.amenities.map((a) => {
                const Icon = AMENITY_ICONS[a] || CheckCircle;
                return (
                  <div key={a} className="flex items-center gap-3 bg-card border border-border rounded-sm px-4 py-3">
                    <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{a}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl mb-6">Safety Standards</h2>
            <div className="space-y-3">
              {op.safetyFeatures.map((f) => (
                <div key={f} className="flex items-start gap-3 text-sm">
                  <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Seating Rule */}
        <div className="border border-border rounded-sm p-6 bg-secondary/30 flex items-start gap-4">
          <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <Armchair className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-mono text-[9px] tracking-[0.25em] text-muted-foreground mb-1">SEATING POLICY</div>
            <h4 className="font-display font-bold text-sm mb-1">{SEATING_RULE.label}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{SEATING_RULE.description}</p>
          </div>
        </div>

        {/* Reviews */}
        <OperatorReviews operatorSlug={op.slug} operatorName={op.name} currentUser={currentUser} />

        {/* CTA */}
        <div className="border border-primary/30 bg-primary/5 rounded-sm p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="font-mono text-[10px] tracking-[0.3em] text-primary mb-2">READY TO TRAVEL?</div>
            <h3 className="font-display font-bold text-xl">Book your seat with {op.name}</h3>
            <p className="text-muted-foreground text-sm mt-1">Secure Telebirr payment · Instant e-ticket · 30-day support</p>
          </div>
          <Link
            to={`/routes?operator=${encodeURIComponent(op.name)}`}
            className="bg-primary text-primary-foreground font-semibold px-8 py-3.5 rounded-sm hover:brightness-110 transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0"
          >
            View Routes <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}