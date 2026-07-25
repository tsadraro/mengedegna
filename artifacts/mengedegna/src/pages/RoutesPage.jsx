import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useReveal } from "@/hooks/useReveal";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchDeck from "@/components/SearchDeck";
import RouteCard from "@/components/RouteCard";
import { CITIES } from "@/lib/transportData";
import { SlidersHorizontal, Loader2, ArrowLeftRight } from "lucide-react";
import { useLang } from "@/lib/LanguageContext";

export default function RoutesPage() {
  const kickerRef = useReveal(0.2, 0);
  const titleRef  = useReveal(0.2, 80);
  const [params] = useSearchParams();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(params.get("from") || "");
  const [to, setTo] = useState(params.get("to") || "");
  const [date, setDate] = useState(params.get("date") || "");
  const [tripType] = useState(params.get("tripType") || "oneway");
  const [returnDate] = useState(params.get("returnDate") || "");
  const [sort, setSort] = useState("operator");
  const [klass, setKlass] = useState("all");
  const { t } = useLang();

  useEffect(() => {
    setLoading(true);
    const query = {};
    if (from) query.from_city = from;
    if (to) query.to_city = to;
    if (date) query.departure_date = date;
    base44.entities.Route.filter(query, "-departure_time", 50)
      .then((data) => {
        setRoutes(data || []);
        setLoading(false);
      })
      .catch(() => { setRoutes([]); setLoading(false); });
  }, [from, to, date]);

  const filtered = useMemo(() => {
    let list = routes;
    if (klass !== "all") list = list.filter((r) => r.operator_class === klass);
    const sorted = [...list].sort((a, b) => {
      if (sort === "operator") return (a.operator_name || a.operator || "").localeCompare(b.operator_name || b.operator || "");
      if (sort === "earliest") return (a.departure_time || "").localeCompare(b.departure_time || "");
      if (sort === "cheapest") return a.fare - b.fare;
      if (sort === "fastest") return (a.duration || "").localeCompare(b.duration || "");
      return 0;
    });
    return sorted;
  }, [routes, klass, sort]);

  // Friendly label for the active search
  const searchLabel = [
    from && to ? `${from} → ${to}` : from ? `From ${from}` : to ? `To ${to}` : null,
    date ? new Date(date + "T12:00:00").toLocaleDateString("en-ET", { weekday: "short", month: "short", day: "numeric" }) : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-12 bg-secondary/30 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div ref={kickerRef} className="reveal-kicker font-mono text-[11px] tracking-[0.3em] text-primary mb-3">THE CHRONOLOGY GRID</div>
          <h1 ref={titleRef} className="reveal heading-mega text-4xl sm:text-5xl mb-8">{t("routesSchedules")}</h1>
          <SearchDeck compact />
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">

          {/* Round-trip notice */}
          {tripType === "roundtrip" && returnDate && (
            <div className="mb-6 flex items-center gap-3 border border-primary/30 bg-primary/5 rounded-sm px-5 py-3">
              <ArrowLeftRight className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">Round trip selected.</span>{" "}
                Pick your outbound trip below. After booking, you'll be prompted to book your return from{" "}
                <span className="font-medium text-foreground">{to} → {from}</span> on{" "}
                <span className="font-medium text-foreground">{returnDate}</span>.
              </p>
            </div>
          )}

          {/* Active search summary */}
          {searchLabel && !loading && (
            <p className="text-xs font-mono text-muted-foreground mb-4">
              SHOWING RESULTS FOR · <span className="text-foreground">{searchLabel}</span>
            </p>
          )}

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              <select value={klass} onChange={(e) => setKlass(e.target.value)} className="bg-card border border-border rounded-sm px-3 py-2 text-sm focus:border-primary focus:outline-none">
                <option value="all" className="bg-card">{t("allClasses")}</option>
                <option value="luxury" className="bg-card">{t("luxury")}</option>
                <option value="established" className="bg-card">{t("established")}</option>
                <option value="electric" className="bg-card">{t("electric")}</option>
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-card border border-border rounded-sm px-3 py-2 text-sm focus:border-primary focus:outline-none">
                <option value="operator" className="bg-card">Operator A→Z</option>
                <option value="earliest" className="bg-card">{t("earliest")}</option>
                <option value="cheapest" className="bg-card">{t("cheapest")}</option>
                <option value="fastest" className="bg-card">{t("fastest")}</option>
              </select>
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              {loading ? t("loading") : `${filtered.length} ${t("departures")}`}
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="font-display text-xl mb-2">{t("noRoutes")}</p>
              <p className="text-sm">{t("tryDifferent")}</p>
              {date && (
                <p className="text-xs mt-3 text-muted-foreground/70">
                  Try selecting a different date — departures are available on specific days only.
                </p>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filtered.map((r) => (
                <RouteCard
                  key={r.id}
                  route={r}
                  returnDate={tripType === "roundtrip" ? returnDate : null}
                  returnFrom={tripType === "roundtrip" ? to : null}
                  returnTo={tripType === "roundtrip" ? from : null}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
