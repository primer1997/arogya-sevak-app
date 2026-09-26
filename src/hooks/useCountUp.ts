import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from its previous value to `target` with ease-out cubic.
 * Starts from 0 on first mount so stat cards count up when a tab opens.
 * Respects prefers-reduced-motion (jumps straight to target).
 */
export function useCountUp(target: number, duration = 750): number {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const from = fromRef.current;
    fromRef.current = target;

    if (reduceMotion || from === target) {
      setValue(target);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
