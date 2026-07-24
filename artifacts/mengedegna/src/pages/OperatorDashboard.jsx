import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Bus, Minus, Plus, Check, Loader2, RefreshCw, MapPin, Clock, Banknote, Smartphone, TrendingUp, Ticket } from "lucide-react";
import SeatLayoutEditor from "@/components/SeatLayoutEditor";

export default function OperatorDashboard() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [edited, setEdited] = useState({});
  const [saved, setSaved] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const load = () => {
    if (!currentUser) return;
    setLoading(true);
    const isOperator = currentUser.role === "operator";
    const query = isOperator && currentUser.operator_name ? { operator: currentUser.operator_name } : {};
    Promise.all([
      isOperator ? base44.entities.Route.filter(query, "-departure_date", 100) : base44.entities.Route.list("-departure_date", 100),
      isOperator && currentUser.operator_name
        ? base44.entities.Booking.filter({ operator: currentUser.operator_name, status: "confirmed" }, "-created_date", 500)
        : base44.entities.Booking.filter({ status: "confirmed" }, "-created_date", 500),
    ])
      .then(([routeData, bookingData]) => {
        setRoutes(routeData || []);
        setBookings(bookingData || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { if (currentUser !== null) load(); }, [currentUser]);

  // Live updates when online bookings change seat counts
  useEffect(() => {
    const unsub = base44.entities.Route.subscribe((event) => {
      if (event.type === "update") {
        setRoutes((prev) => prev.map((r) => r.id === event.data.id ? { ...r, available_seats: event.data.available_seats } : r));
      }
    });
    return unsub;
  }, []);

  const currentSeats = (route) =>
    edited[route.id] !== undefined ? edited[route.id] : route.available_seats;

  const adjust = (route, delta) => {
    const cur = currentSeats(route);
    const next = Math.max(0, Math.min(route.total_seats, cur + delta));
    setEdited((prev) => ({ ...prev, [route.id]: next }));
  };

  const setDirect = (route, val) => {
    const n = parseInt(val, 10);
    if (isNaN(n)) return;
    setEdited((prev) => ({ ...prev, [route.id]: Math.max(0, Math.min(route.total_seats, n)) }));
  };

  const save = async (route) => {
    const newCount = currentSeats(route);
    if (newCount === route.available_seats) return;
    setSaving((prev) => ({ ...prev, [route.id]: true }));
    await base44.entities.Route.update(route.id, { available_seats: newCount });
    setRoutes((prev) => prev.map((r) => r.id === route.id ? { ...r, available_seats: newCount } : r));
    setEdited((prev) => { const n = { ...prev }; delete n[route.id]; return n; });
    setSaving((prev) => { const n = { ...prev }; delete n[route.id]; return n; });
    setSaved((prev) => ({ ...prev, [route.id]: true }));
    setTimeout(() => setSaved((prev) => { const n = { ...prev }; delete n[route.id]; return n; }), 2000);
  };

  const isDirty = (route) => edited[route.id] !== undefined && edited[route.id] !== route.available_seats;

  const occupancyPct = (route) =>
    route.total_seats ? Math.round(((route.total_seats - currentSeats(route)) / route.total_seats) * 100) : 0;

  const cashBookings = bookings.filter((b) => b.payment_method === "cash");
  const onlineBookings = bookings.filter((b) => b.payment_method === "telebirr");
  const cashRevenue = cashBookings.reduce((s, b) => s + (b.fare || 0), 0);
  const onlineRevenue = onlineBookings.reduce((s, b) => s + (b.fare || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-12 bg-secondary/30 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] tracking-[0.3em] text-primary mb-3">OPERATOR CONTROL</div>
            <h1 className="heading-mega text-4xl sm:text-5xl">Seat Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-3">
              {currentUser?.operator_name
                ? <>Showing routes for <span className="text-primary font-semibold">{currentUser.operator_name}</span> — update seats after walk-in sales.</>
                : "Manually update available seats for walk-in ticket sales at the station."}
            </p>
          </div>
          <button onClick={load} className="flex items-center gap-2 text-sm text-muted-foreground border border-border px-4 py-2 rounded-sm hover:border-primary hover:text-primary transition-all">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </section>

      {/* Finance Summary */}
      {!loading && bookings.length > 0 && (
        <section className="py-8 border-b border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground mb-5">FINANCE SUMMARY</div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "TOTAL TICKETS", value: bookings.length, sub: "confirmed sales", icon: <Ticket className="w-5 h-5 text-primary" />, cls: "border-primary/30 bg-primary/5" },
                { label: "TOTAL REVENUE", value: `${(cashRevenue + onlineRevenue).toLocaleString()} ETB`, sub: "cash + online", icon: <TrendingUp className="w-5 h-5 text-accent" />, cls: "border-accent/30 bg-accent/5" },
                { label: "CASH SALES", value: `${cashRevenue.toLocaleString()} ETB`, sub: `${cashBookings.length} walk-in tickets`, icon: <Banknote className="w-5 h-5 text-primary" />, cls: "border-border bg-secondary/40" },
                { label: "ONLINE (TELEBIRR)", value: `${onlineRevenue.toLocaleString()} ETB`, sub: `${onlineBookings.length} online tickets`, icon: <Smartphone className="w-5 h-5 text-accent" />, cls: "border-border bg-secondary/40" },
              ].map((s) => (
                <div key={s.label} className={`border rounded-sm p-5 ${s.cls}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">{s.label}</span>
                    {s.icon}
                  </div>
                  <div className="font-display font-extrabold text-xl leading-none">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : routes.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <Bus className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-display text-xl">No routes found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {routes.map((route) => {
                const seats = currentSeats(route);
                const pct = occupancyPct(route);
                const low = seats <= 7;
                const dirty = isDirty(route);
                return (
                  <div key={route.id} className={`bg-card border rounded-sm p-5 transition-all ${dirty ? "border-primary/60" : "border-border"}`}>
                    <div className="flex flex-wrap items-center gap-6">
                      {/* Route info */}
                      <div className="flex items-center gap-3 min-w-[200px] flex-1">
                        <div className="w-10 h-10 rounded-sm bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                          <Bus className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-display font-bold text-sm">{route.operator}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {route.from_city} → {route.to_city}
                          </div>
                        </div>
                      </div>

                      {/* Date & time */}
                      <div className="text-xs text-muted-foreground flex items-center gap-4 min-w-[160px]">
                        <span>{route.departure_date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{route.departure_time}</span>
                      </div>

                      {/* Available seats — big visible count */}
                      <div className="flex items-center gap-3 min-w-[140px]">
                       <div className={`text-center px-4 py-2 rounded-sm border ${low ? "border-destructive/60 bg-destructive/10" : "border-accent/40 bg-accent/10"}`}>
                         <div className={`font-mono font-extrabold text-2xl leading-none ${low ? "text-destructive" : "text-accent"}`}>{seats}</div>
                         <div className="font-mono text-[9px] tracking-widest text-muted-foreground mt-1">SEATS LEFT</div>
                       </div>
                       <div className="text-xs text-muted-foreground">
                         <div>of <span className="font-mono font-bold text-foreground">{route.total_seats}</span></div>
                         <div className="font-mono text-[10px] mt-0.5">{pct}% full</div>
                       </div>
                      </div>

                      {/* Seat adjuster */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => adjust(route, -1)} className="w-8 h-8 rounded-sm border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-all">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            value={seats}
                            onChange={(e) => setDirect(route, e.target.value)}
                            className="w-14 text-center bg-secondary border border-border rounded-sm py-1.5 font-mono font-bold text-sm focus:border-primary focus:outline-none"
                            min={0}
                            max={route.total_seats}
                          />
                          <button onClick={() => adjust(route, 1)} className="w-8 h-8 rounded-sm border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-all">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className={`text-xs font-mono ${low ? "text-destructive" : "text-muted-foreground"}`}>
                          {seats} left
                        </span>
                      </div>

                      {/* Seat Layout Editor */}
                    </div>
                    <SeatLayoutEditor
                      route={route}
                      onSaved={(updated) => setRoutes((prev) => prev.map((r) => r.id === updated.id ? updated : r))}
                    />
                    <div className="flex flex-wrap items-center gap-6 mt-4">
                      {/* Save button */}
                      <button
                        onClick={() => save(route)}
                        disabled={!dirty || saving[route.id]}
                        className={`min-w-[100px] py-2 px-4 rounded-sm text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                          saved[route.id]
                            ? "bg-accent/20 text-accent border border-accent/40"
                            : dirty
                            ? "bg-primary text-primary-foreground hover:brightness-110"
                            : "bg-secondary text-muted-foreground border border-border opacity-50 cursor-not-allowed"
                        }`}
                      >
                        {saving[route.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : saved[route.id] ? (
                          <><Check className="w-4 h-4" /> Saved</>
                        ) : (
                          "Update"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}