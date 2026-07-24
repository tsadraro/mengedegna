import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, BellOff, Loader2 } from "lucide-react";

export default function WatchRouteButton({ route, className = "" }) {
  const [user, setUser] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user || !route?.id) { setLoading(false); return; }
    base44.entities.RouteAlert.filter({ route_id: route.id, user_id: user.id, active: true })
      .then((res) => { setAlert(res?.[0] || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, route?.id]);

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    setToggling(true);
    try {
      if (alert) {
        await base44.entities.RouteAlert.update(alert.id, { active: false });
        setAlert(null);
      } else {
        const created = await base44.entities.RouteAlert.create({
          route_id: route.id,
          user_id: user.id,
          user_email: user.email,
          user_name: user.full_name,
          from_city: route.from_city,
          to_city: route.to_city,
          operator: route.operator,
          departure_date: route.departure_date,
          departure_time: route.departure_time,
          last_known_seats: route.available_seats,
          last_known_time: route.departure_time,
          active: true,
        });
        setAlert(created);
      }
    } finally {
      setToggling(false);
    }
  };

  if (!user || loading) return null;

  const watching = !!alert;

  return (
    <button
      onClick={toggle}
      disabled={toggling}
      title={watching ? "Stop watching this route" : "Watch for seat & schedule updates"}
      className={`flex items-center gap-1.5 text-xs font-mono px-3 py-2 border rounded-sm transition-all ${
        watching
          ? "border-primary/60 text-primary bg-primary/10 hover:bg-primary/5"
          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
      } ${className}`}
    >
      {toggling ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : watching ? (
        <BellOff className="w-3.5 h-3.5" />
      ) : (
        <Bell className="w-3.5 h-3.5" />
      )}
      {watching ? "WATCHING" : "WATCH"}
    </button>
  );
}