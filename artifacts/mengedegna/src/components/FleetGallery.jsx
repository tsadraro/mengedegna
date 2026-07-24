import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";

export default function FleetGallery({ images = [], operatorName }) {
  const [lightbox, setLightbox] = useState(null); // index or null

  if (!images.length) return null;

  const prev = () => setLightbox((i) => (i - 1 + images.length) % images.length);
  const next = () => setLightbox((i) => (i + 1) % images.length);

  return (
    <div>
      <h2 className="font-display font-bold text-2xl mb-6 flex items-center gap-2">
        <Images className="w-5 h-5 text-primary" /> Fleet Gallery
      </h2>

      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setLightbox(i)}
            className="relative overflow-hidden rounded-sm aspect-video group border border-border hover:border-primary/60 transition-all"
          >
            <img
              src={src}
              alt={`${operatorName} fleet ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-5 right-5 text-white/70 hover:text-white p-2"
            onClick={() => setLightbox(null)}
          >
            <X className="w-6 h-6" />
          </button>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 bg-black/40 rounded-sm"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <img
            src={images[lightbox]}
            alt={`${operatorName} fleet ${lightbox + 1}`}
            className="max-h-[85vh] max-w-full object-contain rounded-sm"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 bg-black/40 rounded-sm"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-5 font-mono text-xs text-white/50">
            {lightbox + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}