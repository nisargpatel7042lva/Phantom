"use client";

import { useCallback, useRef, type MouseEvent } from "react";

// Cursor-tracking spotlight for .phantom-card surfaces — sets CSS custom
// properties the ".spotlight" class (globals.css) reads to position a
// radial glow. Hover-only, so it degrades to nothing on touch devices.
export function useSpotlight<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  const onMouseMove = useCallback((event: MouseEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  }, []);

  return { ref, onMouseMove };
}
