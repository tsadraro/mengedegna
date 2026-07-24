import React from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background relative overflow-hidden">
      <div className="absolute inset-0 topo-bg" />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 relative">
        <div className="grid lg:grid-cols-4 gap-12">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <BrandLogo />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              The movement engine for all of Ethiopia — every culture, every region, every faith.
              Seamless booking, boarding, and beyond. Powered by Telebirr.
            </p>
          </div>
          <div>
            <h4 className="font-display font-bold text-sm mb-5 tracking-wide">EXPLORE</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/routes" className="hover:text-primary transition-colors">Routes & Schedules</Link></li>
              <li><Link to="/operators" className="hover:text-primary transition-colors">Operators</Link></li>
              <li><Link to="/#about" className="hover:text-primary transition-colors">Our Mission</Link></li>
              <li><Link to="/#terms" className="hover:text-primary transition-colors">Ticket Policy</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-sm mb-5 tracking-wide">CONTACT</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> Add your phone number</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> Add your email address</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Add your office address</li>
            </ul>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-border/60 flex flex-col sm:flex-row justify-between gap-4 text-xs text-muted-foreground font-mono">
          <span>© 2026 MEDA KINETICS. ALL RIGHTS RESERVED.</span>
          <span className="text-primary">NON-REFUNDABLE TICKETS · TELEBIRR SECURED</span>
        </div>
      </div>
    </footer>
  );
}