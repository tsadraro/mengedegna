import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, Check, Bus } from "lucide-react";

export default function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const unread = notifications.filter((n) => !n.read).length;

  const load = () => {
    if (!user?.id) return;
    base44.entities.InAppNotification.filter({ user_id: user.id }, "-created_date", 20)
      .then((res) => setNotifications(res || []))
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.InAppNotification.subscribe((event) => {
      if (event.type === "create" && event.data.user_id === user?.id) {
        setNotifications((prev) => [event.data, ...prev]);
      }
      if (event.type === "update") {
        setNotifications((prev) => prev.map((n) => n.id === event.data.id ? { ...n, ...event.data } : n));
      }
    });
    return unsub;
  }, [user?.id]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    const unreadOnes = notifications.filter((n) => !n.read);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await Promise.all(unreadOnes.map((n) => base44.entities.InAppNotification.update(n.id, { read: true })));
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((v) => !v); if (!open && unread > 0) markAllRead(); }}
        className="relative flex items-center justify-center w-9 h-9 border border-border rounded-sm text-muted-foreground hover:text-primary hover:border-primary transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center font-mono">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-sm shadow-xl z-50 animate-liquid overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">ROUTE ALERTS</span>
            {notifications.length > 0 && (
              <button onClick={markAllRead} className="text-[10px] text-primary font-mono hover:underline flex items-center gap-1">
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
                No alerts yet
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`px-4 py-3 border-b border-border/50 last:border-0 text-sm ${!n.read ? "bg-primary/5" : ""}`}>
                  <div className="flex items-start gap-2">
                    <Bus className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-xs mb-0.5">{n.title}</div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                    </div>
                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1 ml-auto" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}