import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { OPERATOR_PROFILES } from "@/lib/operatorProfiles";
import { Bus, Star, ShieldCheck, ArrowRight, Zap } from "lucide-react";

const CLASS_BADGE = {
  luxury:     { label: "LUXURY",    cls: "border-primary/50 text-primary bg-primary/10" },
  electric:   { label: "ELECTRIC",  cls: "border-accent/50 text-accent bg-accent/10" },
  established:{ label: "ESTABLISHED", cls: "border-muted-foreground/40 text-muted-foreground bg-secondary" },
  regional:   { label: "REGIONAL",  cls: "border-border text-muted-foreground bg-secondary" },
};

export default function OperatorsPage() {
  const operators = Object.values(OPERATOR_PROFILES).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-32 pb-14 bg-secondary/30 border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 topo-bg" />
        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative">
          <div className="font-mono text-[11px] tracking-[0.3em] text-primary mb-4">TRUSTED OPERATORS</div>
          <h1 className="heading-mega text-4xl sm:text-6xl mb-4">
            Our Bus <span className="gold-text">Partners</span>
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
            Every operator on Abyssinian Kinetics is vetted for safety, reliability, and passenger experience.
            Explore each operator's fleet, ratings, and certifications.
          </p>
        </div>
      </section>

      {/* Operator grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {operators.map((op) => {
              const badge = CLASS_BADGE[op.klass] || CLASS_BADGE.regional;
              return (
                <Link
                  key={op.slug}
                  to={`/operators/${op.slug}`}
                  className="group bg-card border border-border rounded-sm p-6 hover:border-primary/60 transition-all flex flex-col gap-4"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-sm bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                      {op.klass === "electric" ? (
                        <Zap className="w-6 h-6 text-accent" />
                      ) : (
                        <Bus className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <span className={`font-mono text-[9px] tracking-[0.2em] font-bold px-2 py-1 border rounded-sm ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Name & tagline */}
                  <div>
                    <h3 className="font-display font-bold text-lg leading-tight group-hover:text-primary transition-colors">{op.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{op.tagline}</p>
                  </div>

                  {/* Ratings */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: "SAFETY", val: op.safetyRating },
                      { label: "SERVICE", val: op.passengerRating },
                      { label: "TIMING", val: op.punctualityRating },
                    ].map((r) => (
                      <div key={r.label} className="bg-secondary/60 rounded-sm py-2">
                        <div className="flex items-center justify-center gap-0.5 mb-0.5">
                          <Star className="w-3 h-3 text-primary fill-primary" />
                          <span className="font-mono font-bold text-sm">{r.val}</span>
                        </div>
                        <div className="font-mono text-[8px] tracking-wider text-muted-foreground">{r.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Quick facts */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3 mt-auto">
                    <span>Est. {op.est}</span>
                    <span>{op.fleetSize}</span>
                    <span className="flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all">
                      View profile <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-12 border-t border-border bg-secondary/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: <ShieldCheck className="w-6 h-6 text-primary mx-auto mb-3" />, label: "ETA Certified", sub: "All operators meet Ethiopian Transport Authority standards" },
              { icon: <Star className="w-6 h-6 text-primary mx-auto mb-3 fill-primary" />, label: "Passenger Rated", sub: "Real ratings from verified travellers on our platform" },
              { icon: <Bus className="w-6 h-6 text-primary mx-auto mb-3" />, label: "Fleet Verified", sub: "Bus models, capacity, and safety features independently reviewed" },
            ].map((item) => (
              <div key={item.label}>
                {item.icon}
                <div className="font-display font-bold text-sm mb-1">{item.label}</div>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}