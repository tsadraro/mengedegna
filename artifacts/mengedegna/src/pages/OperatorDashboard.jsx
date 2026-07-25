import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Bus, Plus, Pencil, Trash2, Check, Loader2, RefreshCw, MapPin, Clock,
  Banknote, Smartphone, TrendingUp, Ticket, X, ChevronDown, Users,
  AlertTriangle, ShieldAlert, UserCog,
} from "lucide-react";

const CITIES = [
  "Addis Ababa","Bahir Dar","Gondar","Mekelle","Hawassa","Dire Dawa",
  "Harar","Jimma","Adama","Arbaminch","Dessie","Axum","Lalibela",
  "Shashemene","Nekemte","Gambela","Jijiga","Dilla","Sodo","Arba Minch",
];

function getToken() {
  return localStorage.getItem("base44_access_token") || "";
}

async function apiCall(method, path, body) {
  const token = getToken();
  const resp = await fetch(`/api/apps/mengedegna${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw Object.assign(new Error(data.message || "Request failed"), { status: resp.status });
  return data;
}

const BLANK_ROUTE = {
  from_city: "", to_city: "", departure_date: "", departure_time: "",
  arrival_time: "", total_seats: 45, fare: 0, bus_type: "Standard",
};

export default function OperatorDashboard() {
  const [tab, setTab] = useState("routes"); // routes | bookings | admin
  const [routes, setRoutes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Route modal
  const [routeModal, setRouteModal] = useState(null); // null | "add" | route-object (edit)
  const [routeForm, setRouteForm] = useState(BLANK_ROUTE);
  const [routeSaving, setRouteSaving] = useState(false);
  const [routeError, setRouteError] = useState("");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Cancellation
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // User management (admin)
  const [userEditTarget, setUserEditTarget] = useState(null);
  const [userForm, setUserForm] = useState({ role: "", operator_id: "" });
  const [userSaving, setUserSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isAdmin = currentUser?.role === "admin";
  const isOperator = currentUser?.role === "operator";

  const load = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const opFilter = isOperator && currentUser.operator_id
        ? { operator: currentUser.operator_id } : {};

      const [routeData, bookingData] = await Promise.all([
        isOperator
          ? base44.entities.Route.filter(opFilter, "-departure_date", 200)
          : base44.entities.Route.list("-departure_date", 200),
        isOperator
          ? base44.entities.Booking.filter({ operator: currentUser.operator_id }, "-created_date", 500)
          : base44.entities.Booking.filter({}, "-created_date", 500),
      ]);
      setRoutes(routeData || []);
      setBookings(bookingData || []);

      if (isAdmin) {
        const userData = await apiCall("GET", "/auth/users");
        setUsers(Array.isArray(userData) ? userData : []);
      }
    } catch (e) {
      console.error("Load error", e);
    } finally {
      setLoading(false);
    }
  }, [currentUser, isAdmin, isOperator]);

  useEffect(() => { if (currentUser !== null) load(); }, [currentUser, load]);

  // ── Finance stats ──────────────────────────────────────────────────────
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const cashBookings = confirmedBookings.filter((b) => b.payment_method === "cash" || b.payment_status === "cash");
  const onlineBookings = confirmedBookings.filter((b) => b.payment_method === "telebirr" || b.payment_status === "online");
  const cashRevenue = cashBookings.reduce((s, b) => s + (b.fare || 0), 0);
  const onlineRevenue = onlineBookings.reduce((s, b) => s + (b.fare || 0), 0);

  // ── Route CRUD ────────────────────────────────────────────────────────
  const openAdd = () => {
    setRouteForm({ ...BLANK_ROUTE, operator: currentUser?.operator_id || "", operator_name: currentUser?.name || "" });
    setRouteModal("add");
    setRouteError("");
  };

  const openEdit = (r) => {
    setRouteForm({ ...r });
    setRouteModal(r);
    setRouteError("");
  };

  const saveRoute = async () => {
    setRouteSaving(true);
    setRouteError("");
    try {
      const data = {
        ...routeForm,
        available_seats: routeModal === "add"
          ? Number(routeForm.total_seats)
          : (routeForm.available_seats ?? routeForm.total_seats),
        total_seats: Number(routeForm.total_seats),
        fare: Number(routeForm.fare),
        operator: routeForm.operator || currentUser?.operator_id || "",
        operator_name: routeForm.operator_name || currentUser?.name || "",
      };

      if (routeModal === "add") {
        const created = await base44.entities.Route.create(data);
        setRoutes((prev) => [created, ...prev]);
      } else {
        const updated = await base44.entities.Route.update(routeModal.id, data);
        setRoutes((prev) => prev.map((r) => r.id === routeModal.id ? updated : r));
      }
      setRouteModal(null);
    } catch (e) {
      setRouteError(e.message || "Save failed");
    } finally {
      setRouteSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await base44.entities.Route.delete(deleteTarget.id);
      setRoutes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      alert(e.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  // ── Cancellation ──────────────────────────────────────────────────────
  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await apiCall("POST", `/entities/Booking/${cancelTarget.id}/cancel`);
      setBookings((prev) => prev.map((b) => b.id === cancelTarget.id ? { ...b, status: "cancelled" } : b));
      setRoutes((prev) => prev.map((r) => r.id === cancelTarget.route_id
        ? { ...r, available_seats: (r.available_seats || 0) + 1 } : r));
      setCancelTarget(null);
    } catch (e) {
      alert(e.message || "Cancellation failed");
    } finally {
      setCancelling(false);
    }
  };

  // ── User management ───────────────────────────────────────────────────
  const saveUser = async () => {
    if (!userEditTarget) return;
    setUserSaving(true);
    try {
      await apiCall("PUT", `/auth/users/${userEditTarget.id}`, userForm);
      setUsers((prev) => prev.map((u) => u.id === userEditTarget.id ? { ...u, ...userForm } : u));
      setUserEditTarget(null);
    } catch (e) {
      alert(e.message || "Save failed");
    } finally {
      setUserSaving(false);
    }
  };

  const Field = ({ label, children }) => (
    <div>
      <label className="font-mono text-[10px] tracking-[0.2em] text-primary block mb-1.5">{label}</label>
      {children}
    </div>
  );

  const input = "w-full bg-transparent border-b border-border py-2.5 focus:border-primary focus:outline-none text-sm";
  const select = "w-full bg-card border border-border rounded-sm px-3 py-2.5 text-sm focus:border-primary focus:outline-none";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-32 pb-8 bg-secondary/30 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] tracking-[0.3em] text-primary mb-2">OPERATOR CONTROL</div>
            <h1 className="heading-mega text-4xl sm:text-5xl">Dashboard</h1>
            {currentUser?.operator_id && (
              <p className="text-muted-foreground text-sm mt-2">
                Operator: <span className="text-primary font-semibold">{currentUser.operator_id}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="flex items-center gap-2 text-sm text-muted-foreground border border-border px-4 py-2 rounded-sm hover:border-primary hover:text-primary transition-all">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            {(isAdmin || isOperator) && (
              <button onClick={openAdd} className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-sm hover:brightness-110 transition-all">
                <Plus className="w-4 h-4" /> Add Route
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Finance Summary */}
      {!loading && confirmedBookings.length > 0 && (
        <section className="py-6 border-b border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "TOTAL TICKETS", value: confirmedBookings.length, sub: "confirmed", icon: <Ticket className="w-5 h-5 text-primary" />, cls: "border-primary/30 bg-primary/5" },
                { label: "TOTAL REVENUE", value: `${(cashRevenue + onlineRevenue).toLocaleString()} ETB`, sub: "cash + online", icon: <TrendingUp className="w-5 h-5 text-accent" />, cls: "border-accent/30 bg-accent/5" },
                { label: "CASH SALES", value: `${cashRevenue.toLocaleString()} ETB`, sub: `${cashBookings.length} tickets`, icon: <Banknote className="w-5 h-5 text-primary" />, cls: "border-border bg-secondary/40" },
                { label: "ONLINE (TELEBIRR)", value: `${onlineRevenue.toLocaleString()} ETB`, sub: `${onlineBookings.length} tickets`, icon: <Smartphone className="w-5 h-5 text-accent" />, cls: "border-border bg-secondary/40" },
              ].map((s) => (
                <div key={s.label} className={`border rounded-sm p-4 ${s.cls}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">{s.label}</span>
                    {s.icon}
                  </div>
                  <div className="font-display font-extrabold text-xl leading-none">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex gap-6">
          {[
            { id: "routes", label: "Routes", icon: <Bus className="w-4 h-4" /> },
            { id: "bookings", label: "Bookings", icon: <Ticket className="w-4 h-4" /> },
            ...(isAdmin ? [{ id: "admin", label: "User Management", icon: <UserCog className="w-4 h-4" /> }] : []),
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-all ${
                tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon} {t.label}
              {t.id === "bookings" && confirmedBookings.length > 0 && (
                <span className="ml-1 text-[10px] font-mono bg-primary/20 text-primary px-1.5 py-0.5 rounded-sm">
                  {confirmedBookings.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
          ) : tab === "routes" ? (
            <RoutesTab
              routes={routes} onEdit={openEdit} onDelete={setDeleteTarget}
              isAdmin={isAdmin} isOperator={isOperator} bookings={bookings}
            />
          ) : tab === "bookings" ? (
            <BookingsTab bookings={bookings} onCancel={setCancelTarget} />
          ) : (
            <AdminTab
              users={users} onEdit={(u) => { setUserEditTarget(u); setUserForm({ role: u.role, operator_id: u.operator_id || "" }); }}
            />
          )}
        </div>
      </section>

      <Footer />

      {/* ── Route Modal (Add / Edit) ── */}
      {routeModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card border border-border rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display font-bold text-lg">
                {routeModal === "add" ? "Add New Route" : "Edit Route"}
              </h2>
              <button onClick={() => setRouteModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="FROM CITY">
                  <select value={routeForm.from_city} onChange={(e) => setRouteForm((f) => ({ ...f, from_city: e.target.value }))} className={select}>
                    <option value="">Select city</option>
                    {CITIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="TO CITY">
                  <select value={routeForm.to_city} onChange={(e) => setRouteForm((f) => ({ ...f, to_city: e.target.value }))} className={select}>
                    <option value="">Select city</option>
                    {CITIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="DEPARTURE DATE">
                <input type="date" value={routeForm.departure_date} onChange={(e) => setRouteForm((f) => ({ ...f, departure_date: e.target.value }))} className={`${input} [color-scheme:dark]`} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="DEPARTURE TIME">
                  <input type="time" value={routeForm.departure_time} onChange={(e) => setRouteForm((f) => ({ ...f, departure_time: e.target.value }))} className={`${input} [color-scheme:dark]`} />
                </Field>
                <Field label="ARRIVAL TIME">
                  <input type="time" value={routeForm.arrival_time} onChange={(e) => setRouteForm((f) => ({ ...f, arrival_time: e.target.value }))} className={`${input} [color-scheme:dark]`} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="TOTAL SEATS">
                  <input type="number" min={1} max={100} value={routeForm.total_seats} onChange={(e) => setRouteForm((f) => ({ ...f, total_seats: e.target.value }))} className={input} />
                </Field>
                <Field label="PRICE (ETB)">
                  <input type="number" min={0} value={routeForm.fare} onChange={(e) => setRouteForm((f) => ({ ...f, fare: e.target.value }))} className={input} />
                </Field>
              </div>
              <Field label="BUS TYPE">
                <select value={routeForm.bus_type || "Standard"} onChange={(e) => setRouteForm((f) => ({ ...f, bus_type: e.target.value }))} className={select}>
                  {["Standard", "VIP", "Luxury", "Express", "Minibus"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              {isAdmin && (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="OPERATOR ID">
                    <input value={routeForm.operator || ""} onChange={(e) => setRouteForm((f) => ({ ...f, operator: e.target.value }))} className={input} placeholder="e.g. selam-bus" />
                  </Field>
                  <Field label="OPERATOR NAME">
                    <input value={routeForm.operator_name || ""} onChange={(e) => setRouteForm((f) => ({ ...f, operator_name: e.target.value }))} className={input} placeholder="e.g. Selam Bus" />
                  </Field>
                </div>
              )}
              {routeError && (
                <div className="flex items-center gap-2 text-destructive text-sm border border-destructive/30 bg-destructive/10 rounded-sm px-4 py-3">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {routeError}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={() => setRouteModal(null)} className="flex-1 border border-border py-3 rounded-sm text-sm hover:border-primary transition-all">
                Cancel
              </button>
              <button
                onClick={saveRoute}
                disabled={routeSaving || !routeForm.from_city || !routeForm.to_city || !routeForm.departure_date}
                className="flex-1 bg-primary text-primary-foreground py-3 rounded-sm text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {routeSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {routeModal === "add" ? "Add Route" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Route"
          message={`Delete ${deleteTarget.from_city} → ${deleteTarget.to_city} on ${deleteTarget.departure_date}? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Cancel Booking Confirm ── */}
      {cancelTarget && (
        <ConfirmModal
          title="Cancel Booking"
          message={`Cancel booking for ${cancelTarget.passenger_name} (Seat ${cancelTarget.seat_number}, Invoice ${cancelTarget.invoice_number})? The seat will be returned to available.`}
          confirmLabel="Cancel Booking"
          danger
          loading={cancelling}
          onConfirm={confirmCancel}
          onCancel={() => setCancelTarget(null)}
        />
      )}

      {/* ── User Edit Modal ── */}
      {userEditTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card border border-border rounded-sm w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display font-bold">Set Role & Operator</h2>
              <button onClick={() => setUserEditTarget(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">{userEditTarget.email}</p>
              <div>
                <label className="font-mono text-[10px] tracking-[0.2em] text-primary block mb-1.5">ROLE</label>
                <select value={userForm.role} onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))} className="w-full bg-card border border-border rounded-sm px-3 py-2.5 text-sm focus:border-primary focus:outline-none">
                  {["user", "operator", "admin"].map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="font-mono text-[10px] tracking-[0.2em] text-primary block mb-1.5">OPERATOR ID</label>
                <input value={userForm.operator_id} onChange={(e) => setUserForm((f) => ({ ...f, operator_id: e.target.value }))} placeholder="e.g. selam-bus" className="w-full bg-transparent border-b border-border py-2.5 focus:border-primary focus:outline-none text-sm" />
                <p className="text-xs text-muted-foreground mt-1">Must match the operator field on Route records.</p>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={() => setUserEditTarget(null)} className="flex-1 border border-border py-2.5 rounded-sm text-sm">Cancel</button>
              <button onClick={saveUser} disabled={userSaving} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-sm text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
                {userSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Routes tab ──────────────────────────────────────────────────────────────
function RoutesTab({ routes, onEdit, onDelete, isAdmin, isOperator, bookings }) {
  if (routes.length === 0) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <Bus className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="font-display text-xl mb-2">No routes found.</p>
        <p className="text-sm">Click "Add Route" to create your first departure.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {routes.map((route) => {
        const routeBookings = bookings.filter((b) => b.route_id === route.id && b.status === "confirmed");
        const sold = routeBookings.length;
        const total = route.total_seats || route.available_seats + sold;
        const pct = total ? Math.round((sold / total) * 100) : 0;
        const low = route.available_seats <= 7;

        return (
          <div key={route.id} className="bg-card border border-border rounded-sm p-5">
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-sm bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                  <Bus className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="font-display font-bold text-sm">{route.operator_name || route.operator}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{route.from_city} → {route.to_city}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{route.departure_time}</span>
                <span>{route.departure_date}</span>
                <span className="font-mono font-bold text-foreground">{route.fare?.toLocaleString()} ETB</span>
                <div className={`text-center px-3 py-1.5 rounded-sm border ${low ? "border-destructive/60 bg-destructive/10" : "border-accent/40 bg-accent/10"}`}>
                  <div className={`font-mono font-extrabold text-xl leading-none ${low ? "text-destructive" : "text-accent"}`}>{route.available_seats}</div>
                  <div className="font-mono text-[8px] tracking-wider text-muted-foreground">LEFT</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <div>{sold} sold / {total} total</div>
                  <div className="font-mono text-[10px]">{pct}% full</div>
                </div>
              </div>

              {(isAdmin || isOperator) && (
                <div className="flex items-center gap-2">
                  <button onClick={() => onEdit(route)} className="flex items-center gap-1.5 text-xs border border-border px-3 py-2 rounded-sm hover:border-primary hover:text-primary transition-all">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => onDelete(route)} className="flex items-center gap-1.5 text-xs border border-destructive/30 text-destructive px-3 py-2 rounded-sm hover:bg-destructive/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>

            {/* Seat occupancy bar */}
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[9px] tracking-wider text-muted-foreground">SEAT OCCUPANCY</span>
                <span className="font-mono text-[9px] text-muted-foreground">{pct}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${pct > 90 ? "bg-destructive" : pct > 70 ? "bg-primary" : "bg-accent"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Bookings tab ────────────────────────────────────────────────────────────
function BookingsTab({ bookings, onCancel }) {
  const [filter, setFilter] = useState("all"); // all | confirmed | cancelled | held

  const filtered = bookings.filter((b) => filter === "all" || b.status === filter);

  const statusStyle = {
    confirmed: "border-accent/30 bg-accent/10 text-accent",
    cancelled:  "border-destructive/30 bg-destructive/10 text-destructive",
    held:       "border-primary/30 bg-primary/10 text-primary",
  };

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {["all", "confirmed", "cancelled", "held"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs font-mono px-3 py-1.5 rounded-sm border transition-all capitalize ${
              filter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Ticket className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-display text-xl">No bookings found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["INVOICE", "PASSENGER", "ROUTE", "DATE", "SEAT", "PAYMENT", "STATUS", "ACTION"].map((h) => (
                  <th key={h} className="text-left py-3 px-3 font-mono text-[9px] tracking-[0.2em] text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-3 font-mono text-xs text-primary">{b.invoice_number || "—"}</td>
                  <td className="py-3 px-3">
                    <div className="font-medium">{b.passenger_name}</div>
                    <div className="text-xs text-muted-foreground">+251 {b.phone}</div>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{b.from_city} → {b.to_city}</td>
                  <td className="py-3 px-3 font-mono text-xs whitespace-nowrap">{b.departure_date} {b.departure_time}</td>
                  <td className="py-3 px-3 font-mono font-bold text-center">{b.seat_number}</td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-mono px-2 py-0.5 border rounded-sm capitalize ${b.payment_status === "cash" || b.payment_method === "cash" ? "border-primary/30 bg-primary/10 text-primary" : "border-accent/30 bg-accent/10 text-accent"}`}>
                      {b.payment_status || (b.payment_method === "cash" ? "cash" : "online")}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-mono px-2 py-0.5 border rounded-sm capitalize ${statusStyle[b.status] || "border-border text-muted-foreground"}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {b.status === "confirmed" && (
                      <button onClick={() => onCancel(b)} className="text-xs text-destructive border border-destructive/30 px-2 py-1 rounded-sm hover:bg-destructive/10 transition-all">
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Admin tab ───────────────────────────────────────────────────────────────
function AdminTab({ users, onEdit }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display font-bold text-lg mb-1">User Management</h2>
        <p className="text-sm text-muted-foreground">Promote users to operators and assign their operator ID. The operator ID must match the <code className="text-primary text-xs bg-secondary px-1 py-0.5 rounded">operator</code> field on Route records.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["EMAIL", "NAME", "ROLE", "OPERATOR ID", "VERIFIED", "ACTION"].map((h) => (
                <th key={h} className="text-left py-3 px-3 font-mono text-[9px] tracking-[0.2em] text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="py-3 px-3 font-medium">{u.email}</td>
                <td className="py-3 px-3 text-muted-foreground">{u.name || "—"}</td>
                <td className="py-3 px-3">
                  <span className={`text-[10px] font-mono px-2 py-0.5 border rounded-sm ${
                    u.role === "admin" ? "border-accent/40 bg-accent/10 text-accent" :
                    u.role === "operator" ? "border-primary/40 bg-primary/10 text-primary" :
                    "border-border text-muted-foreground"
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-3 font-mono text-xs text-primary">{u.operator_id || "—"}</td>
                <td className="py-3 px-3">
                  <span className={`text-[10px] font-mono ${u.email_verified ? "text-accent" : "text-muted-foreground"}`}>
                    {u.email_verified ? "✓" : "—"}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <button onClick={() => onEdit(u)} className="text-xs border border-border px-2 py-1 rounded-sm hover:border-primary hover:text-primary transition-all flex items-center gap-1">
                    <UserCog className="w-3 h-3" /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Confirm modal ───────────────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel, danger, loading, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-sm w-full max-w-sm">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${danger ? "text-destructive" : "text-primary"}`} />
            <div>
              <h3 className="font-display font-bold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-border">
          <button onClick={onCancel} disabled={loading} className="flex-1 border border-border py-2.5 rounded-sm text-sm hover:border-primary transition-all">
            Keep
          </button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 py-2.5 rounded-sm text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${danger ? "bg-destructive text-destructive-foreground hover:brightness-110" : "bg-primary text-primary-foreground hover:brightness-110"}`}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
