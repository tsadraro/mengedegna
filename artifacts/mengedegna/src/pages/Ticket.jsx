import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EInvoice from "@/components/EInvoice";
import { Loader2, Search, XCircle, AlertTriangle } from "lucide-react";

export default function Ticket() {
  const [params] = useSearchParams();
  const [invoice, setInvoice] = useState(params.get("invoice") || "");
  const [searched, setSearched] = useState(params.get("invoice") || "");
  const [booking, setBooking] = useState(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelDone, setCancelDone] = useState(false);

  const handleCancel = async () => {
    if (!booking?.id) return;
    if (!window.confirm("Are you sure you want to cancel this booking? The refund policy applies. This cannot be undone.")) return;
    setCancelling(true);
    setCancelError("");
    try {
      const token = localStorage.getItem("base44_access_token");
      const resp = await fetch(`/api/apps/mengedegna/entities/Booking/${booking.id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.message || "Cancellation failed");
      setBooking((b) => ({ ...b, status: "cancelled" }));
      setCancelDone(true);
    } catch (e) {
      setCancelError(e.message || "Could not cancel booking. Please contact support.");
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    if (searched) {
      setLoading(true);
      setError("");
      base44.entities.Booking.filter({ invoice_number: searched }, "-created_date", 1)
        .then(async (res) => {
          if (!res || res.length === 0) {
            setError("No ticket found with that invoice number.");
            setBooking(null);
          } else {
            const b = res[0];
            setBooking(b);
            if (b.route_id) {
              base44.entities.Route.get(b.route_id).then(setRoute).catch(() => setRoute(null));
            }
          }
        })
        .catch(() => setError("Could not retrieve ticket."))
        .finally(() => setLoading(false));
    }
  }, [searched]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-24">
        <div className="max-w-2xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-10">
            <div className="font-mono text-[11px] tracking-[0.3em] text-primary mb-3">RETRIEVE YOUR PASSPORT</div>
            <h1 className="heading-mega text-4xl sm:text-5xl">Find My Ticket</h1>
            <p className="text-muted-foreground mt-3">Enter your invoice number to view or download your e-ticket.</p>
          </div>

          <div className="flex gap-3 mb-8">
            <input
              value={invoice}
              onChange={(e) => setInvoice(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && setSearched(invoice.trim())}
              placeholder="AK-XXXXXXXX"
              className="flex-1 bg-card border border-border rounded-sm px-4 py-3.5 font-mono focus:border-primary focus:outline-none"
            />
            <button
              onClick={() => setSearched(invoice.trim())}
              className="bg-primary text-primary-foreground font-semibold px-6 py-3.5 rounded-sm hover:brightness-110 transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Find
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-destructive">
              <p className="font-display text-lg">{error}</p>
            </div>
          )}

          {booking && !loading && !error && (
            <div>
              <EInvoice booking={booking} route={route} />

              {/* Cancellation */}
              {booking.status === "confirmed" && (
                <div className="mt-6 border border-border rounded-sm p-5">
                  <h3 className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground mb-3">CANCEL THIS BOOKING</h3>
                  {cancelDone ? (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <XCircle className="w-4 h-4" /> Booking cancelled. Refund processed per the applicable policy.
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">
                        Cancelling restores the seat to available inventory. The refund amount depends on how far in advance you cancel — check the policy on your ticket above.
                      </p>
                      {cancelError && (
                        <div className="flex items-center gap-2 text-destructive text-sm mb-3 border border-destructive/30 bg-destructive/10 rounded-sm px-3 py-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {cancelError}
                        </div>
                      )}
                      <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="flex items-center gap-2 text-sm border border-destructive/40 text-destructive px-4 py-2.5 rounded-sm hover:bg-destructive/10 transition-all disabled:opacity-50"
                      >
                        {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Cancel Booking
                      </button>
                    </>
                  )}
                </div>
              )}
              {booking.status === "cancelled" && (
                <div className="mt-6 flex items-center gap-3 border border-destructive/30 bg-destructive/10 rounded-sm px-5 py-4">
                  <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.2em] text-destructive font-bold mb-0.5">BOOKING CANCELLED</div>
                    <p className="text-sm text-muted-foreground">This booking has been cancelled. Contact support for refund status.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}