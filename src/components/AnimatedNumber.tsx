import React, { useEffect, useState, useRef } from 'react';
import { formatINR } from '../utils/currency';

interface AnimatedNumberProps {
  value: number | null | undefined;
  formatFn?: (val: number) => string;
  durationMs?: number;
  className?: string;
  fallback?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  formatFn = formatINR,
  durationMs = 280,
  className = '',
  fallback = '—',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(() => (typeof value === 'number' && !isNaN(value) ? value : 0));
  const prevValueRef = useRef<number>(displayValue);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === null || value === undefined || isNaN(value)) {
      return;
    }

    // Check if user prefers reduced motion
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || durationMs <= 0) {
      frameRef.current = requestAnimationFrame(() => {
        setDisplayValue(value);
        prevValueRef.current = value;
      });
      return () => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
      };
    }

    const startValue = prevValueRef.current;
    const endValue = value;
    if (startValue === endValue) return;

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, durationMs]);

  if (value === null || value === undefined) {
    return <span className={className}>{fallback}</span>;
  }

  return (
    <span className={`inline-block tabular-nums transition-colors duration-150 ${className}`}>
      {formatFn(Math.round(displayValue))}
    </span>
  );
};
