import React, { useState } from "react";
import { useReveal } from "@/hooks/useReveal";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ChevronDown, ChevronUp, ShieldCheck, Ticket, Smartphone, Bus, HelpCircle } from "lucide-react";

const FAQS = [
  {
    category: "REFUND & CANCELLATION",
    icon: <ShieldCheck className="w-4 h-4 text-primary" />,
    items: [
      {
        q: "Can I get a refund if I cancel my ticket?",
        a: "Yes, but it depends on how far in advance you cancel. If you cancel more than 24 hours before departure, you receive a full 100% refund. If you cancel between 18 and 24 hours before departure, you receive a 50% refund. Cancellations within 18 hours of departure are non-refundable."
      },
      {
        q: "Is my ticket non-refundable if I miss my bus?",
        a: "Yes. If you miss your scheduled departure and did not cancel in advance, the ticket is non-refundable. Please arrive at the terminal at least 30 minutes before your departure time."
      },
      {
        q: "Can I transfer my ticket to another person?",
        a: "No. All tickets are strictly non-transferable. The passenger name on the ticket must match the ID presented at boarding. Tickets cannot be resold or gifted to another person."
      },
      {
        q: "How do I request a refund?",
        a: "Contact Abyssinian Kinetics support with your invoice number and the phone number used during booking. Eligible refunds are processed back to your Telebirr account within 3–5 business days."
      },
    ]
  },
  {
    category: "TICKET USAGE",
    icon: <Ticket className="w-4 h-4 text-primary" />,
    items: [
      {
        q: "What do I need to board the bus?",
        a: "You need to present your digital e-invoice QR code (accessible from your booking confirmation or by searching your invoice number on the Ticket page) along with a valid national ID or passport. Both must match the name on the booking."
      },
      {
        q: "Can I use my ticket on a different departure date or time?",
        a: "No. Tickets are valid only for the specific date, time, and route printed on the invoice. They cannot be rescheduled or used for a different departure."
      },
      {
        q: "What is my seat number?",
        a: "Seats are assigned automatically on a first-come, first-served basis at the time your booking is confirmed. Your assigned seat number is printed on your e-invoice QR ticket."
      },
      {
        q: "How do I find my ticket if I lose access to it?",
        a: "Visit the Ticket page on this platform and search using your invoice number (format: AK-XXXXXXXX). Your full e-invoice will be retrieved and displayed."
      },
    ]
  },
  {
    category: "PAYMENT",
    icon: <Smartphone className="w-4 h-4 text-primary" />,
    items: [
      {
        q: "What payment methods are accepted?",
        a: "Online bookings are paid via Telebirr — Ethiopia's leading mobile wallet. You will receive a push notification to authorize the payment with your Telebirr PIN. Walk-in bookings at the station are paid in cash and issued by an operator agent."
      },
      {
        q: "Is there a service fee?",
        a: "Yes. A small service fee of 15 ETB is added to online Telebirr bookings to cover platform processing costs. Cash walk-in bookings at the station may not include this fee."
      },
      {
        q: "What happens if my Telebirr payment fails?",
        a: "If the payment push notification expires or is declined, your seat is not confirmed and the booking is not created. Simply return to the routes page and start a new booking. No charge is applied for failed transactions."
      },
    ]
  },
  {
    category: "TRAVEL & BOARDING",
    icon: <Bus className="w-4 h-4 text-primary" />,
    items: [
      {
        q: "How early should I arrive at the terminal?",
        a: "We recommend arriving at least 30 minutes before your scheduled departure. Buses depart on time — late arrivals may result in forfeiture of your seat with no refund."
      },
      {
        q: "What luggage am I allowed to bring?",
        a: "Luggage allowances vary by operator and bus class. Generally, one piece of checked luggage (up to 20 kg) and one small carry-on are permitted. Oversized or excess luggage may incur additional fees payable at the terminal."
      },
      {
        q: "Are amenities like Wi-Fi and charging ports guaranteed?",
        a: "Listed amenities reflect the standard configuration for that bus type and operator. While operators strive to maintain all listed features, Abyssinian Kinetics cannot guarantee availability in the event of technical issues on a specific journey."
      },
    ]
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-sm transition-all ${open ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-4 p-5 text-left"
      >
        <span className="font-medium text-sm leading-relaxed">{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const kickerRef = useReveal(0.2, 0);
  const titleRef  = useReveal(0.2, 80);
  const subRef    = useReveal(0.2, 160);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-32 pb-12 bg-secondary/30 border-b border-border">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 text-center">
          <div className="w-12 h-12 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-6 h-6 text-primary" />
          </div>
          <div ref={kickerRef} className="reveal-kicker font-mono text-[11px] tracking-[0.3em] text-primary mb-4">PASSENGER GUIDE</div>
          <h1 ref={titleRef} className="reveal heading-mega text-4xl sm:text-5xl mb-4">Frequently Asked Questions</h1>
          <p ref={subRef} className="reveal text-muted-foreground text-base leading-relaxed max-w-xl mx-auto">
            Everything you need to know about booking, refunds, and boarding with Meda Kinetics. Read before you book.
          </p>
        </div>
      </section>

      {/* Refund Policy Quick Reference */}
      <section className="py-10 border-b border-border">
        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground mb-4">CANCELLATION AT A GLANCE</div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { window: "> 24 hours before", label: "FULL REFUND", pct: "100%", cls: "border-accent/40 bg-accent/5 text-accent" },
              { window: "12 – 24 hours before", label: "HALF REFUND", pct: "50%", cls: "border-primary/40 bg-primary/5 text-primary" },
              { window: "< 18 hours before", label: "NO REFUND", pct: "0%", cls: "border-destructive/40 bg-destructive/5 text-destructive" },
            ].map((r) => (
              <div key={r.label} className={`border rounded-sm p-4 text-center ${r.cls}`}>
                <div className={`font-display font-extrabold text-3xl mb-1 ${r.cls.split(" ").pop()}`}>{r.pct}</div>
                <div className="font-mono text-[10px] font-bold tracking-wider mb-1">{r.label}</div>
                <div className="text-[11px] text-muted-foreground">{r.window} departure</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">All tickets are <span className="text-foreground font-semibold">non-transferable</span>. Refunds are returned to the original Telebirr account.</p>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 space-y-12">
          {FAQS.map((section) => (
            <div key={section.category}>
              <div className="flex items-center gap-2 mb-5">
                {section.icon}
                <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">{section.category}</span>
              </div>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-12 border-t border-border bg-secondary/20">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 text-center">
          <p className="text-muted-foreground text-sm mb-2">Still have questions?</p>
          <p className="font-display font-bold text-lg">Contact our support team at the terminal or via the details in the footer.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}