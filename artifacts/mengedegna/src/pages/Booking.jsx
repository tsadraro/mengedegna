import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TelebirrPay from "@/components/TelebirrPay";
import EInvoice from "@/components/EInvoice";
import { ArrowRight, ArrowLeft, Check, ShieldAlert, Loader2, Bus, MapPin, UserCheck, Banknote, Bell, Clock, PartyPopper, Armchair, Users, Globe } from "lucide-react";
import { getRefundPolicyForBooking } from "@/lib/refundPolicy";
import { SEATING_RULE } from "@/lib/operatorProfiles";
import SeatMap from "@/components/SeatMap";
import TripComparison from "@/components/TripComparison";

export default function Booking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const routeId = params.get("route");

  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1 details | 2 payment | 3 invoice
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]); // number[]
  const [bookings, setBookings] = useState([]); // array of created booking records
  const [creating, setCreating] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [isAbroad, setIsAbroad] = useState(false);
  const [geoChecked, setGeoChecked] = useState(false);
  const [usdToEtb, setUsdToEtb] = useState(130); // fallback rate

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Detect location + fetch live exchange rate in parallel
  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data) => {
        setIsAbroad(data.country_code !== "ET");
        setGeoChecked(true);
      })
      .catch(() => setGeoChecked(true));

    fetch("https://api.frankfurter.app/latest?from=USD&to=ETB")
      .then((r) => r.json())
      .then((data) => {
        if (data?.rates?.ETB) setUsdToEtb(data.rates.ETB);
      })
      .catch(() => {}); // keep fallback
  }, []);

  const isOperator = currentUser?.role === "operator";
  const isAdmin = currentUser?.role === "admin";
  const effectiveAgentMode = isOperator ? true : agentMode;

  useEffect(() => {
    if (!routeId) return;
    base44.entities.Route.get(routeId)
      .then((r) => {
        if (isOperator && currentUser?.operator_name && r.operator !== currentUser.operator_name) {
          navigate("/routes");
          return;
        }
        setRoute(r);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [routeId, isOperator, currentUser]);

  const fare = route?.fare || 0;
  const serviceFee = isAbroad ? 0 : 20; // 20 ETB local fee, waived for international
  const internationalFee = isAbroad ? Math.round(usdToEtb) : 0; // $1 USD equivalent in ETB for international
  const totalPerSeat = fare + serviceFee + internationalFee;
  const seatCount = selectedSeats.length || 1;
  const grandTotal = totalPerSeat * Math.max(selectedSeats.length, 1);
  const maxSeats = Math.min(6, route?.available_seats || 1);

  const handlePaid = async (paymentMethod = "telebirr") => {
    setCreating(true);
    const policy = getRefundPolicyForBooking(route.departure_date, route.departure_time);
    const refundPolicy = policy.pct === 100 ? "full" : policy.pct === 50 ? "half" : "none";
    // Use the seats the passenger explicitly selected, sorted ascending
    const seats = [...selectedSeats].sort((a, b) => a - b).map(String);

    const baseInvoice = `AK-${Date.now().toString().slice(-8)}`;
    const bookingRecords = seats.map((seat, i) => ({
      route_id: route.id,
      passenger_name: name,
      phone,
      seat_number: seat,
      from_city: route.from_city,
      to_city: route.to_city,
      operator: route.operator,
      departure_date: route.departure_date,
      departure_time: route.departure_time,
      arrival_time: route.arrival_time,
      fare: totalPerSeat,
      status: "confirmed",
      payment_method: paymentMethod,
      invoice_number: seatCount === 1 ? baseInvoice : `${baseInvoice}-${i + 1}`,
      qr_data: seatCount === 1 ? baseInvoice : `${baseInvoice}-${i + 1}`,
      refund_policy: refundPolicy,
    }));

    try {
      const created = await base44.entities.Booking.bulkCreate(bookingRecords);
      await base44.entities.Route.update(route.id, {
        available_seats: Math.max(0, route.available_seats - seatCount),
      });
      setBookings(Array.isArray(created) ? created : bookingRecords);
    } catch (e) {
      setBookings(bookingRecords);
    } finally {
      setCreating(false);
      setStep(3);
      setShowConfirmAlert(true);
      setTimeout(() => setShowConfirmAlert(false), 6000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-xl mb-2">Route not found.</p>
          <button onClick={() => navigate("/routes")} className="text-primary hover:underline">Browse all routes</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-6 lg:px-10">

          {/* Agent Mode Toggle */}
          <div className="mb-6 flex items-center justify-between">
            {isOperator ? (
              <div className="flex items-center gap-2 text-xs font-mono px-3 py-2 border border-accent/60 text-accent bg-accent/10 rounded-sm">
                <UserCheck className="w-3.5 h-3.5" />
                AGENT MODE · {currentUser?.operator_name?.toUpperCase() || "OPERATOR"}
              </div>
            ) : isAdmin ? (
              <button
                onClick={() => setAgentMode((v) => !v)}
                className={`flex items-center gap-2 text-xs font-mono px-3 py-2 border rounded-sm transition-all ${
                  agentMode
                    ? "border-accent/60 text-accent bg-accent/10"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                {agentMode ? "AGENT MODE · ACTIVE" : "AGENT MODE · CLICK TO ENABLE"}
              </button>
            ) : null}
            {effectiveAgentMode && (
              <span className="text-[10px] font-mono text-muted-foreground">Booking on behalf of a walk-in customer</span>
            )}
          </div>

          {/* Progress */}
          <Stepper step={step} />

          {/* Route summary bar */}
          <div className="glass rounded-sm p-5 mt-8 mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-secondary border border-border flex items-center justify-center">
                <Bus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-display font-bold text-sm">{route.operator} · {route.bus_type}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-3 h-3" />{route.from_city} → {route.to_city}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div><span className="text-muted-foreground text-xs">DEPART</span><div className="font-mono font-bold">{route.departure_time}</div></div>
              <div><span className="text-muted-foreground text-xs">ARRIVE</span><div className="font-mono font-bold">{route.arrival_time}</div></div>
              <div><span className="text-muted-foreground text-xs">DATE</span><div className="font-mono font-bold">{route.departure_date}</div></div>
              <div><span className="text-muted-foreground text-xs">SEATS LEFT</span><div className={`font-mono font-bold ${route.available_seats <= 7 ? "text-destructive" : "text-accent"}`}>{route.available_seats}</div></div>
            </div>
          </div>

          {/* Trip Comparison */}
          {step === 1 && <TripComparison currentRoute={route} />}

          {/* Step 1 — Passenger Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-[1fr_280px] gap-8">
                <div className="bg-card border border-border rounded-sm p-8">
                  <h3 className="font-display font-bold text-xl mb-2">Passenger Details</h3>
                  <div className="flex items-start gap-2 mb-6 border border-border bg-secondary/40 rounded-sm px-4 py-3">
                    <Armchair className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-mono text-[9px] tracking-[0.2em] text-primary font-bold">{SEATING_RULE.label.toUpperCase()} · </span>
                      <span className="text-xs text-muted-foreground">{SEATING_RULE.description}</span>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="font-mono text-[10px] tracking-[0.25em] text-primary block mb-2">FULL NAME</label>
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="As on your ID"
                        className="w-full bg-transparent border-b border-border py-3 focus:border-primary focus:outline-none" />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] tracking-[0.25em] text-primary block mb-2">
                        {effectiveAgentMode ? "CUSTOMER PHONE NUMBER" : "TELEBIRR PHONE NUMBER"}
                      </label>
                      <div className="flex items-center border-b border-border focus-within:border-primary">
                        <span className="text-muted-foreground font-mono py-3">+251</span>
                        <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          placeholder="9XX XXX XXX" inputMode="numeric"
                          className="w-full bg-transparent py-3 px-2 focus:outline-none font-mono" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {effectiveAgentMode
                          ? "Customer's phone number for the ticket record."
                          : "Payment push notification will be sent to this Telebirr-linked number."}
                      </p>
                    </div>
                    {selectedSeats.length === 0 && (
                      <div className="flex items-start gap-2 border border-border bg-secondary/40 rounded-sm px-4 py-3">
                        <Users className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground">
                          Travelling as a group? Select up to {maxSeats} adjacent seats on the map below — your group will sit together.
                        </span>
                      </div>
                    )}
                    {geoChecked && isAbroad && (
                      <div className="flex items-start gap-2 border border-accent/40 bg-accent/5 rounded-sm px-4 py-3">
                        <Globe className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-mono text-[9px] tracking-[0.2em] text-accent font-bold mb-0.5">INTERNATIONAL BOOKING DETECTED</div>
                          <span className="text-xs text-muted-foreground">
                            A <span className="text-accent font-semibold">$1 international remittance fee</span> applies per seat for bookings made outside Ethiopia.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    disabled={name.trim().length < 2 || phone.length < 9 || selectedSeats.length === 0}
                    onClick={() => setStep(2)}
                    className="mt-8 w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-sm hover:brightness-110 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {effectiveAgentMode ? <>Confirm Details <ArrowRight className="w-4 h-4" /></> : <>Proceed to Payment <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
                <SummaryCard route={route} totalPerSeat={totalPerSeat} serviceFee={serviceFee} internationalFee={internationalFee} isAbroad={isAbroad} seatCount={selectedSeats.length} grandTotal={selectedSeats.length > 0 ? totalPerSeat * selectedSeats.length : totalPerSeat} />
              </div>
              <SeatMap
                route={route}
                selectedSeats={selectedSeats}
                onSelect={setSelectedSeats}
                maxSeats={maxSeats}
              />
            </div>
          )}

          {/* Step 2 — Payment */}
          {step === 2 && (
            <div>
              {effectiveAgentMode ? (
                <div className="max-w-md mx-auto">
                  <div className="text-center mb-8">
                    <div className="w-14 h-14 mx-auto rounded-full bg-primary/15 flex items-center justify-center mb-4">
                      <Banknote className="w-7 h-7 text-primary" />
                    </div>
                    <div className="font-mono text-[11px] tracking-[0.3em] text-primary mb-3">AGENT MODE · CASH PAYMENT</div>
                    <h2 className="heading-mega text-3xl sm:text-4xl">Confirm Cash</h2>
                    <p className="text-muted-foreground text-sm mt-2">Collect <span className="text-primary font-bold">{grandTotal.toLocaleString()} ETB</span> from the customer, then confirm to issue the ticket{seatCount > 1 ? "s" : ""}.</p>
                  </div>
                  <div className="bg-card border border-border rounded-sm p-6 space-y-3 text-sm mb-6">
                    <div className="flex justify-between"><span className="text-muted-foreground">Passenger</span><span className="font-medium">{name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-mono">+251 {phone}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Seats</span><span className="font-mono font-bold text-primary">{[...selectedSeats].sort((a,b)=>a-b).join(", ")}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Route</span><span>{route.from_city} → {route.to_city}</span></div>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between font-bold"><span>Cash Collected</span><span className="text-primary">{grandTotal.toLocaleString()} ETB</span></div>
                  </div>
                  <button
                    disabled={creating}
                    onClick={() => handlePaid("cash")}
                    className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Cash Received — Issue {seatCount > 1 ? `${seatCount} Tickets` : "Ticket"}</>}
                  </button>
                  <div className="text-center mt-4">
                    <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 mx-auto">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <div className="font-mono text-[11px] tracking-[0.3em] text-primary mb-3">THE TELEBIRR RITUAL</div>
                    <h2 className="heading-mega text-3xl sm:text-4xl">Authorize Payment</h2>
                    {seatCount > 1 && (
                      <p className="text-muted-foreground text-sm mt-2">{seatCount} seats · <span className="text-primary font-bold">{grandTotal.toLocaleString()} ETB</span> total</p>
                    )}
                  </div>
                  <TelebirrPay phone={phone} amount={grandTotal} onPaid={() => handlePaid("telebirr")} />
                  {route && <RefundPolicyPulse departureDate={route.departure_date} departureTime={route.departure_time} />}
                  {creating && (
                    <div className="flex justify-center mt-6">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                  )}
                  <div className="text-center mt-6">
                    <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 mx-auto">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3 — Tickets */}
          {step === 3 && bookings.length > 0 && (
            <div>
              {showConfirmAlert && (
                <div className="mb-6 flex items-center gap-3 border border-accent/50 bg-accent/10 rounded-sm px-5 py-4 animate-slide-up">
                  <PartyPopper className="w-5 h-5 text-accent flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-mono text-[10px] tracking-[0.2em] text-accent font-bold mb-0.5">BOOKING CONFIRMED</div>
                    <p className="text-sm text-foreground">
                      {bookings.length > 1 ? `${bookings.length} tickets` : "Your ticket"} for{" "}
                      <span className="font-semibold">{bookings[0].from_city} → {bookings[0].to_city}</span> {bookings.length > 1 ? "have" : "has"} been issued.
                    </p>
                  </div>
                  <button onClick={() => setShowConfirmAlert(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
                </div>
              )}

              <div className="text-center mb-8">
                <div className="w-14 h-14 mx-auto rounded-full bg-accent/15 flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-accent" />
                </div>
                <div className="font-mono text-[11px] tracking-[0.3em] text-accent mb-2">JOURNEY CONFIRMED</div>
                <h2 className="heading-mega text-3xl sm:text-4xl">
                  {bookings.length > 1 ? `${bookings.length} Travel Passports` : "Your Travel Passport"}
                </h2>
                <p className="text-muted-foreground mt-2">Present the QR code{bookings.length > 1 ? "s" : ""} at boarding with valid ID.</p>
              </div>

              <div className="space-y-8">
                {bookings.map((booking, i) => (
                  <div key={booking.id || i}>
                    {bookings.length > 1 && (
                      <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground mb-3">
                        TICKET {i + 1} OF {bookings.length} · SEAT {booking.seat_number}
                      </div>
                    )}
                    <EInvoice booking={booking} route={route} />
                  </div>
                ))}
              </div>

              <DepartureReminder departureDate={bookings[0].departure_date} departureTime={bookings[0].departure_time} />

              <div className="text-center mt-8">
                <Link to="/routes" className="text-primary font-medium hover:underline">Book another journey</Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Stepper({ step }) {
  const steps = ["Details", "Payment", "Ticket"];
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const n = i + 1;
        const active = step >= n;
        return (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground border border-border"
              }`}>
                {step > n ? <Check className="w-3.5 h-3.5" /> : n}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${active ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`w-8 h-px ${step > n ? "bg-primary" : "bg-border"}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function SummaryCard({ route, totalPerSeat, serviceFee, internationalFee, isAbroad, seatCount, grandTotal }) {
  const policy = route ? getRefundPolicyForBooking(route.departure_date, route.departure_time) : null;
  const colorMap = { accent: "text-accent border-accent/40", primary: "text-primary border-primary/40", destructive: "text-destructive border-destructive/40" };
  const seats = Math.max(seatCount, 1);
  return (
    <div className="bg-card border border-border rounded-sm p-6 h-fit sticky top-24">
      <h4 className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground mb-5">FARE SUMMARY</h4>
      <div className="space-y-3 text-sm">
        <Row label={`${route.from_city} → ${route.to_city}`} value={`${route.fare?.toLocaleString()} ETB`} />
        {!isAbroad && <Row label={`Service fee × ${seats}`} value={`${(serviceFee * seats).toLocaleString()} ETB`} />}
        {isAbroad && (
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Globe className="w-3 h-3 text-accent flex-shrink-0" />
              <span className="text-xs">Intl. remittance fee × {seats}</span>
            </div>
            <span className="font-medium text-accent">+{(internationalFee * seats).toLocaleString()} ETB <span className="text-[10px] text-muted-foreground">($1/seat)</span></span>
          </div>
        )}
        {seatCount > 1 && <Row label={`Seats`} value={`× ${seatCount}`} muted />}
      </div>
      <div className="h-px bg-border my-5" />
      <div className="flex items-end justify-between">
        <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">TOTAL</span>
        <div className="font-display font-extrabold text-2xl text-primary">{grandTotal.toLocaleString()}<span className="text-xs text-muted-foreground ml-1">ETB</span></div>
      </div>
      {seatCount > 1 && (
        <p className="text-[10px] text-muted-foreground mt-2 text-right">{totalPerSeat.toLocaleString()} ETB × {seatCount} seats</p>
      )}
      {policy && (
        <div className="mt-5 pt-4 border-t border-border/60">
          <div className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-wider px-2 py-1 border rounded-sm ${colorMap[policy.color]}`}>
            <ShieldAlert className="w-3 h-3" /> {policy.label}
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed mt-2">{policy.description}</p>
        </div>
      )}
    </div>
  );
}

function RefundPolicyPulse({ departureDate, departureTime }) {
  const policy = getRefundPolicyForBooking(departureDate, departureTime);
  const colorMap = {
    accent: "border-accent/50 bg-accent/5",
    primary: "border-primary/50 bg-primary/5 pulse-border",
    destructive: "border-destructive/50 bg-destructive/5 pulse-border",
  };
  const textMap = { accent: "text-accent", primary: "text-primary", destructive: "text-destructive" };
  return (
    <div className={`max-w-md mx-auto mt-8 border rounded-sm p-4 ${colorMap[policy.color]}`}>
      <div className="flex items-start gap-2">
        <ShieldAlert className={`w-4 h-4 flex-shrink-0 mt-0.5 ${textMap[policy.color]}`} />
        <div>
          <div className={`font-mono text-[10px] font-bold tracking-wider mb-1 ${textMap[policy.color]}`}>{policy.label}</div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            By authorizing this payment, you agree to the cancellation policy:{" "}
            <span className={`font-semibold ${textMap[policy.color]}`}>{policy.description}</span>
            {" "}Tickets are non-transferable.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, muted }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={muted ? "text-muted-foreground/50" : "font-medium"}>{value}</span>
    </div>
  );
}

function DepartureReminder({ departureDate, departureTime }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [urgency, setUrgency] = useState("normal");

  useEffect(() => {
    const calc = () => {
      const dep = new Date(`${departureDate}T${departureTime || "00:00"}:00`);
      const now = new Date();
      const diff = dep - now;
      if (diff <= 0) { setTimeLeft("Departed"); setUrgency("imminent"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (h < 1) { setUrgency("imminent"); }
      else if (h < 3) { setUrgency("soon"); }
      else { setUrgency("normal"); }
      setTimeLeft(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [departureDate, departureTime]);

  const styles = {
    normal:   { border: "border-primary/30 bg-primary/5",   text: "text-primary",     label: "PRE-DEPARTURE REMINDER" },
    soon:     { border: "border-primary/60 bg-primary/10 pulse-border",  text: "text-primary",    label: "DEPARTING SOON" },
    imminent: { border: "border-destructive/60 bg-destructive/10 pulse-border", text: "text-destructive", label: "DEPARTS VERY SOON" },
  };
  const s = styles[urgency];

  return (
    <div className={`mt-6 border rounded-sm p-4 flex items-start gap-3 ${s.border}`}>
      <div className={`flex-shrink-0 mt-0.5 ${s.text}`}>
        {urgency === "normal" ? <Bell className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
      </div>
      <div className="flex-1">
        <div className={`font-mono text-[10px] font-bold tracking-wider mb-1 ${s.text}`}>{s.label}</div>
        <p className="text-sm text-muted-foreground">
          Your bus departs on <span className="text-foreground font-semibold">{departureDate}</span> at <span className="text-foreground font-semibold">{departureTime}</span>.
          {timeLeft && timeLeft !== "Departed" && (
            <> Time remaining: <span className={`font-mono font-bold ${s.text}`}>{timeLeft}</span>.</>
          )}
          {timeLeft === "Departed" && <span className="text-destructive font-semibold"> This bus has already departed.</span>}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Arrive at the terminal at least <span className="font-semibold text-foreground">30 minutes</span> before departure. Tickets are non-refundable for missed buses.</p>
      </div>
    </div>
  );
}