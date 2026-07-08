"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

export function CountUp({
  value,
  decimals = 2,
}: {
  value: number;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(value.toFixed(decimals));
  const previous = useRef(value);

  useEffect(() => {
    const controls = animate(previous.current, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate(latest) {
        setDisplay(latest.toFixed(decimals));
      },
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, decimals]);

  return <span>{display}</span>;
}
