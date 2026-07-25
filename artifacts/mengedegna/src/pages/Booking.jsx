import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TelebirrPay from "@/components/TelebirrPay";
import EInvoice from "@/components/EInvoice";
import {
  ArrowRight, ArrowLeft, Check, ShieldAlert, Loader2, Bus, MapPin,
  UserCheck, Banknote, Bell, Clock, PartyPopper, Armchair, Users,
  Globe, Ticket, MessageSquare, AlertTriangle, Smartphone, Pencil,
} from "lucide-react";
import { useLang } from "@/lib/LanguageContext";
import { getRefundPolicyForBooking } from "@/lib/refundPolicy";
import { SEATING_RULE } from "@/lib/operatorProfiles";
import SeatMap from "@/components/SeatMap";
import TripComparison from "@/components/TripComparison";

// Steps: 1=Details+Seats+Delivery | 2=Payment | 3=Ticket
export default function Booking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const routeId = params.get("route");

  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  // ── Passenger count chosen upfront ────────────────────────────────────────
  const [passengerCount, setPassengerCount] = useState(null);

  // Passenger info — firstName + lastName + phone per person; index 0 is lead/payer
  const [passengers, setPassengers] = useState([{ firstName: "", lastName: "", phone: "" }]);
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Convenience aliases for lead passenger
  const firstName = passengers[0]?.firstName ?? "";
  const lastName  = passengers[0]?.lastName  ?? "";
  const phone     = passengers[0]?.phone     ?? "";
  const leadName  = `${firstName} ${lastName}`.trim();

  // Helper: full name string for a passenger index
  const passengerName = (i) =>
    `${passengers[i]?.firstName?.trim() || ""} ${passengers[i]?.lastName?.trim() || ""}`.trim();

  // Once all seats are picked (count matches), the seat map collapses
  const seatsConfirmed = !!(passengerCount && selectedSeats.length === passengerCount);

  // Keep passengers array in sync with passengerCount
  useEffect(() => {
    if (!passengerCount) return;
    setPassengers((prev) => {
      if (prev.length === passengerCount) return prev;
      if (prev.length < passengerCount) {
        return [
          ...prev,
          ...Array.from({ length: passengerCount - prev.length }, () => ({
            firstName: "", lastName: "", phone: "",
          })),
        ];
      }
      return prev.slice(0, passengerCount);
    });
  }, [passengerCount]);

  // Seat hold
  const [heldBookingIds, setHeldBookingIds] = useState([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);
  const [holdError, setHoldError] = useState(null);
  const [holdLoading, setHoldLoading] = useState(false);

  // Delivery method — default to digital boarding pass
  const [deliveryMethod, setDeliveryMethod] = useState("boarding-pass");

  // Post-payment
  const [bookings, setBookings] = useState([]);
  const [creating, setCreating] = useState(false);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);

  // Auth / mode
  const [agentMode, setAgentMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Geo / FX
  const [isAbroad, setIsAbroad] = useState(false);
  const [geoChecked, setGeoChecked] = useState(false);
  const [usdToEtb, setUsdToEtb] = useState(130);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((d) => { setIsAbroad(d.country_code !== "ET"); setGeoChecked(true); })
      .catch(() => setGeoChecked(true));
    fetch("https://api.frankfurter.app/latest?from=USD&to=ETB")
      .then((r) => r.json())
      .then((d) => { if (d?.rates?.ETB) setUsdToEtb(d.rates.ETB); })
      .catch(() => {});
  }, []);

  const isOperator = currentUser?.role === "operator";
  const isAdmin    = currentUser?.role === "admin";
  const effectiveAgentMode = isOperator ? true : agentMode;

  useEffect(() => {
    if (!routeId) return;
    base44.entities.Route.get(routeId)
      .then((r) => {
        if (isOperator && currentUser?.operator_name && r.operator !== currentUser.operator_name) {
          navigate("/routes"); return;
        }
        setRoute(r); setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [routeId, isOperator, currentUser]);

  const fare             = route?.fare || 0;
  const serviceFee       = isAbroad ? 0 : 20;
  const internationalFee = isAbroad ? Math.round(usdToEtb) : 0;
  const totalPerSeat     = fare + serviceFee + internationalFee;
  const seatCount        = selectedSeats.length || 1;
  const grandTotal       = totalPerSeat * Math.max(selectedSeats.length, 1);
  const maxSeats         = Math.min(12, route?.available_seats || 1);

  // ── Validation: all passengers have at least 2-char names ─────────────────
  const namesValid = passengerCount
    ? Array.from({ length: passengerCount }, (_, i) => passengerName(i)).every((n) => n.length >= 2)
    : false;

  // ── Step 1 → 2: Hold the selected seats ───────────────────────────────────
  const handleHoldSeats = async () => {
    setHoldError(null);
    setHoldLoading(true);
    const seats = [...selectedSeats].sort((a, b) => a - b).map(String);
    const expiresAt = new Date(Date.now() + 12 * 60 * 1000).toISOString();
    const holdRecords = seats.map((seat, i) => ({
      route_id: route.id,
      passenger_name: passengerName(i) || leadName,
      phone: passengers[0]?.phone || phone,
      seat_number: seat,
      from_city: route.from_city,
      to_city: route.to_city,
      operator: route.operator,
      departure_date: route.departure_date,
      departure_time: route.departure_time,
      arrival_time: route.arrival_time,
      fare: totalPerSeat,
      status: "held",
      hold_expires_at: expiresAt,
    }));
    try {
      const created = await base44.entities.Booking.bulkCreate(holdRecords);
      const ids = (Array.isArray(created) ? created : holdRecords).map((b) => b.id).filter(Boolean);
      setHeldBookingIds(ids);
      setHoldExpiresAt(expiresAt);
      setStep(2); // go directly to payment
    } catch {
      setHoldError("Could not reserve seats. Please try again.");
    } finally {
      setHoldLoading(false);
    }
  };

  // ── Step 2 → 1: Release holds and go back ─────────────────────────────────
  const handleReleaseHolds = async () => {
    for (const id of heldBookingIds) {
      try { await base44.entities.Booking.delete(id); } catch {}
    }
    setHeldBookingIds([]);
    setHoldExpiresAt(null);
    setSelectedSeats([]);
    setDeliveryMethod("boarding-pass");
    setStep(1);
  };

  // ── Payment confirmed: atomically update held bookings → confirmed ─────────
  const handlePaid = async (paymentMethod = "telebirr") => {
    setCreating(true);
    setHoldError(null);

    if (holdExpiresAt && new Date(holdExpiresAt) < new Date()) {
      setHoldError("Your seat hold has expired. Please re-select your seats.");
      setHeldBookingIds([]);
      setSelectedSeats([]);
      setStep(1);
      setCreating(false);
      return;
    }

    const policy = getRefundPolicyForBooking(route.departure_date, route.departure_time);
    const refundPolicy = policy.pct === 100 ? "full" : policy.pct === 50 ? "half" : "none";
    const seats = [...selectedSeats].sort((a, b) => a - b).map(String);
    const baseInvoice = `AK-${Date.now().toString().slice(-8)}`;

    try {
      if (heldBookingIds.length > 0) {
        // ── Atomic path ──────────────────────────────────────────────────────
        const token = localStorage.getItem("base44_access_token");
        const resp = await fetch("/api/apps/mengedegna/atomic/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            heldBookingIds,
            routeId: route.id,
            paymentMethod,
            deliveryMethod,
            invoiceBase: baseInvoice,
            refundPolicy,
          }),
        });

        const data = await resp.json().catch(() => ({}));

        if (!resp.ok) {
          if (resp.status === 409) {
            setHoldError(data.message || "Seat conflict. Please re-select seats.");
            for (const rid of heldBookingIds) {
              try { await base44.entities.Booking.delete(rid); } catch {}
            }
            setHeldBookingIds([]);
            setSelectedSeats([]);
            setStep(1);
            setCreating(false);
            return;
          }
          throw new Error(data.message || "Confirmation failed");
        }

        setBookings(Array.isArray(data) ? data : [data]);
      } else {
        // ── Fallback: create confirmed bookings directly ─────────────────────
        const records = seats.map((seat, i) => ({
          route_id: route.id,
          passenger_name: passengerName(i) || leadName,
          phone: passengers[0]?.phone || phone,
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
          payment_status: paymentMethod === "cash" ? "cash" : "online",
          invoice_number: seats.length === 1 ? baseInvoice : `${baseInvoice}-${i + 1}`,
          qr_data: seats.length === 1 ? baseInvoice : `${baseInvoice}-${i + 1}`,
          refund_policy: refundPolicy,
          delivery_method: deliveryMethod,
        }));
        const created = await base44.entities.Booking.bulkCreate(records);
        await base44.entities.Route.update(route.id, {
          available_seats: Math.max(0, route.available_seats - seats.length),
        });
        setBookings(Array.isArray(created) ? created : records);
      }

      setStep(3); // ticket
      setShowConfirmAlert(true);
      setTimeout(() => setShowConfirmAlert(false), 6000);
    } catch (err) {
      setHoldError(err.message || "Payment confirmation failed. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────

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

          {/* Hold error banner */}
          {holdError && (
            <div className="mt-6 flex items-start gap-3 border border-destructive/50 bg-destructive/10 rounded-sm px-5 py-4">
              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{holdError}</p>
            </div>
          )}

          {/* Route summary bar */}
          <div className="glass rounded-sm p-5 mt-6 mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-secondary border border-border flex items-center justify-center">
                <Bus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-display font-bold text-sm">{route.operator_name || route.operator} · {route.bus_type}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-3 h-3" />{route.from_city} → {route.to_city}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div><span className="text-muted-foreground text-xs">DEPART</span><div className="font-mono font-bold">{route.departure_time}</div></div>
              <div><span className="text-muted-foreground text-xs">ARRIVE</span><div className="font-mono font-bold">{route.arrival_time}</div></div>
              <div><span className="text-muted-foreground text-xs">DATE</span><div className="font-mono font-bold">{route.departure_date}</div></div>
              <div>
                <span className="text-muted-foreground text-xs">SEATS LEFT</span>
                <div className={`font-mono font-bold ${route.available_seats <= 7 ? "text-destructive" : "text-accent"}`}>
                  {route.available_seats}
                </div>
              </div>
            </div>
          </div>

          {/* ── STEP 1: Passenger count → Details → Seat Map → Delivery ── */}
          {step === 1 && (
            <div className="space-y-6">
              <TripComparison currentRoute={route} />

              {/* 1a. Number of Passengers */}
              <div className="bg-card border border-border rounded-sm p-6">
                <label className="font-mono text-[10px] tracking-[0.25em] text-primary block mb-2">
                  {lang === "am" ? "የተሳፋሪዎች ብዛት" : "NUMBER OF PASSENGERS"}
                </label>
                <select
                  value={passengerCount ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setPassengerCount(val);
                    setSelectedSeats([]);
                  }}
                  className="w-full bg-transparent border-b border-border py-3 focus:border-primary focus:outline-none text-base font-medium appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    {lang === "am" ? "ይምረጡ…" : "Select number of passengers…"}
                  </option>
                  {Array.from({ length: Math.min(12, maxSeats) }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1
                        ? (lang === "am" ? "ተሳፋሪ" : "Passenger")
                        : (lang === "am" ? "ተሳፋሪዎች" : "Passengers")}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-2">
                  {lang === "am"
                    ? "ለእያንዳንዱ ተሳፋሪ አንድ መቀመጫ ይጠበቃል።"
                    : "One seat will be reserved per passenger."}
                </p>
              </div>

              {/* 1b. Passenger details + Summary card (shown once count chosen) */}
              {passengerCount && (
                <>
                  <div className="grid lg:grid-cols-[1fr_280px] gap-8">
                    <div className="bg-card border border-border rounded-sm p-8">
                      <h3 className="font-display font-bold text-xl mb-2">Passenger Details</h3>
                      <div className="space-y-6">
                        {/* Per-passenger first + last name */}
                        <div className="space-y-5">
                          <div className="font-mono text-[10px] tracking-[0.25em] text-primary">
                            PASSENGER NAMES · {passengerCount} {passengerCount === 1 ? "PERSON" : "PEOPLE"}
                          </div>
                          {Array.from({ length: passengerCount }, (_, i) => {
                            const sortedSeats = [...selectedSeats].sort((a, b) => a - b);
                            return (
                              <div key={i}>
                                <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground mb-2.5">
                                  {i === 0 ? "LEAD PASSENGER" : `PASSENGER ${i + 1}`}
                                  {sortedSeats[i] !== undefined && (
                                    <span className="ml-2 text-primary">· SEAT {sortedSeats[i]}</span>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] text-muted-foreground block mb-1">FIRST NAME</label>
                                    <input
                                      value={passengers[i]?.firstName || ""}
                                      onChange={(e) =>
                                        setPassengers((prev) =>
                                          prev.map((p, idx) => idx === i ? { ...p, firstName: e.target.value } : p)
                                        )
                                      }
                                      placeholder={lang === "am" ? "ስም" : "Abebe"}
                                      className="w-full bg-transparent border-b border-border py-2.5 focus:border-primary focus:outline-none text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-muted-foreground block mb-1">LAST NAME</label>
                                    <input
                                      value={passengers[i]?.lastName || ""}
                                      onChange={(e) =>
                                        setPassengers((prev) =>
                                          prev.map((p, idx) => idx === i ? { ...p, lastName: e.target.value } : p)
                                        )
                                      }
                                      placeholder={lang === "am" ? "የቤተሰብ ስም" : "Kebede"}
                                      className="w-full bg-transparent border-b border-border py-2.5 focus:border-primary focus:outline-none text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Lead passenger phone — below names since it's for payment/contact, not identity */}
                        <div>
                          <label className="font-mono text-[10px] tracking-[0.25em] text-primary block mb-2">
                            {effectiveAgentMode ? "CUSTOMER PHONE NUMBER" : "PHONE NUMBER"}
                          </label>
                          <div className="flex items-center border-b border-border focus-within:border-primary">
                            <span className="text-muted-foreground font-mono py-3">+251</span>
                            <input
                              value={phone}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                setPassengers((prev) => prev.map((p, i) => i === 0 ? { ...p, phone: val } : p));
                              }}
                              placeholder="9XX XXX XXX"
                              inputMode="numeric"
                              className="w-full bg-transparent py-3 px-2 focus:outline-none font-mono"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {effectiveAgentMode
                              ? "Used for the ticket record and any follow-up contact."
                              : "Used for your ticket record and Telebirr payment notification."}
                          </p>
                        </div>

                        {geoChecked && isAbroad && (
                          <div className="flex items-start gap-2 border border-accent/40 bg-accent/5 rounded-sm px-4 py-3">
                            <Globe className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-mono text-[9px] tracking-[0.2em] text-accent font-bold mb-0.5">INTERNATIONAL BOOKING DETECTED</div>
                              <span className="text-xs text-muted-foreground">
                                A <span className="text-accent font-semibold">$1 international remittance fee</span> applies per seat.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <SummaryCard
                      route={route}
                      totalPerSeat={totalPerSeat}
                      serviceFee={serviceFee}
                      internationalFee={internationalFee}
                      isAbroad={isAbroad}
                      seatCount={selectedSeats.length || passengerCount}
                      grandTotal={(selectedSeats.length || passengerCount) * totalPerSeat}
                    />
                  </div>

                  {/* 1c. Seat Map — shrinks once all seats selected */}

                  {/* Collapsed summary row (shown when seatsConfirmed) */}
                  {seatsConfirmed && (
                    <div className="bg-card border border-primary/30 rounded-sm px-5 py-4 flex items-center justify-between animate-slide-up">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-sm bg-primary/10 flex items-center justify-center">
                          <Armchair className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-mono text-[10px] tracking-[0.2em] text-primary font-bold mb-1">
                            {passengerCount === 1 ? "SEAT SELECTED" : "SEATS SELECTED"}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {[...selectedSeats].sort((a, b) => a - b).map((s) => (
                              <span
                                key={s}
                                className="font-mono font-bold text-sm bg-primary/10 text-primary px-2.5 py-0.5 rounded-sm"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedSeats([])}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary border border-border hover:border-primary/40 px-3 py-2 rounded-sm transition-all"
                      >
                        <Pencil className="w-3 h-3" /> Change
                      </button>
                    </div>
                  )}

                  {/* Full seat map — collapses smoothly on confirmation */}
                  <div
                    style={{
                      maxHeight: seatsConfirmed ? 0 : "2000px",
                      overflow: "hidden",
                      transition: "max-height 0.45s ease-in-out",
                    }}
                  >
                    <SeatMap
                      route={route}
                      selectedSeats={selectedSeats}
                      onSelect={setSelectedSeats}
                      maxSeats={passengerCount}
                    />
                    {!seatsConfirmed && (
                      <p className="text-center text-xs text-muted-foreground mt-3">
                        {lang === "am"
                          ? `${passengerCount} ወንበር ይምረጡ`
                          : `Pick ${passengerCount} seat${passengerCount > 1 ? "s" : ""} to continue`}
                      </p>
                    )}
                  </div>

                  {/* 1d. Delivery method — slides in after seats are confirmed */}
                  <div
                    style={{
                      maxHeight: seatsConfirmed ? "600px" : 0,
                      overflow: "hidden",
                      transition: "max-height 0.45s ease-in-out",
                    }}
                  >
                    <div className="space-y-4 pt-2">
                      <div>
                        <h3 className="font-display font-bold text-lg mb-1">
                          {lang === "am" ? "ቲኬቱን እንዴት ይቀበላሉ?" : "How would you like your ticket?"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {lang === "am"
                            ? "ክፍያ ከተከፈለ በኋላ ቲኬቱ እንዴት እንደሚደርስዎ ይምረጡ።"
                            : "Choose how to receive your ticket after payment."}
                        </p>
                      </div>
                      <div className="space-y-3">
                        {[
                          {
                            value: "boarding-pass",
                            emoji: "📱",
                            title: lang === "am" ? "ዲጂታል ቲኬት" : "Digital Ticket",
                            desc: lang === "am"
                              ? "ቲኬቱን በስልክ ላይ ያዩ። ሲሳፈሩ ያሳዩ።"
                              : "View your ticket on your phone. Show it when boarding.",
                            recommended: true,
                          },
                          {
                            value: "sms",
                            emoji: "💬",
                            title: lang === "am" ? "ኤስኤምኤስ ወደ ስልኬ" : "SMS to my phone",
                            desc: lang === "am"
                              ? `ምዝገባ ዝርዝር ወደ +251 ${phone} እንልካለን።`
                              : `Booking details sent to +251 ${phone}.`,
                            recommended: false,
                          },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setDeliveryMethod(opt.value)}
                            className={`w-full text-left border-2 rounded-sm p-4 transition-all relative ${
                              deliveryMethod === opt.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40 hover:bg-secondary/40"
                            }`}
                          >
                            {opt.recommended && (
                              <span className="absolute top-3 right-3 text-[10px] font-mono font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-sm">
                                {lang === "am" ? "ተወዳጅ" : "RECOMMENDED"}
                              </span>
                            )}
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0 text-xl ${
                                deliveryMethod === opt.value ? "bg-primary/15" : "bg-secondary"
                              }`}>
                                {opt.emoji}
                              </div>
                              <div className="flex-1 min-w-0 pr-16">
                                <div className="flex items-center gap-2">
                                  <span className="font-display font-bold text-base">{opt.title}</span>
                                  {deliveryMethod === opt.value && (
                                    <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                      <Check className="w-3 h-3 text-primary-foreground" />
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{opt.desc}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Reserve button */}
                      <button
                        disabled={!namesValid || phone.length < 9 || holdLoading}
                        onClick={handleHoldSeats}
                        className="mt-2 w-full bg-primary text-primary-foreground font-semibold py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                      >
                        {holdLoading ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Reserving seats…</>
                        ) : (
                          <>Reserve {passengerCount > 1 ? `${passengerCount} Seats` : "Seat"} & Continue to Payment <ArrowRight className="w-4 h-4" /></>
                        )}
                      </button>
                      {!namesValid && phone.length >= 9 && (
                        <p className="text-center text-xs text-destructive">
                          Please fill in every passenger's first and last name to continue.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── STEP 2: Payment ── */}
          {step === 2 && (
            <div>
              {holdExpiresAt && <HoldCountdown expiresAt={holdExpiresAt} seats={selectedSeats} className="mb-6" />}

              {/* Big total display */}
              <div className="bg-card border-2 border-primary/30 rounded-sm p-6 mb-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  {lang === "am" ? "ጠቅላላ ክፍያ" : "Total to Pay"}
                </p>
                <div className="font-display font-extrabold text-4xl sm:text-5xl text-primary">
                  {grandTotal.toLocaleString()}
                  <span className="text-lg text-muted-foreground ml-2">ETB</span>
                </div>
                {seatCount > 1 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {totalPerSeat.toLocaleString()} ETB × {seatCount}{" "}
                    {lang === "am" ? "ወንበሮች" : "seats"}
                  </p>
                )}
                <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
                  <span className="font-mono">{route.from_city} → {route.to_city}</span>
                  <span>·</span>
                  <span>{route.departure_date}</span>
                  <span>·</span>
                  <span className="font-mono">
                    {lang === "am" ? "ወንበር" : "Seat"}{selectedSeats.length > 1 ? "s" : ""}{" "}
                    {[...selectedSeats].sort((a, b) => a - b).join(", ")}
                  </span>
                </div>
              </div>

              {effectiveAgentMode ? (
                <div className="max-w-md mx-auto">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/15 flex items-center justify-center mb-4 text-3xl">💵</div>
                    <div className="font-mono text-[11px] tracking-[0.3em] text-primary mb-2">AGENT MODE · CASH PAYMENT</div>
                    <h2 className="font-display font-bold text-2xl sm:text-3xl">
                      {lang === "am" ? "ጥሬ ገንዘብ ያረጋግጡ" : "Collect Cash & Confirm"}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-2">
                      {lang === "am"
                        ? `ከደንበኛ ${grandTotal.toLocaleString()} ብር ሰብስቡ።`
                        : `Collect ${grandTotal.toLocaleString()} ETB from the customer.`}
                    </p>
                  </div>
                  <div className="bg-card border border-border rounded-sm p-6 space-y-3 text-sm mb-6">
                    <div className="flex justify-between"><span className="text-muted-foreground">Passenger</span><span className="font-medium">{leadName}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-mono">+251 {phone}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Seats</span><span className="font-mono font-bold text-primary">{[...selectedSeats].sort((a, b) => a - b).join(", ")}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Route</span><span>{route.from_city} → {route.to_city}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="capitalize">{deliveryMethod === "boarding-pass" ? "Digital boarding pass" : "SMS"}</span></div>
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
                    <button onClick={handleReleaseHolds} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 mx-auto">
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
                      <p className="text-muted-foreground text-sm mt-2">
                        {seatCount} seats · <span className="text-primary font-bold">{grandTotal.toLocaleString()} ETB</span> total
                      </p>
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
                    <button onClick={handleReleaseHolds} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 mx-auto">
                      <ArrowLeft className="w-4 h-4" /> Back — change seats
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── STEP 3: Tickets ── */}
          {step === 3 && bookings.length > 0 && (
            <div>
              {showConfirmAlert && (
                <div className="mb-6 flex items-center gap-3 border border-accent/50 bg-accent/10 rounded-sm px-5 py-4 animate-slide-up">
                  <PartyPopper className="w-5 h-5 text-accent flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-mono text-[10px] tracking-[0.2em] text-accent font-bold mb-0.5">BOOKING CONFIRMED</div>
                    <p className="text-sm text-foreground">
                      {bookings.length > 1 ? `${bookings.length} tickets` : "Your ticket"} for{" "}
                      <span className="font-semibold">{bookings[0].from_city} → {bookings[0].to_city}</span>{" "}
                      {bookings.length > 1 ? "have" : "has"} been issued.
                    </p>
                  </div>
                  <button onClick={() => setShowConfirmAlert(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
                </div>
              )}

              {bookings[0]?.delivery_method === "sms" && (
                <div className="mb-6 flex items-start gap-3 border border-primary/30 bg-primary/5 rounded-sm px-5 py-4">
                  <MessageSquare className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.2em] text-primary font-bold mb-0.5">SMS TICKET SUMMARY</div>
                    <p className="text-sm text-muted-foreground">
                      A text message with your booking details has been sent to{" "}
                      <span className="font-mono text-foreground">+251 {bookings[0].phone}</span>.
                    </p>
                  </div>
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

// ── Sub-components ─────────────────────────────────────────────────────────────

function Stepper({ step }) {
  const steps = ["Details & Seats", "Payment", "Ticket"];
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
            {i < steps.length - 1 && <div className={`w-6 h-px ${step > n ? "bg-primary" : "bg-border"}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function HoldCountdown({ expiresAt, seats, className = "" }) {
  const [remaining, setRemaining] = useState("");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const tick = () => {
      const ms = new Date(expiresAt) - Date.now();
      if (ms <= 0) { setRemaining("expired"); return; }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRemaining(`${m}:${s.toString().padStart(2, "0")}`);
      setUrgent(ms < 3 * 60 * 1000);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!remaining || remaining === "expired") return null;

  return (
    <div className={`flex items-center gap-3 border rounded-sm px-4 py-3 ${
      urgent ? "border-destructive/50 bg-destructive/10" : "border-primary/30 bg-primary/5"
    } ${className}`}>
      <Clock className={`w-4 h-4 flex-shrink-0 ${urgent ? "text-destructive" : "text-primary"}`} />
      <div>
        <span className={`font-mono text-[10px] font-bold tracking-wider ${urgent ? "text-destructive" : "text-primary"}`}>
          SEAT{seats.length > 1 ? "S" : ""} HELD · EXPIRES IN{" "}
        </span>
        <span className={`font-mono font-bold ${urgent ? "text-destructive" : "text-primary"}`}>{remaining}</span>
        <span className={`text-xs ml-2 ${urgent ? "text-destructive/80" : "text-muted-foreground"}`}>
          — Seat{seats.length > 1 ? "s" : ""} {[...seats].sort((a, b) => a - b).join(", ")} reserved for you
        </span>
      </div>
    </div>
  );
}

function SummaryCard({ route, totalPerSeat, serviceFee, internationalFee, isAbroad, seatCount, grandTotal }) {
  const policy = route ? getRefundPolicyForBooking(route.departure_date, route.departure_time) : null;
  const colorMap = {
    accent: "text-accent border-accent/40",
    primary: "text-primary border-primary/40",
    destructive: "text-destructive border-destructive/40",
  };
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
        {seatCount > 1 && <Row label="Seats" value={`× ${seatCount}`} muted />}
      </div>
      <div className="h-px bg-border my-5" />
      <div className="flex items-end justify-between">
        <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">TOTAL</span>
        <div className="font-display font-extrabold text-2xl text-primary">
          {grandTotal.toLocaleString()}<span className="text-xs text-muted-foreground ml-1">ETB</span>
        </div>
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
      setUrgency(h < 1 ? "imminent" : h < 3 ? "soon" : "normal");
      setTimeLeft(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
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
          Your bus departs on <span className="text-foreground font-semibold">{departureDate}</span> at{" "}
          <span className="text-foreground font-semibold">{departureTime}</span>.
          {timeLeft && timeLeft !== "Departed" && (
            <> Time remaining: <span className={`font-mono font-bold ${s.text}`}>{timeLeft}</span>.</>
          )}
          {timeLeft === "Departed" && <span className="text-destructive font-semibold"> This bus has already departed.</span>}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Arrive at the terminal at least <span className="font-semibold text-foreground">30 minutes</span> before departure. Tickets are non-refundable for missed buses.
        </p>
      </div>
    </div>
  );
}
