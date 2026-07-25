import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeftRight, Search, Calendar } from "lucide-react";
import { CITIES } from "@/lib/transportData";
import { useLang } from "@/lib/LanguageContext";

// Popular quick-search pairs shown as chips
const POPULAR_ROUTES = [
  { from: "Addis Ababa", to: "Bahir Dar" },
  { from: "Addis Ababa", to: "Hawassa" },
  { from: "Addis Ababa", to: "Mekelle" },
  { from: "Addis Ababa", to: "Dire Dawa" },
  { from: "Bahir Dar",   to: "Gondar" },
  { from: "Addis Ababa", to: "Jimma" },
];

export default function SearchDeck({ compact = false }) {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tripType, setTripType] = useState("oneway");
  const [date, setDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const swap = () => { setFrom(to); setTo(from); };

  const search = (overrideFrom, overrideTo) => {
    const f = overrideFrom ?? from;
    const t2 = overrideTo ?? to;
    const params = new URLSearchParams();
    if (f) params.set("from", f);
    if (t2) params.set("to", t2);
    if (date) params.set("date", date);
    params.set("tripType", tripType);
    if (tripType === "roundtrip" && returnDate) params.set("returnDate", returnDate);
    navigate(`/routes?${params.toString()}`);
  };

  const quickSearch = (route) => {
    setFrom(route.from);
    setTo(route.to);
    search(route.from, route.to);
  };

  const selectCls = "w-full bg-card border-2 border-border rounded-sm px-4 py-4 text-base focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer";

  return (
    <div className={`glass rounded-sm ${compact ? "p-5" : "p-6 sm:p-8"} w-full`}>

      {/* Trip type toggle */}
      <div className="flex gap-2 mb-6">
        {[
          { value: "oneway",    label: lang === "am" ? "አንድ አቅጣጫ" : lang === "or" ? "Karaa Tokko" : "One Way",    icon: <ArrowRight className="w-4 h-4" /> },
          { value: "roundtrip", label: lang === "am" ? "ወደ ኋላ መምጣት" : lang === "or" ? "Deebii" : "Round Trip", icon: <ArrowLeftRight className="w-4 h-4" /> },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTripType(opt.value)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-semibold transition-all flex-1 sm:flex-initial justify-center ${
              tripType === opt.value
                ? "bg-primary text-primary-foreground shadow-md"
                : "border-2 border-border text-muted-foreground hover:border-primary/60 hover:text-foreground"
            }`}
          >
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>

      {/* City pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center mb-4">
        {/* From */}
        <div className="relative">
          <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            {t("departingFrom")}
          </label>
          <select value={from} onChange={(e) => setFrom(e.target.value)} className={selectCls}>
            <option value="">{t("selectOrigin")}</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="pointer-events-none absolute right-3 top-[60%] -translate-y-1/2 text-muted-foreground">▾</div>
        </div>

        {/* Swap button */}
        <div className="flex items-end justify-center pb-1">
          <button
            onClick={swap}
            title="Swap cities"
            className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center hover:bg-primary/10 hover:border-primary transition-all mt-6"
          >
            <ArrowLeftRight className="w-4 h-4 text-primary" />
          </button>
        </div>

        {/* To */}
        <div className="relative">
          <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            {t("arrivingAt")}
          </label>
          <select value={to} onChange={(e) => setTo(e.target.value)} className={selectCls}>
            <option value="">{t("selectDestination")}</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="pointer-events-none absolute right-3 top-[60%] -translate-y-1/2 text-muted-foreground">▾</div>
        </div>
      </div>

      {/* Date + Search */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {tripType === "roundtrip"
              ? (lang === "am" ? "የሚነሱበት ቀን" : "Departure Date")
              : (lang === "am" ? "የጉዞ ቀን" : "Travel Date")}
          </label>
          <input
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-card border-2 border-border rounded-sm px-4 py-4 text-base focus:outline-none focus:border-primary transition-colors [color-scheme:dark]"
          />
        </div>

        {/* Search button */}
        <button
          onClick={() => search()}
          className="bg-primary text-primary-foreground font-bold px-8 py-4 rounded-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all text-base w-full sm:w-auto"
        >
          <Search className="w-5 h-5" strokeWidth={2.5} />
          {t("searchRoutes")}
        </button>
      </div>

      {/* Return date (round trip) */}
      {tripType === "roundtrip" && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {lang === "am" ? "የሚመለሱበት ቀን" : "Return Date"}
          </label>
          <input
            type="date"
            min={date || today}
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            className="w-full bg-card border-2 border-border rounded-sm px-4 py-4 text-base focus:outline-none focus:border-primary transition-colors [color-scheme:dark]"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {lang === "am"
              ? `ሄዶ መምጣት: ከ ${to || "…"} ወደ ${from || "…"}`
              : `Return trips from ${to || "destination"} → ${from || "origin"} shown after outbound seat selection.`}
          </p>
        </div>
      )}

      {/* Popular routes */}
      {!compact && (
        <div className="mt-6 pt-5 border-t border-border/40">
          <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">
            {lang === "am" ? "ታዋቂ መስመሮች" : lang === "or" ? "Karaalee Beekamoo" : "Popular Routes"}
          </p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_ROUTES.map((r) => (
              <button
                key={`${r.from}-${r.to}`}
                onClick={() => quickSearch(r)}
                className="text-xs border border-border hover:border-primary hover:text-primary hover:bg-primary/5 text-muted-foreground px-3 py-2 rounded-sm transition-all flex items-center gap-1.5"
              >
                {r.from} <ArrowRight className="w-3 h-3" /> {r.to}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
