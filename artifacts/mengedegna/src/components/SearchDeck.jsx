import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeftRight, Search, Calendar, User } from "lucide-react";
import { CITIES } from "@/lib/transportData";
import { useLang } from "@/lib/LanguageContext";

export default function SearchDeck({ compact = false }) {
  const navigate = useNavigate();
  const { t } = useLang();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tripType, setTripType] = useState("oneway"); // "oneway" | "roundtrip"
  const [date, setDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  // Minimum selectable date = today
  const today = new Date().toISOString().slice(0, 10);

  const swap = () => { setFrom(to); setTo(from); };

  const search = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (date) params.set("date", date);
    params.set("tripType", tripType);
    if (tripType === "roundtrip" && returnDate) params.set("returnDate", returnDate);
    navigate(`/routes?${params.toString()}`);
  };

  const fieldCls = "bg-transparent text-foreground placeholder:text-muted-foreground/60 w-full focus:outline-none";

  return (
    <div className={`glass rounded-sm ${compact ? "p-5" : "p-8"} w-full`}>

      {/* Trip type toggle */}
      <div className="flex items-center gap-1 mb-5">
        <button
          onClick={() => setTripType("oneway")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-sm text-xs font-mono font-bold tracking-wider transition-all ${
            tripType === "oneway"
              ? "bg-primary text-primary-foreground"
              : "border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
          }`}
        >
          <ArrowRight className="w-3 h-3" /> ONE WAY
        </button>
        <button
          onClick={() => setTripType("roundtrip")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-sm text-xs font-mono font-bold tracking-wider transition-all ${
            tripType === "roundtrip"
              ? "bg-primary text-primary-foreground"
              : "border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
          }`}
        >
          <ArrowLeftRight className="w-3 h-3" /> ROUND TRIP
        </button>
      </div>

      {/* Main search row */}
      <div className={`grid ${compact ? "grid-cols-1 md:grid-cols-[1fr_auto_1fr_1fr_auto]" : "grid-cols-1 md:grid-cols-[1fr_auto_1fr_1fr_auto]"} items-end gap-4 md:gap-6`}>

        {/* From */}
        <div>
          <label className="font-mono text-[10px] tracking-[0.25em] text-primary block mb-2">{t("departingFrom")}</label>
          <select value={from} onChange={(e) => setFrom(e.target.value)} className={fieldCls}>
            <option value="" className="bg-card">{t("selectOrigin")}</option>
            {CITIES.map((c) => <option key={c} value={c} className="bg-card">{c}</option>)}
          </select>
          <div className="h-px bg-border mt-3" />
        </div>

        {/* Swap button */}
        <div className="hidden md:flex items-center justify-center pb-3">
          <button
            onClick={swap}
            title="Swap cities"
            className="w-9 h-9 rounded-full border border-primary/40 flex items-center justify-center hover:bg-primary/10 transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4 text-primary" />
          </button>
        </div>

        {/* To */}
        <div>
          <label className="font-mono text-[10px] tracking-[0.25em] text-primary block mb-2">{t("arrivingAt")}</label>
          <select value={to} onChange={(e) => setTo(e.target.value)} className={fieldCls}>
            <option value="" className="bg-card">{t("selectDestination")}</option>
            {CITIES.map((c) => <option key={c} value={c} className="bg-card">{c}</option>)}
          </select>
          <div className="h-px bg-border mt-3" />
        </div>

        {/* Date(s) */}
        <div>
          <label className="font-mono text-[10px] tracking-[0.25em] text-primary block mb-2 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {tripType === "roundtrip" ? "DEPARTURE DATE" : "TRAVEL DATE"}
          </label>
          <input
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`${fieldCls} font-mono text-sm [color-scheme:dark]`}
          />
          <div className="h-px bg-border mt-3" />
        </div>

        {/* Search button */}
        <button
          onClick={search}
          className="bg-primary text-primary-foreground font-semibold px-6 py-3.5 rounded-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all whitespace-nowrap"
        >
          <Search className="w-4 h-4" strokeWidth={2.4} />
          {t("searchRoutes")}
        </button>
      </div>

      {/* Return date row (round trip only) */}
      {tripType === "roundtrip" && (
        <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 md:gap-6 items-end">
          <div>
            <label className="font-mono text-[10px] tracking-[0.25em] text-primary block mb-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> RETURN DATE
            </label>
            <input
              type="date"
              min={date || today}
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className={`${fieldCls} font-mono text-sm [color-scheme:dark]`}
            />
            <div className="h-px bg-border mt-3" />
          </div>
          <p className="text-xs text-muted-foreground pb-3">
            We'll show return trips from <strong>{to || "destination"}</strong> → <strong>{from || "origin"}</strong> after you pick your outbound seat.
          </p>
        </div>
      )}
    </div>
  );
}
