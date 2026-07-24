import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useReveal } from "@/hooks/useReveal";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchDeck from "@/components/SearchDeck";
import RouteCard from "@/components/RouteCard";
import { CITIES } from "@/lib/transportData";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import { useLang } from "@/lib/LanguageContext";

export default function RoutesPage() {
  const kickerRef = useReveal(0.2, 0);
  const titleRef  = useReveal(0.2, 80);
  const [params] = useSearchParams();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(params.get("from") || "");
  const [to, setTo] = useState(params.get("to") || "");
  const [sort, setSort] = useState("operator");
  const [klass, setKlass] = useState("all");
  const { t } = useLang();

  useEffect(() => {
    setLoading(true);
    const query = {};
    if (from) query.from_city = from;
    if (to) query.to_city = to;
    base44.entities.Route.filter(query, "-departure_time", 50)
      .then((data) => {
        setRoutes(data || []);
        setLoading(false);
      })
      .catch(() => { setRoutes([]); setLoading(false); });
  }, [from, to]);

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
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filtered.map((r) => <RouteCard key={r.id} route={r} />)}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}