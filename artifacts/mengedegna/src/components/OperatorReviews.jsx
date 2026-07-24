import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Star, ShieldCheck, Armchair, Clock, MessageSquare, Send, Loader2, CheckCircle } from "lucide-react";

function StarPicker({ value, onChange, label }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground mb-1.5">{label}</div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                n <= (hovered || value) ? "text-primary fill-primary" : "text-border"
              }`}
            />
          </button>
        ))}
        {value > 0 && <span className="font-mono text-xs text-muted-foreground ml-1 self-center">{value}/5</span>}
      </div>
    </div>
  );
}

function ReviewCard({ review }) {
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  };

  return (
    <div className="bg-card border border-border rounded-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold font-mono text-xs">
              {(review.passenger_name || "A")[0].toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-sm">{review.passenger_name || "Anonymous"}</div>
              {review.route && <div className="text-[10px] text-muted-foreground font-mono">{review.route}</div>}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map((n) => (
              <Star key={n} className={`w-3.5 h-3.5 ${n <= review.overall_rating ? "text-primary fill-primary" : "text-border"}`} />
            ))}
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">{timeAgo(review.created_date)}</div>
        </div>
      </div>

      {/* Sub-ratings */}
      <div className="flex flex-wrap gap-3 mb-3">
        <SubRating icon={<ShieldCheck className="w-3 h-3" />} label="Safety" value={review.safety_rating} />
        <SubRating icon={<Armchair className="w-3 h-3" />} label="Comfort" value={review.comfort_rating} />
        <SubRating icon={<Clock className="w-3 h-3" />} label="Punctuality" value={review.punctuality_rating} />
      </div>

      {review.comment && (
        <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-3">
          "{review.comment}"
        </p>
      )}

      {review.verified && (
        <div className="flex items-center gap-1 mt-3 text-[10px] text-accent font-mono">
          <CheckCircle className="w-3 h-3" /> VERIFIED TRAVELLER
        </div>
      )}
    </div>
  );
}

function SubRating({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-secondary/60 px-2 py-1 rounded-sm">
      <span className="text-primary">{icon}</span>
      {label}: <span className="text-foreground font-bold ml-0.5">{value}/5</span>
    </div>
  );
}

export default function OperatorReviews({ operatorSlug, operatorName, currentUser }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [overall, setOverall] = useState(0);
  const [safety, setSafety] = useState(0);
  const [comfort, setComfort] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState(currentUser?.full_name || "");

  useEffect(() => {
    base44.entities.OperatorReview.filter({ operator_slug: operatorSlug }, "-created_date", 50)
      .then(setReviews)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [operatorSlug]);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.overall_rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (overall === 0 || safety === 0 || !comment.trim()) return;
    setSubmitting(true);
    const review = await base44.entities.OperatorReview.create({
      operator_slug: operatorSlug,
      operator_name: operatorName,
      passenger_name: name.trim() || "Anonymous",
      overall_rating: overall,
      safety_rating: safety,
      comfort_rating: comfort || undefined,
      punctuality_rating: punctuality || undefined,
      comment: comment.trim(),
      verified: true,
    });
    setReviews((prev) => [review, ...prev]);
    setSubmitted(true);
    setShowForm(false);
    setSubmitting(false);
    setOverall(0); setSafety(0); setComfort(0); setPunctuality(0); setComment(""); 
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Traveller Reviews</h2>
          {avgRating && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((n) => (
                  <Star key={n} className={`w-4 h-4 ${n <= Math.round(avgRating) ? "text-primary fill-primary" : "text-border"}`} />
                ))}
              </div>
              <span className="font-mono font-bold text-primary">{avgRating}</span>
              <span className="text-xs text-muted-foreground">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
            </div>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 text-sm font-semibold bg-primary text-primary-foreground px-5 py-2.5 rounded-sm hover:brightness-110 transition-all"
          >
            <MessageSquare className="w-4 h-4" /> Write a Review
          </button>
        )}
      </div>

      {/* Success banner */}
      {submitted && (
        <div className="mb-6 flex items-center gap-3 border border-accent/50 bg-accent/10 rounded-sm px-5 py-4">
          <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
          <p className="text-sm">Thank you! Your review has been published.</p>
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-primary/30 rounded-sm p-6 mb-8 space-y-5">
          <div className="font-mono text-[10px] tracking-[0.25em] text-primary mb-1">SHARE YOUR EXPERIENCE</div>

          <div>
            <label className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground block mb-1.5">YOUR NAME</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name or nickname"
              className="w-full bg-transparent border-b border-border py-2 focus:border-primary focus:outline-none text-sm"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <StarPicker value={overall} onChange={setOverall} label="OVERALL RATING *" />
            <StarPicker value={safety} onChange={setSafety} label="SAFETY RATING *" />
            <StarPicker value={comfort} onChange={setComfort} label="COMFORT" />
            <StarPicker value={punctuality} onChange={setPunctuality} label="PUNCTUALITY" />
          </div>

          <div>
            <label className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground block mb-1.5">YOUR COMMENT *</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe your travel experience — safety, comfort, driver conduct, cleanliness..."
              rows={4}
              className="w-full bg-transparent border border-border rounded-sm px-4 py-3 text-sm focus:border-primary focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={overall === 0 || safety === 0 || !comment.trim() || submitting}
              className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-sm hover:brightness-110 transition-all disabled:opacity-40"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Review
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-muted-foreground hover:text-foreground px-4">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-sm">
          <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground text-sm">No reviews yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
        </div>
      )}
    </div>
  );
}