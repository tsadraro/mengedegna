import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Globe, Check } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { base44 } from "@/api/base44Client";
import { useLang, LANGUAGES } from "@/lib/LanguageContext";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const { pathname } = useLocation();
  const { t, lang, switchLang } = useLang();
  const [langOpen, setLangOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const dropRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const links = [
    { key: "home", to: "/" },
    { key: "routes", to: "/routes" },
    { key: "operators", to: "/operators" },
    { key: "about", to: "/#about" },
    { key: "faq", to: "/faq", label: "FAQ" },
    { key: "dashboard", to: "/operator" },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setLangOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === lang);

  return (
    <header className="fixed top-0 inset-x-0 z-50 glass border-b border-border/60">
      <nav className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <BrandLogo size="md" />
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {/* Home + Routes grouped closer */}
          <div className="flex items-center gap-4">
            {links.slice(0, 2).map((l) => (
              <Link
                key={l.key}
                to={l.to}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === l.to.split("#")[0] ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {l.label ?? t(l.key)}
              </Link>
            ))}
          </div>
          {links.slice(2).map((l) => (
            <Link
              key={l.key}
              to={l.to}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === l.to.split("#")[0] ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {l.label ?? t(l.key)}
            </Link>
          ))}
        </div>

        {/* Right side: notification bell + language picker + CTA */}
        <div className="flex items-center gap-3">
          <NotificationBell user={currentUser} />
          {/* Language switcher */}
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary border border-border hover:border-primary px-3 py-2 rounded-sm transition-all"
              aria-label="Change language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="font-mono text-xs hidden sm:inline">{currentLang?.native}</span>
              <span className="sm:hidden">{currentLang?.flag}</span>
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-sm shadow-xl overflow-hidden z-50 animate-liquid">
                <div className="px-3 py-2 border-b border-border">
                  <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">{t("language").toUpperCase()}</p>
                </div>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { switchLang(l.code); setLangOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-secondary transition-colors ${
                      lang === l.code ? "text-primary" : "text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{l.flag}</span>
                      <div className="text-left">
                        <div className="font-medium leading-none">{l.native}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{l.label}</div>
                      </div>
                    </div>
                    {lang === l.code && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <Link
            to="/routes"
            className="bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-sm hover:brightness-110 transition-all whitespace-nowrap"
          >
            {t("bookJourney")}
          </Link>
        </div>
      </nav>
    </header>
  );
}