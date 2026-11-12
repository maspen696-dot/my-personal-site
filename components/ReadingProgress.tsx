"use client";

import { useEffect, useRef } from "react";

// Hairline scroll-progress bar pinned to the top of a blog post — fills
// left-to-right (#007ACC) as you scroll through the article. Per-post: tracks
// how far you've scrolled the current page.
//
// It paints by writing `transform: scaleX()` straight to the bar's DOM node
// inside a requestAnimationFrame callback — not React state + `width`. Animating
// width forces layout every frame (janky, "snaps" at the end); scaleX is
// GPU-composited, so the bar tracks your scroll frame-by-frame and stays smooth.
export default function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;

    const paint = () => {
      raf = 0;
      const bar = barRef.current;
      if (!bar) return;
      const el = document.documentElement;
      const scrollable = el.scrollHeight - el.clientHeight;
      const ratio = scrollable > 0 ? el.scrollTop / scrollable : 0;
      bar.style.transform = `scaleX(${Math.min(Math.max(ratio, 0), 1)})`;
    };

    // Coalesce bursts of scroll events into one paint per frame.
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(paint);
    };

    paint(); // set the initial position
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="nj-progress" aria-hidden="true">
      <div ref={barRef} className="nj-progress-bar" />
    </div>
  );
}
