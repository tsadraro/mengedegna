import React, { useState } from "react";
import { Smartphone, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";

export default function TelebirrPay({ phone, amount, onPaid }) {
  const [stage, setStage] = useState("idle"); // idle | requesting | push | confirming | success
  const [pin, setPin] = useState("");

  const startPayment = () => {
    setStage("requesting");
    setTimeout(() => setStage("push"), 1600);
  };

  const confirmPush = () => {
    setStage("confirming");
    setTimeout(() => {
      setStage("success");
      setTimeout(onPaid, 900);
    }, 1800);
  };

  if (stage === "success") {
    return (
      <div className="text-center py-10 animate-liquid">
        <div className="w-16 h-16 mx-auto rounded-full bg-accent/15 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-9 h-9 text-accent" />
        </div>
        <h3 className="font-display font-bold text-xl">Payment Confirmed</h3>
        <p className="text-muted-foreground text-sm mt-1">Telebirr transaction approved</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-sm p-8 max-w-md mx-auto">
      <div className="flex items-center justify-center mb-6">
        <div className="px-5 py-2.5 rounded-sm bg-accent/10 border border-accent/30 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-accent" />
          <span className="font-display font-bold text-accent tracking-wide">Telebirr</span>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground mb-1">AMOUNT DUE</div>
        <div className="font-display font-extrabold text-4xl">
          {amount.toLocaleString()}<span className="text-base text-muted-foreground ml-1">ETB</span>
        </div>
      </div>

      {stage === "idle" && (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            A payment push notification will be sent to your Telebirr app on
            <div className="text-foreground font-mono mt-1">+251 {phone}</div>
          </div>
          <button
            onClick={startPayment}
            className="w-full bg-accent text-accent-foreground font-semibold py-3.5 rounded-sm hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4" /> Send Payment Request
          </button>
        </div>
      )}

      {stage === "requesting" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-sm text-muted-foreground">Contacting Telebirr gateway…</p>
        </div>
      )}

      {stage === "push" && (
        <div className="space-y-4 animate-liquid">
          <div className="flex items-center justify-center gap-2 text-accent text-sm">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            Push notification sent — open your Telebirr app
          </div>
          <div className="relative">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="• • • •"
              className="w-full text-center tracking-[0.8em] bg-transparent border border-border rounded-sm py-3.5 focus:border-accent focus:outline-none font-mono text-lg"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground">PIN</span>
          </div>
          <button
            onClick={confirmPush}
            disabled={pin.length < 4}
            className="w-full bg-accent text-accent-foreground font-semibold py-3.5 rounded-sm hover:brightness-110 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" /> Authorize Payment
          </button>
        </div>
      )}

      {stage === "confirming" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-sm text-muted-foreground">Verifying transaction…</p>
        </div>
      )}
    </div>
  );
}