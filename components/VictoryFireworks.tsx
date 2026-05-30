"use client";

import { useEffect, useRef, useState } from "react";

type BurstPalette = "gold" | "blue" | "green";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  hue: number;
  sat: number;
  light: number;
  size: number;
}

const PALETTES: Record<
  BurstPalette,
  { hueMin: number; hueMax: number; sat: number; light: number }
> = {
  gold: { hueMin: 32, hueMax: 50, sat: 88, light: 54 },
  blue: { hueMin: 200, hueMax: 222, sat: 82, light: 50 },
  green: { hueMin: 120, hueMax: 142, sat: 78, light: 48 },
};

const BURST_SEQUENCE: { at: number; color: BurstPalette }[] = [
  { at: 0, color: "gold" },
  { at: 280, color: "blue" },
  { at: 560, color: "green" },
  { at: 900, color: "gold" },
  { at: 1200, color: "blue" },
  { at: 1500, color: "green" },
];

const DURATION_MS = 2600;

function burst(
  particles: Particle[],
  cx: number,
  cy: number,
  palette: BurstPalette
) {
  const { hueMin, hueMax, sat, light } = PALETTES[palette];
  const count = 56 + Math.floor(Math.random() * 20);

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 3.5 + Math.random() * 6;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.2,
      life: 0,
      maxLife: 38 + Math.random() * 22,
      hue: hueMin + Math.random() * (hueMax - hueMin),
      sat,
      light,
      size: 2.2 + Math.random() * 2.4,
    });
  }
}

export function VictoryFireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const particles: Particle[] = [];
    const fired = new Set<number>();
    const start = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const loop = (now: number) => {
      const elapsed = now - start;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      for (const { at, color } of BURST_SEQUENCE) {
        if (elapsed >= at && !fired.has(at)) {
          fired.add(at);
          burst(
            particles,
            w * (0.18 + Math.random() * 0.64),
            h * (0.12 + Math.random() * 0.38),
            color
          );
        }
      }

      ctx.clearRect(0, 0, w, h);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.vy += 0.11;
        p.vx *= 0.985;
        p.x += p.vx;
        p.y += p.vy;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        const t = p.life / p.maxLife;
        const alpha = (1 - t) * (1 - t);
        if (alpha < 0.04) {
          particles.splice(i, 1);
          continue;
        }

        const radius = Math.max(0.5, p.size * (1 - t * 0.55));
        const color = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${alpha * 0.72})`;

        ctx.save();
        ctx.shadowBlur = 6;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        const coreRadius = Math.max(0.25, radius * 0.4);
        ctx.shadowBlur = 0;
        ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${Math.min(72, p.light + 10)}%, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, coreRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (elapsed < DURATION_MS) {
        raf = requestAnimationFrame(loop);
      } else {
        setVisible(false);
      }
    };

    raf = requestAnimationFrame(loop);
    const hideTimer = window.setTimeout(() => setVisible(false), DURATION_MS + 80);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(hideTimer);
      window.removeEventListener("resize", resize);
    };
  }, []);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-40 w-full h-full"
      aria-hidden
    />
  );
}
