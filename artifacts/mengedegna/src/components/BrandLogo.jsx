import React from "react";
import { Bus } from "lucide-react";

/**
 * Animated MEDA KINETICS brand logo.
 * size="sm" | "md" (default) | "lg"
 */
export default function BrandLogo({ size = "md" }) {
  const iconSize = size === "sm" ? "w-7 h-7" : size === "lg" ? "w-12 h-12" : "w-9 h-9";
  const busSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-7 h-7" : "w-5 h-5";
  const titleSize = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-base";
  const subSize = size === "sm" ? "text-[8px]" : size === "lg" ? "text-[12px]" : "text-[9px]";

  return (
    <div className="flex items-center gap-2.5 group">
      {/* Icon with spin-in + pulse */}
      <div
        className={`${iconSize} rounded-sm bg-primary flex items-center justify-center relative overflow-hidden`}
        style={{ animation: "logo-pop 0.5s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        {/* Shimmer sweep */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)",
            animation: "shimmer 1.8s ease-in-out infinite",
          }}
        />
        <Bus className={`${busSize} text-primary-foreground relative z-10`} strokeWidth={2.2} />
      </div>

      {/* Text */}
      <div className="leading-none">
        <div
          className={`font-display font-extrabold tracking-tight ${titleSize}`}
          style={{ animation: "slide-in-right 0.45s 0.05s cubic-bezier(0.22,1,0.36,1) both" }}
        >
          MEDA
        </div>
        <div
          className={`font-mono tracking-[0.3em] text-primary ${subSize}`}
          style={{ animation: "slide-in-right 0.45s 0.12s cubic-bezier(0.22,1,0.36,1) both" }}
        >
          KINETICS
        </div>
      </div>

      <style>{`
        @keyframes logo-pop {
          0%   { transform: scale(0.6) rotate(-12deg); opacity: 0; }
          70%  { transform: scale(1.08) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          60%  { transform: translateX(200%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}