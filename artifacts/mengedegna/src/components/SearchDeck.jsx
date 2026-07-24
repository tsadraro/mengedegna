import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import { CITIES } from "@/lib/transportData";
import { useLang } from "@/lib/LanguageContext";

export default function SearchDeck({ compact = false }) {
  const navigate = useNavigate();
  const { t } = useLang();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const search = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    navigate(`/routes?${params.toString()}`);
  };

  const fieldCls = "bg-transparent text-foreground placeholder:text-muted-foreground/60 w-full focus:outline-none";

  return (
    <div className={`glass rounded-sm ${compact ? "p-5" : "p-8"} w-full`}>
      <div className={`grid ${compact ? "grid-cols-1 md:grid-cols-[1fr_1fr_auto]" : "grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto]"} items-end gap-4 md:gap-6`}>
        <div>
          <label className="font-mono text-[10px] tracking-[0.25em] text-primary block mb-2">{t("departingFrom")}</label>
          <select value={from} onChange={(e) => setFrom(e.target.value)} className={fieldCls}>
            <option value="" className="bg-card">{t("selectOrigin")}</option>
            {CITIES.map((c) => <option key={c} value={c} className="bg-card">{c}</option>)}
          </select>
          <div className="h-px bg-border mt-3" />
        </div>
        {!compact && (
          <div className="hidden md:flex items-center justify-center pb-3">
            <div className="w-10 h-10 rounded-full border border-primary/40 flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-primary" />
            </div>
          </div>
        )}
        <div>
          <label className="font-mono text-[10px] tracking-[0.25em] text-primary block mb-2">{t("arrivingAt")}</label>
          <select value={to} onChange={(e) => setTo(e.target.value)} className={fieldCls}>
            <option value="" className="bg-card">{t("selectDestination")}</option>
            {CITIES.map((c) => <option key={c} value={c} className="bg-card">{c}</option>)}
          </select>
          <div className="h-px bg-border mt-3" />
        </div>
        <button
          onClick={search}
          className="bg-primary text-primary-foreground font-semibold px-6 py-3.5 rounded-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all whitespace-nowrap"
        >
          <Search className="w-4 h-4" strokeWidth={2.4} />
          {t("searchRoutes")}
        </button>
      </div>
    </div>
  );
}