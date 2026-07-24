import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EInvoice from "@/components/EInvoice";
import { Loader2, Search } from "lucide-react";

export default function Ticket() {
  const [params] = useSearchParams();
  const [invoice, setInvoice] = useState(params.get("invoice") || "");
  const [searched, setSearched] = useState(params.get("invoice") || "");
  const [booking, setBooking] = useState(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

          {booking && !loading && !error && <EInvoice booking={booking} route={route} />}
        </div>
      </div>
      <Footer />
    </div>
  );
}