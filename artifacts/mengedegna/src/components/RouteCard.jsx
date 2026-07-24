import React from "react";
import { Link } from "react-router-dom";
import { Clock, Users, ArrowRight, Bus } from "lucide-react";
import WatchRouteButton from "@/components/WatchRouteButton";

const classColor = {
  luxury: "text-primary border-primary/30",
  established: "text-accent border-accent/30",
  electric: "text-green-400 border-green-400/30",
  regional: "text-muted-foreground border-border",
};

export default function RouteCard({ route }) {
  const low = route.available_seats <= 7;
  return (
    <Link
      to={`/booking?route=${route.id}`}
      className="group block bg-card border border-border rounded-sm p-6 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-secondary border border-border flex items-center justify-center">
            <Bus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-display font-bold text-sm">{route.operator}</div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{route.bus_type}</div>
          </div>
        </div>
        <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 border rounded-sm ${classColor[route.operator_class]}`}>
          {route.operator_class}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-5">
        <div className="text-center">
          <div className="font-display font-extrabold text-2xl">{route.departure_time}</div>
          <div className="text-xs text-muted-foreground truncate max-w-[100px]">{route.from_city}</div>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className="font-mono text-[10px] text-muted-foreground mb-1">{route.duration}</div>
          <div className="w-full h-px bg-border relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/60" />
          </div>
        </div>
        <div className="text-center">
          <div className="font-display font-extrabold text-2xl">{route.arrival_time}</div>
          <div className="text-xs text-muted-foreground truncate max-w-[100px]">{route.to_city}</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border/60">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{route.duration}</span>
          <span className={`flex items-center gap-1.5 ${low ? "text-destructive" : ""}`}>
            <Users className="w-3.5 h-3.5" />{route.available_seats} seats
          </span>
        </div>
        <div className="text-right">
          <div className="font-display font-extrabold text-xl text-primary">{route.fare.toLocaleString()}<span className="text-xs text-muted-foreground ml-1">ETB</span></div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <WatchRouteButton route={route} />
        <div className="text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
          Select seats <ArrowRight className="w-4 h-4 ml-1" />
        </div>
      </div>
    </Link>
  );
}