import { useEffect, useRef } from "react";
import { PLANETS, SUN, type CelestialBody } from "../data/bodies";
import { fmtDec } from "../lib/format";

const TAU = Math.PI * 2;

export interface SolarCanvasProps {
  playing: boolean;
  speed: number;
  showOrbits: boolean;
  showLabels: boolean;
  selectedId: string | null;
  panelOpen: boolean;
  resetToken: number;
  onSelect: (id: string | null) => void;
  onClock: (days: number) => void;
}

interface BodyPoint {
  id: string;
  x: number;
  y: number;
  r: number;
  body: CelestialBody;
  isSun: boolean;
}

interface Star {
  x: number;
  y: number;
  r: number;
  a: number;
  tw: number;
  ph: number;
}

interface Rock {
  a0: number;
  rf: number;
  p: number;
  s: number;
  al: number;
}

const planetR = (km: number) =>
  Math.max(3.4, Math.min(17, 3.9 * Math.pow(km / 4879, 0.36)));

function nebula(
  b: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string
) {
  const g = b.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  b.fillStyle = g;
  b.fillRect(x - r, y - r, r * 2, r * 2);
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string
) {
  ctx.font = "600 11px 'Golos Text', sans-serif";
  const w = ctx.measureText(text).width + 18;
  const h = 22;
  const px = x - w / 2;
  const py = y - h / 2;
  roundRectPath(ctx, px, py, w, h, 6);
  ctx.fillStyle = "rgba(6,10,22,0.88)";
  ctx.fill();
  ctx.strokeStyle = "rgba(148,166,205,0.28)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + 0.5);
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  name: string,
  strong: boolean
) {
  ctx.font = `${strong ? 700 : 500} 11px 'Golos Text', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(2,4,10,0.95)";
  ctx.shadowBlur = 5;
  ctx.fillStyle = strong ? "#ffd9a0" : "rgba(213,225,248,0.72)";
  ctx.fillText(name, x, y);
  ctx.shadowBlur = 0;
}

function drawSelRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  t: number
) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,180,84,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r + 13, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,180,84,0.95)";
  ctx.lineWidth = 1.4;
  ctx.setLineDash([3, 7]);
  ctx.lineDashOffset = -(t * 0.02) % 10;
  ctx.beginPath();
  ctx.arc(x, y, r + 7, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function drawRings(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pr: number,
  body: CelestialBody,
  front: boolean
) {
  if (!body.ring) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(body.ring.tilt);
  const start = front ? 0 : Math.PI;
  const end = front ? Math.PI : TAU;
  ctx.strokeStyle = body.ring.color;
  if (body.id === "uranus") {
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, pr * 1.75, pr * 1.75 * 0.2, 0, start, end);
    ctx.stroke();
  } else {
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = pr * 0.42;
    ctx.beginPath();
    ctx.ellipse(0, 0, pr * 1.78, pr * 1.78 * 0.34, 0, start, end);
    ctx.stroke();
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = pr * 0.15;
    ctx.beginPath();
    ctx.ellipse(0, 0, pr * 2.18, pr * 2.18 * 0.34, 0, start, end);
    ctx.stroke();
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = pr * 0.09;
    ctx.beginPath();
    ctx.ellipse(0, 0, pr * 1.42, pr * 1.42 * 0.34, 0, start, end);
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawDistance(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number,
  label: string
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L;
  const uy = dy / L;
  const sx = x1 + ux * (r1 + 6);
  const sy = y1 + uy * (r1 + 6);
  const ex = x2 - ux * (r2 + 12);
  const ey = y2 - uy * (r2 + 12);
  ctx.save();
  ctx.strokeStyle = "rgba(95,212,196,0.55)";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.setLineDash([]);
  const px = -uy;
  const py = ux;
  ctx.beginPath();
  ctx.moveTo(sx + px * 4, sy + py * 4);
  ctx.lineTo(sx - px * 4, sy - py * 4);
  ctx.moveTo(ex + px * 4, ey + py * 4);
  ctx.lineTo(ex - px * 4, ey - py * 4);
  ctx.stroke();
  drawPill(ctx, (sx + ex) / 2, (sy + ey) / 2 - 16, label, "#8fe3d6");
  ctx.restore();
}

export default function SolarCanvas({
  playing,
  speed,
  showOrbits,
  showLabels,
  selectedId,
  panelOpen,
  resetToken,
  onSelect,
  onClock,
}: SolarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef(0);
  const propsRef = useRef({
    playing,
    speed,
    showOrbits,
    showLabels,
    selectedId,
    panelOpen,
  });
  propsRef.current = {
    playing,
    speed,
    showOrbits,
    showLabels,
    selectedId,
    panelOpen,
  };
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onClockRef = useRef(onClock);
  onClockRef.current = onClock;

  useEffect(() => {
    simRef.current = 0;
  }, [resetToken]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let bg: HTMLCanvasElement | null = null;
    const stars: Star[] = [];
    const rocks: Rock[] = [];
    const mouse = { x: -1e4, y: -1e4 };
    let hoverId: string | null = null;
    let cx = 0;
    let cy = 0;
    let maxR = 100;
    let inited = false;
    let last = performance.now();
    let clockAcc = 0;
    let raf = 0;

    for (let i = 0; i < 260; i++) {
      rocks.push({
        a0: Math.random() * TAU,
        rf: Math.random(),
        p: 1500 + Math.random() * 1400,
        s: 0.7 + Math.random() * 1.1,
        al: 0.18 + Math.random() * 0.34,
      });
    }

    const makeStars = () => {
      stars.length = 0;
      const n = Math.min(420, Math.round((W * H) / 3600));
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() < 0.85 ? 0.4 + Math.random() * 0.8 : 1.1 + Math.random() * 1.1,
          a: 0.25 + Math.random() * 0.6,
          tw: 0.5 + Math.random() * 2.2,
          ph: Math.random() * TAU,
        });
      }
    };

    const paintBackground = () => {
      bg = document.createElement("canvas");
      bg.width = Math.max(1, Math.round(W * dpr));
      bg.height = Math.max(1, Math.round(H * dpr));
      const b = bg.getContext("2d");
      if (!b) return;
      b.scale(dpr, dpr);
      const g = b.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#070b1a");
      g.addColorStop(0.5, "#040711");
      g.addColorStop(1, "#050914");
      b.fillStyle = g;
      b.fillRect(0, 0, W, H);
      const M = Math.max(W, H);
      b.save();
      b.translate(W * 0.5, H * 0.42);
      b.rotate(-0.5);
      b.scale(1, 0.32);
      nebula(b, 0, 0, M * 0.7, "rgba(96,128,190,0.10)");
      b.restore();
      nebula(b, W * 0.86, H * 0.14, M * 0.42, "rgba(47,88,118,0.15)");
      nebula(b, W * 0.08, H * 0.88, M * 0.4, "rgba(32,78,82,0.13)");
      nebula(b, W * 0.5, H * 0.5, M * 0.3, "rgba(255,166,84,0.045)");
      const tints = ["#cfe0ff", "#cfe0ff", "#ffd9a0", "#a8c8ff"];
      for (let i = 0; i < 150; i++) {
        b.globalAlpha = 0.1 + Math.random() * 0.25;
        b.fillStyle = tints[i % tints.length];
        const s = Math.random() < 0.9 ? 1 : 1.6;
        b.fillRect(Math.random() * W, Math.random() * H, s, s);
      }
      b.globalAlpha = 1;
      const v = b.createRadialGradient(
        W / 2,
        H / 2,
        Math.min(W, H) * 0.35,
        W / 2,
        H / 2,
        M * 0.75
      );
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(1, "rgba(2,4,10,0.55)");
      b.fillStyle = v;
      b.fillRect(0, 0, W, H);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeStars();
      paintBackground();
      if (!inited) {
        cx = W / 2;
        cy = H / 2;
        maxR = Math.max(80, Math.min(W / 2, H / 2) - 26);
        inited = true;
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const auToR = (au: number, sunR: number, mr: number) =>
      sunR + 12 + (mr - sunR - 12) * Math.pow(au / 30.05, 0.42);

    const draw = (t: number) => {
      const p = propsRef.current;
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      if (p.playing) simRef.current += dt * p.speed;
      clockAcc += dt;
      if (clockAcc > 0.15) {
        clockAcc = 0;
        onClockRef.current(simRef.current);
      }
      const simDays = simRef.current;

      const panelW = p.panelOpen && W >= 1024 ? 396 : 0;
      const tCx = (W - panelW) / 2;
      const tCy = H / 2;
      const tMaxR = Math.max(80, Math.min((W - panelW) / 2, H / 2) - 26);
      const f = 1 - Math.exp(-dt * 5);
      cx += (tCx - cx) * f;
      cy += (tCy - cy) * f;
      maxR += (tMaxR - maxR) * f;
      const sunR = Math.max(15, Math.min(26, Math.min(W, H) * 0.042));
      const scale = Math.max(0.75, Math.min(1.15, Math.min(W, H) / 820));

      ctx.clearRect(0, 0, W, H);
      if (bg) ctx.drawImage(bg, 0, 0, W, H);

      for (const s of stars) {
        const a = s.a * (0.55 + 0.45 * Math.sin(t * 0.001 * s.tw + s.ph));
        ctx.globalAlpha = a;
        ctx.fillStyle = "#cfe0ff";
        ctx.fillRect(s.x, s.y, s.r, s.r);
      }
      ctx.globalAlpha = 1;

      // геометрия тел на этот кадр
      const points: BodyPoint[] = [
        { id: "sun", x: cx, y: cy, r: sunR, body: SUN, isSun: true },
      ];
      for (const pl of PLANETS) {
        const r = auToR(pl.distanceAU as number, sunR, maxR);
        const ang = pl.phase0 + (TAU * simDays) / (pl.periodDays as number);
        points.push({
          id: pl.id,
          x: cx + Math.cos(ang) * r,
          y: cy + Math.sin(ang) * r,
          r: planetR(pl.diameterKm) * scale,
          body: pl,
          isSun: false,
        });
      }
      hoverId = null;
      let best = 1e9;
      for (const pt of points) {
        const d = Math.hypot(mouse.x - pt.x, mouse.y - pt.y);
        const hit = Math.max(pt.r + 7, 12);
        if (d < hit && d < best) {
          best = d;
          hoverId = pt.id;
        }
      }
      canvas.style.cursor = hoverId ? "pointer" : "default";

      // орбиты
      for (const pl of PLANETS) {
        const sel = p.selectedId === pl.id;
        if (!p.showOrbits && !sel) continue;
        const r = auToR(pl.distanceAU as number, sunR, maxR);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TAU);
        if (sel) {
          ctx.strokeStyle = "rgba(255,180,84,0.55)";
          ctx.lineWidth = 1.4;
        } else {
          ctx.strokeStyle = "rgba(148,166,205,0.17)";
          ctx.lineWidth = 1;
        }
        ctx.stroke();
        if (sel) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, TAU);
          ctx.strokeStyle = "rgba(255,180,84,0.12)";
          ctx.lineWidth = 4;
          ctx.stroke();
        }
      }

      // пояс астероидов
      const rIn = auToR(2.1, sunR, maxR);
      const rOut = auToR(3.4, sunR, maxR);
      ctx.fillStyle = "#a8b2c8";
      for (const rk of rocks) {
        const ang = rk.a0 + (TAU * simDays) / rk.p;
        const rr = rIn + (rOut - rIn) * rk.rf;
        ctx.globalAlpha = rk.al;
        ctx.fillRect(
          cx + Math.cos(ang) * rr,
          cy + Math.sin(ang) * rr,
          rk.s,
          rk.s
        );
      }
      ctx.globalAlpha = 1;

      // Солнце
      const pulse = 1 + 0.035 * Math.sin(t * 0.0016);
      const glowR = sunR * 5.2 * pulse;
      const gg = ctx.createRadialGradient(cx, cy, sunR * 0.4, cx, cy, glowR);
      gg.addColorStop(0, "rgba(255,176,84,0.32)");
      gg.addColorStop(0.35, "rgba(255,150,60,0.11)");
      gg.addColorStop(1, "rgba(255,140,50,0)");
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, TAU);
      ctx.fill();
      const sg = ctx.createRadialGradient(
        cx - sunR * 0.3,
        cy - sunR * 0.3,
        sunR * 0.1,
        cx,
        cy,
        sunR
      );
      sg.addColorStop(0, "#fff6dd");
      sg.addColorStop(0.55, "#ffd47e");
      sg.addColorStop(1, "#ff9a3d");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(cx, cy, sunR, 0, TAU);
      ctx.fill();

      // планеты
      for (const pt of points) {
        if (pt.isSun) continue;
        const pl = pt.body;
        const { x, y } = pt;
        const pr = pt.r;
        const sel = p.selectedId === pl.id;
        const hov = hoverId === pl.id;

        if (pl.ring) drawRings(ctx, x, y, pr, pl, false);

        const lx = cx - x;
        const ly = cy - y;
        const L = Math.hypot(lx, ly) || 1;
        const gx = x + (lx / L) * pr * 0.45;
        const gy = y + (ly / L) * pr * 0.45;
        const g = ctx.createRadialGradient(gx, gy, pr * 0.12, x, y, pr * 1.05);
        g.addColorStop(0, pl.hi);
        g.addColorStop(0.55, pl.color);
        g.addColorStop(1, pl.shade);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, pr, 0, TAU);
        ctx.fill();

        if (pl.id === "earth") {
          const ma = 1 + (TAU * simDays) / 27.3;
          ctx.fillStyle = "#c9cdd8";
          ctx.beginPath();
          ctx.arc(
            x + Math.cos(ma) * (pr + 5 * scale),
            y + Math.sin(ma) * (pr + 5 * scale),
            Math.max(1.1, 1.4 * scale),
            0,
            TAU
          );
          ctx.fill();
        }

        if (pl.ring) drawRings(ctx, x, y, pr, pl, true);

        if (hov && !sel) {
          ctx.strokeStyle = pl.glow.replace(/[\d.]+\)$/, "0.85)");
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(x, y, pr + 4.5, 0, TAU);
          ctx.stroke();
        }
        if (sel) {
          drawSelRing(ctx, x, y, pr + (pl.ring ? pr * 1.2 : 0), t);
          drawDistance(
            ctx,
            cx,
            cy,
            sunR,
            x,
            y,
            pr,
            `${fmtDec(pl.distanceMkm as number)} млн км · ${fmtDec(pl.distanceAU as number)} а.е.`
          );
        }
        if (p.showLabels || sel || hov) {
          const off = pr + (pl.ring ? pr * 1.25 : 0) + 12;
          drawLabel(ctx, x, y - off, pl.name, sel);
        }
      }

      if (p.selectedId === "sun") drawSelRing(ctx, cx, cy, sunR + 4, t);

      // подсказка у курсора
      if (hoverId && hoverId !== p.selectedId) {
        const pt = points.find((q) => q.id === hoverId);
        if (pt) {
          drawPill(
            ctx,
            pt.x,
            pt.y - pt.r - (pt.body.ring ? pt.r * 1.4 : 0) - 20,
            pt.body.name,
            pt.isSun ? "#ffcf6b" : pt.body.hi
          );
        }
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -1e4;
      mouse.y = -1e4;
    };
    const onClick = () => {
      if (hoverId) onSelectRef.current(hoverId);
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Анимированная карта Солнечной системы"
      className="absolute inset-0 h-full w-full"
    />
  );
}
