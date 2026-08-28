import { useCallback, useEffect, useRef, useState } from "react";
import SolarCanvas from "./components/SolarCanvas";
import InfoPanel from "./components/InfoPanel";
import CompareSection from "./components/CompareSection";
import { BODIES, type CelestialBody } from "./data/bodies";

const SPEEDS = [
  { v: 1, l: "1 сут/с" },
  { v: 10, l: "10 сут/с" },
  { v: 60, l: "60 сут/с" },
  { v: 365.25, l: "1 год/с" },
  { v: 1826, l: "5 лет/с" },
];

function SunMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 text-solar" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.4" fill="currentColor" stroke="none" />
      <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M18.7 5.3L17 7M7 17l-1.7 1.7" />
    </svg>
  );
}

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(60);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [clock, setClock] = useState(0);
  const [resetToken, setResetToken] = useState(0);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);

  const select = useCallback((id: string | null) => setSelectedId(id), []);
  const onClock = useCallback((d: number) => setClock(d), []);

  const idx = BODIES.findIndex((b) => b.id === selectedId);
  const selected: CelestialBody | null = idx >= 0 ? BODIES[idx] : null;
  const prev = idx >= 0 ? BODIES[(idx + BODIES.length - 1) % BODIES.length] : null;
  const next = idx >= 0 ? BODIES[(idx + 1) % BODIES.length] : null;

  const step = useCallback((dir: number) => {
    setSelectedId((cur) => {
      const i = BODIES.findIndex((b) => b.id === cur);
      const n = (i + dir + BODIES.length) % BODIES.length;
      return BODIES[n].id;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement | null;
      if (
        tgt &&
        (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.isContentEditable)
      )
        return;
      if (e.code === "Space") {
        if (tgt && tgt.tagName === "BUTTON") return;
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === "Escape") {
        setSelectedId(null);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "+" || e.key === "=") {
        setSpeed((s) => {
          const i = SPEEDS.findIndex((x) => x.v === s);
          return SPEEDS[Math.min(SPEEDS.length - 1, i + 1)].v;
        });
      } else if (e.key === "-" || e.key === "_") {
        setSpeed((s) => {
          const i = SPEEDS.findIndex((x) => x.v === s);
          return SPEEDS[Math.max(0, i - 1)].v;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const years = Math.floor(clock / 365.25);
  const days = Math.floor(clock - years * 365.25);

  const openFromTable = (id: string) => {
    select(id);
    canvasHostRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-abyss font-body text-ink">
      {/* ===== Сцена ===== */}
      <section
        ref={canvasHostRef}
        className="relative h-[100svh] min-h-[620px] overflow-hidden"
      >
        <SolarCanvas
          playing={playing}
          speed={speed}
          showOrbits={showOrbits}
          showLabels={showLabels}
          selectedId={selectedId}
          panelOpen={!!selectedId}
          resetToken={resetToken}
          onSelect={select}
          onClock={onClock}
        />

        {/* Шапка */}
        <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 px-4 py-4 md:px-6">
          <div className="pointer-events-auto flex items-center gap-3">
            <SunMark />
            <div>
              <h1 className="font-display text-[13px] uppercase tracking-[0.2em] text-ink md:text-[15px]">
                Солнечная система
              </h1>
              <p className="mt-0.5 text-[11px] text-dim">
                Интерактивная модель · 8 планет · реальные периоды обращения
              </p>
            </div>
          </div>
          <div className="pointer-events-auto rounded-lg border border-hairline bg-panel/85 px-3.5 py-2 text-right backdrop-blur-sm">
            <div className="flex items-center justify-end gap-1.5 text-[9.5px] uppercase tracking-[0.18em] text-dim">
              <span
                className={`relative inline-block h-1.5 w-1.5 rounded-full ${
                  playing ? "ping-dot bg-solar text-solar" : "bg-dim/60"
                }`}
              />
              {playing ? "идёт время" : "пауза"}
            </div>
            <div className="num font-display text-lg leading-tight text-ink md:text-xl">
              {years.toLocaleString("ru-RU")}
              <span className="text-[13px] text-dim"> лет </span>
              {days}
              <span className="text-[13px] text-dim"> дн</span>
            </div>
          </div>
        </header>

        {/* Список объектов — десктоп */}
        <nav className="absolute left-5 top-1/2 z-30 hidden w-[188px] -translate-y-1/2 flex-col gap-[3px] lg:flex">
          <p className="mb-1.5 px-2.5 text-[10px] uppercase tracking-[0.22em] text-dim/70">
            Объекты
          </p>
          {BODIES.map((b) => {
            const sel = b.id === selectedId;
            return (
              <button
                key={b.id}
                onClick={() => select(b.id)}
                className={`group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-left transition-all duration-200 ${
                  sel
                    ? "bg-white/[0.07] text-ink"
                    : "text-dim hover:translate-x-[3px] hover:bg-white/[0.04] hover:text-ink"
                }`}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background: b.color,
                    boxShadow: sel ? `0 0 10px ${b.glow}` : "none",
                  }}
                />
                <span className="text-[13px] font-medium">{b.name}</span>
                <span className="num ml-auto text-[10.5px] text-dim/80">
                  {b.shortPeriod}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Список объектов — мобильные */}
        <nav className="scroll-thin absolute inset-x-0 top-[62px] z-30 flex gap-2 overflow-x-auto px-4 pb-2 md:top-[70px] lg:hidden">
          {BODIES.map((b) => {
            const sel = b.id === selectedId;
            return (
              <button
                key={b.id}
                onClick={() => select(b.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  sel
                    ? "border-solar/60 bg-solar/10 text-ink"
                    : "border-hairline bg-panel/70 text-dim backdrop-blur-sm"
                }`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: b.color }}
                />
                {b.name}
              </button>
            );
          })}
        </nav>

        {/* Подсказка, пока ничего не выбрано */}
        {!selected && (
          <div className="hint-pill pointer-events-none absolute bottom-[104px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-hairline bg-panel/85 px-4 py-2 backdrop-blur-sm">
            <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-solar text-solar ping-dot" />
            <span className="whitespace-nowrap text-[12px] text-ink/90">
              Нажмите на планету — покажу её характеристики
            </span>
          </div>
        )}

        {/* Док управления */}
        <div className="absolute bottom-4 left-1/2 z-30 w-max max-w-[94vw] -translate-x-1/2">
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-hairline bg-panel/90 px-3 py-2.5 shadow-[0_16px_50px_rgba(0,0,0,0.5)] backdrop-blur-md md:gap-3">
            <button
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Пауза" : "Воспроизвести"}
              title={playing ? "Пауза (Пробел)" : "Воспроизвести (Пробел)"}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-solar text-[#221200] shadow-[0_0_26px_rgba(255,180,84,0.35)] transition-transform hover:scale-105 active:scale-95"
            >
              {playing ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <rect x="6.5" y="5" width="3.6" height="14" rx="1" />
                  <rect x="13.9" y="5" width="3.6" height="14" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5 translate-x-[1px]" fill="currentColor">
                  <path d="M8 5.3v13.4c0 .8.9 1.3 1.6.9l10.4-6.7c.6-.4.6-1.4 0-1.8L9.6 4.4c-.7-.4-1.6.1-1.6.9z" />
                </svg>
              )}
            </button>

            <span className="hidden h-6 w-px bg-hairline sm:block" />

            <div className="flex items-center gap-1">
              <span className="mr-1 hidden text-[10px] uppercase tracking-[0.16em] text-dim/80 md:block">
                Скорость
              </span>
              {SPEEDS.map((s) => (
                <button
                  key={s.v}
                  onClick={() => setSpeed(s.v)}
                  className={`num rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors ${
                    speed === s.v
                      ? "bg-solar/15 text-solar"
                      : "text-dim hover:bg-white/5 hover:text-ink"
                  }`}
                >
                  {s.l}
                </button>
              ))}
            </div>

            <span className="hidden h-6 w-px bg-hairline sm:block" />

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowOrbits((v) => !v)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors ${
                  showOrbits
                    ? "text-lagoon"
                    : "text-dim hover:bg-white/5 hover:text-ink"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${showOrbits ? "bg-lagoon" : "bg-dim/50"}`}
                />
                Орбиты
              </button>
              <button
                onClick={() => setShowLabels((v) => !v)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors ${
                  showLabels
                    ? "text-lagoon"
                    : "text-dim hover:bg-white/5 hover:text-ink"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${showLabels ? "bg-lagoon" : "bg-dim/50"}`}
                />
                Подписи
              </button>
              <button
                onClick={() => {
                  setResetToken((t) => t + 1);
                  setClock(0);
                }}
                aria-label="Сбросить время"
                title="Сбросить время"
                className="grid h-8 w-8 place-items-center rounded-md text-dim transition-colors hover:bg-white/5 hover:text-ink"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-2.9-6.6" />
                  <path d="M21 3v5.5h-5.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <p className="pointer-events-none absolute bottom-5 right-5 z-20 hidden text-[11px] text-dim/80 xl:block">
          Пробел — пауза · ← → — планеты · + − — скорость · Esc — закрыть
        </p>

        {selected && prev && next && (
          <InfoPanel
            body={selected}
            simDays={clock}
            prev={prev}
            next={next}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
            onClose={() => select(null)}
          />
        )}
      </section>

      {/* ===== Сравнение ===== */}
      <CompareSection selectedId={selectedId} onSelect={openFromTable} />

      <footer className="border-t border-hairline px-4 py-8 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 text-[12px] text-dim md:flex-row md:items-center md:justify-between">
          <p>
            Орбиты круговые, расстояния и размеры показаны в сжатой степени —
            в реальном масштабе планеты были бы невидимыми точками.
          </p>
          <p className="font-display text-[10.5px] uppercase tracking-[0.2em] text-dim/80">
            Учебная демонстрация · данные: NASA
          </p>
        </div>
      </footer>
    </div>
  );
}
