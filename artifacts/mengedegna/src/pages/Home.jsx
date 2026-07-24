import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchDeck from "@/components/SearchDeck";
import RouteCard from "@/components/RouteCard";
import { OPERATORS } from "@/lib/transportData";
import { ArrowRight, ShieldCheck, Zap, Ticket, Clock, Bus, Mountain } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";

const HERO_IMG = "https://media.base44.com/images/public/6a603a5ceb9c5421336a0b91/ebdd2d10a_generated_8c3c09fb.png";
const SEAT_IMG = "https://media.base44.com/images/public/6a603a5ceb9c5421336a0b91/8fef97f4c_generated_73747ac9.png";
const TERMINAL_IMG = "https://media.base44.com/images/public/6a603a5ceb9c5421336a0b91/cb4ae7e83_generated_859d40ed.png";

export default function Home() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    base44.entities.Route.filter({ featured: true }, "-departure_time", 4)
      .then(setFeatured)
      .catch(() => setFeatured([]));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen flex items-end pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <Image src={HERO_IMG} alt="Luxury coach traversing the Ethiopian Highlands at sunrise" fittingType="fill" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
          <div className="absolute inset-0 topo-bg" />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-3xl mb-10 animate-slide-up">
            <div className="font-mono text-[11px] tracking-[0.3em] text-primary mb-5">THE MOVEMENT ENGINE · HORN OF AFRICA</div>
            <h1 className="heading-mega text-5xl sm:text-6xl lg:text-7xl xl:text-8xl mb-6">
              Traverse the<br />
              <span className="gold-text">Highlands.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed" style={{ lineHeight: 1.7 }}>
              One platform for all of Ethiopia — every culture, every region, every faith. Search live routes, select your seat, and pay with Telebirr — your e-invoice arrives in seconds.
            </p>
          </div>
          <div className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <SearchDeck />
          </div>
        </div>
      </section>

      {/* FEATURED ROUTES */}
      <section className="py-32 relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px path-line" />
        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative">
          <SectionHeader kicker="THE CHRONOLOGY GRID" title="Featured Journeys" sub="Live departures across the Ethiopian Highlands, updated in real time." />
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {featured.map((r) => <RouteCard key={r.id} route={r} />)}
          </div>
          <div className="text-center mt-10">
            <Link to="/routes" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
              View all routes <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* OPERATORS */}
      <section id="operators" className="py-32 bg-secondary/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <SectionHeader kicker="THE FLEET" title="Operators We Power" sub="From Selam Bus to Velocity Express — Ethiopia's trusted carriers, united on one platform." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {OPERATORS.map((op) => (
              <div key={op.name} className="bg-card border border-border rounded-sm p-7 hover:border-primary/40 transition-all group">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-11 h-11 rounded-sm bg-secondary border border-border flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    {op.klass === "electric" ? <Zap className="w-5 h-5 text-green-400" /> : <Bus className="w-5 h-5 text-primary" />}
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground border border-border px-2 py-1 rounded-sm">{op.klass}</span>
                </div>
                <h3 className="font-display font-bold text-lg mb-1">{op.name}</h3>
                <div className="font-mono text-[10px] text-primary mb-4">EST. {op.est}</div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{op.desc}</p>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Bus className="w-3.5 h-3.5 text-primary/60" />{op.fleet}</div>
                  <div className="flex items-center gap-2"><Mountain className="w-3.5 h-3.5 text-primary/60" />{op.routes}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="about" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionHeader kicker="THE RITUAL" title="Four Steps to the Highlands" sub="No queues. No cash. No uncertainty." align="left" />
              <div className="space-y-8 mt-12">
                {[
                  { n: "01", icon: <Mountain className="w-5 h-5" />, t: "Choose Your Route", d: "Search live departures from Addis Ababa to Bahir Dar, Gondar, Mekelle and beyond." },
                  { n: "02", icon: <Ticket className="w-5 h-5" />, t: "Select Your Seat", d: "View the bus anatomy in real time. Pick your window or aisle — availability is live." },
                  { n: "03", icon: <Zap className="w-5 h-5" />, t: "Pay with Telebirr", d: "A push notification to your Telebirr app. Authorize with your PIN. Seconds, not minutes." },
                  { n: "04", icon: <ShieldCheck className="w-5 h-5" />, t: "Receive Your E-Invoice", d: "A travel passport with a boarding QR — save it, send it to Telegram, and you're ready." },
                ].map((s) => (
                  <div key={s.n} className="flex gap-5">
                    <div className="flex-shrink-0 w-12 h-12 rounded-sm border border-primary/30 bg-primary/5 flex items-center justify-center text-primary">
                      {s.icon}
                    </div>
                    <div>
                      <div className="font-mono text-[10px] text-primary tracking-wider mb-1">STEP {s.n}</div>
                      <h4 className="font-display font-bold text-lg mb-1">{s.t}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-sm overflow-hidden border border-border">
                <Image src={SEAT_IMG} alt="Luxury bus seat interior detail" fittingType="fill" className="w-full h-full" />
              </div>
              <div className="absolute -bottom-8 -left-8 w-2/3 aspect-[4/3] rounded-sm overflow-hidden border-2 border-primary/40 -z-0">
                <Image src={TERMINAL_IMG} alt="Modern Addis Ababa transport terminal" fittingType="fill" className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TERMS BANNER */}
      <section id="terms" className="py-24 bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="font-mono text-[11px] tracking-[0.3em] mb-4 opacity-80">THE LEGAL PULSE · CANCELLATION POLICY</div>
          <h2 className="heading-mega text-4xl sm:text-5xl mb-8">Fair, transparent refunds.</h2>
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
            <div className="border-2 border-primary-foreground/30 bg-primary-foreground/10 rounded-sm p-5 text-center">
              <div className="font-mono font-bold text-xs tracking-wider mb-2 opacity-60">MORE THAN 24 HOURS</div>
              <div className="font-display font-extrabold text-3xl mb-1">FULL</div>
              <div className="font-mono text-xs opacity-70">100% refund</div>
            </div>
            <div className="border-2 border-primary-foreground/60 bg-primary-foreground/20 rounded-sm p-5 text-center">
              <div className="font-mono font-bold text-xs tracking-wider mb-2 opacity-60">18 – 24 HOURS</div>
              <div className="font-display font-extrabold text-3xl mb-1">HALF</div>
              <div className="font-mono text-xs opacity-70">50% refund</div>
            </div>
            <div className="border-2 border-primary-foreground bg-primary-foreground/30 rounded-sm p-5 text-center">
              <div className="font-mono font-bold text-xs tracking-wider mb-2 opacity-60">WITHIN 18 HOURS</div>
              <div className="font-display font-extrabold text-3xl mb-1">NONE</div>
              <div className="font-mono text-xs opacity-70">No refund</div>
            </div>
          </div>
          <p className="text-base opacity-70 max-w-2xl mx-auto" style={{ lineHeight: 1.7 }}>
            Cancellations made 24 hours or more before departure receive a full refund. Cancellations made between 12 and 24 hours before departure receive a 50% refund. Cancellations made less than 12 hours before departure are non-refundable. All tickets are non-transferable.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function SectionHeader({ kicker, title, sub, align = "center" }) {
  const kickerRef = useReveal(0.2, 0);
  const titleRef  = useReveal(0.2, 80);
  const subRef    = useReveal(0.2, 160);
  return (
    <div className={align === "center" ? "text-center max-w-2xl mx-auto" : "max-w-xl"}>
      <div ref={kickerRef} className="reveal-kicker font-mono text-[11px] tracking-[0.3em] text-primary mb-4">{kicker}</div>
      <h2 ref={titleRef} className="reveal heading-mega text-4xl sm:text-5xl mb-4">{title}</h2>
      <p ref={subRef} className="reveal text-muted-foreground text-lg" style={{ lineHeight: 1.7 }}>{sub}</p>
    </div>
  );
}