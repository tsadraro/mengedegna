import { useEffect, useRef } from "react";

/**
 * Returns a ref to attach to any element.
 * When the element enters the viewport it gets the `revealed` class,
 * which triggers the entrance animation defined in index.css.
 *
 * @param {number} threshold - 0–1, how much of the element must be visible (default 0.15)
 * @param {number} delay     - extra CSS delay in ms added inline (default 0)
 */
export function useReveal(threshold = 0.15, delay = 0) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (delay) el.style.animationDelay = `${delay}ms`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, delay]);

  return ref;
}