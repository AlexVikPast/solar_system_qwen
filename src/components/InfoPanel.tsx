import type { CelestialBody } from "../data/bodies";
import { fmtDec, fmtInt } from "../lib/format";

const TAU = Math.PI * 2;

interface Props {
  body: CelestialBody;
  simDays: number;
  prev: CelestialBody;
  next: CelestialBody;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

function periodString(p: number): string {
  if (p < 1000) return `${fmtDec(p)} сут`;
  const years = (p / 365.25).toLocaleString("ru-RU", {
    maximumFractionDigits: 1,
  });
  return `${fmtInt(Math.round(p))} сут · ${years} лет`;
}

export default function InfoPanel({
  body,
  simDays,
  prev,
  next,
  onPrev,
  onNext,
  onClose,
}: Props) {
  const isPlanet = body.periodDays !== null;

  const stats: { k: string; v: string }[] = [
    { k: "Диаметр", v: `${fmtInt(body.diameterKm)} км` },
  ];
  if (body.distanceMkm !== null && body.distanceAU !== null) {
    stats.push({
      k: "Расстояние от Солнца",
      v: `${fmtDec(body.distanceMkm)} млн км · ${fmtDec(body.distanceAU)} а.е.`,
    });
  } else {
    stats.push({ k: "Возраст", v: "≈ 4,6 млрд лет" });
  }
  if (body.periodDays !== null) {
    stats.push({ k: "Орбитальный период", v: periodString(body.periodDays) });
  }
  stats.push({ k: "Сутки (вращение)", v: body.rotationLabel });
  stats.push({ k: "Спутники", v: body.moons === null ? "8 планет" : fmtInt(body.moons) });
  stats.push({ k: "Температура", v: body.tempLabel });

  let px = 100;
  let py = 24;
  let prog = 0;
  if (isPlanet) {
    const period = body.periodDays as number;
    const ang = body.phase0 + (TAU * simDays) / period;
    px = 100 + Math.cos(ang) * 76;
    py = 100 + Math.sin(ang) * 76;
    prog = (((simDays % period) + period) % period) / period * 100;
  }

  return (
    <aside
      key={body.id}
      className="info-panel fixed inset-x-3 bottom-[96px] z-50 max-h-[48vh] overflow-hidden rounded-xl border border-hairline bg-panel/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-md lg:inset-x-auto lg:bottom-[104px] lg:right-5 lg:top-[88px] lg:w-[376px] lg:max-h-none"
      role="dialog"
      aria-label={`Сведения: ${body.name}`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start gap-3 border-b border-hairline px-5 py-4">
          <span
            className="mt-0.5 h-11 w-11 shrink-0 rounded-full"
            style={{
              background: `radial-gradient(circle at 32% 30%, ${body.hi}, ${body.color} 55%, ${body.shade})`,
              boxShadow: `0 0 22px ${body.glow}`,
            }}
          />
          <div className="min-w-0">
            <h2 className="font-display text-[22px] leading-tight text-ink">
              {body.name}
            </h2>
            <span className="mt-1 inline-block rounded-full border border-hairline px-2.5 py-[3px] text-[10.5px] uppercase tracking-[0.14em] text-dim">
              {body.group}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть панель"
            className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-md text-dim transition-colors hover:bg-white/5 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {isPlanet ? (
            <div className="mb-4 rounded-lg border border-hairline bg-abyss/60 p-3">
              <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-dim">
                <span>Позиция на орбите</span>
                <span className="num text-lagoon">{prog.toFixed(0)} %</span>
              </div>
              <svg viewBox="0 0 200 200" className="mx-auto block w-[164px]">
                <circle
                  cx="100"
                  cy="100"
                  r="76"
                  fill="none"
                  stroke="rgba(148,166,205,0.28)"
                  strokeDasharray="2 5"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="76"
                  fill="none"
                  stroke="#5fd4c4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={`${Math.max(prog, 0.5)} ${100 - Math.max(prog, 0.5)}`}
                  transform="rotate(-90 100 100)"
                  opacity="0.85"
                />
                <circle cx="100" cy="100" r="17" fill="rgba(255,180,84,0.14)" />
                <circle cx="100" cy="100" r="10.5" fill="#ffcf6b" />
                <circle
                  cx={px}
                  cy={py}
                  r="7"
                  fill={body.color}
                  stroke="#0a101f"
                  strokeWidth="2"
                />
              </svg>
            </div>
          ) : (
            <div className="mb-4 rounded-lg border border-hairline bg-abyss/60 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-dim">
                Доля массы Солнечной системы
              </p>
              <div className="mt-2.5 flex h-3 overflow-hidden rounded-full bg-white/5">
                <div className="bg-solar" style={{ width: "99.86%" }} />
                <div className="bg-lagoon/80" style={{ width: "0.6%" }} />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px]">
                <span className="num text-solar">Солнце — 99,86 %</span>
                <span className="num text-dim">планеты — 0,14 %</span>
              </div>
            </div>
          )}

          <dl>
            {stats.map((s) => (
              <div
                key={s.k}
                className="flex items-baseline justify-between gap-4 border-b border-hairline/70 py-[9px] last:border-0"
              >
                <dt className="shrink-0 text-[12px] text-dim">{s.k}</dt>
                <dd className="num text-right text-[13px] font-semibold text-ink">
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 rounded-r-lg border-l-2 border-solar bg-solar/[0.06] py-3 pl-4 pr-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-solar">
              Знаете ли вы?
            </p>
            <p className="text-[13px] leading-relaxed text-ink/90">{body.fact}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-hairline px-4 py-3">
          <button
            onClick={onPrev}
            className="group flex items-center gap-2 rounded-lg border border-hairline px-3 py-2.5 text-left transition-colors hover:border-solar/50 hover:bg-white/[0.04]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-dim transition-colors group-hover:text-solar" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="min-w-0">
              <span className="block text-[9.5px] uppercase tracking-wider text-dim">
                назад
              </span>
              <span className="block truncate text-[12.5px] font-semibold text-ink">
                {prev.name}
              </span>
            </span>
          </button>
          <button
            onClick={onNext}
            className="group flex items-center justify-end gap-2 rounded-lg border border-hairline px-3 py-2.5 text-right transition-colors hover:border-solar/50 hover:bg-white/[0.04]"
          >
            <span className="min-w-0">
              <span className="block text-[9.5px] uppercase tracking-wider text-dim">
                дальше
              </span>
              <span className="block truncate text-[12.5px] font-semibold text-ink">
                {next.name}
              </span>
            </span>
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-dim transition-colors group-hover:text-solar" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
