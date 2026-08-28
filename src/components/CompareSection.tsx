import { useMemo } from "react";
import { PLANETS } from "../data/bodies";
import { fmtDec, fmtInt } from "../lib/format";
import { useReveal } from "../hooks/useReveal";

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function logScale(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.log(max / min);
  return (v: number) => 6 + 94 * (Math.log(v / min) / span);
}

export default function CompareSection({ selectedId, onSelect }: Props) {
  const head = useReveal<HTMLDivElement>();
  const rows = useReveal<HTMLDivElement>();
  const note = useReveal<HTMLParagraphElement>();

  const wDiam = useMemo(() => logScale(PLANETS.map((p) => p.diameterKm)), []);
  const wDist = useMemo(
    () => logScale(PLANETS.map((p) => p.distanceMkm as number)),
    []
  );
  const wPer = useMemo(
    () => logScale(PLANETS.map((p) => p.periodDays as number)),
    []
  );

  return (
    <section className="relative border-t border-hairline px-4 py-16 md:px-10 md:py-20 lg:px-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, rgba(255,180,84,0.06), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <div
          ref={head.ref}
          className={`reveal mb-10 max-w-2xl ${head.inView ? "is-in" : ""}`}
        >
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-solar">
            Сравнительная таблица
          </p>
          <h2 className="font-display text-[26px] leading-tight text-ink md:text-4xl">
            Масштабы системы
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-dim">
            Три ключевые величины каждой планеты на одной линейке. Кликните по
            строке, чтобы открыть планету в модели наверху.
          </p>
        </div>

        <div ref={rows.ref} className={`reveal ${rows.inView ? "is-in" : ""}`}>
          <div className="hidden grid-cols-[170px_1fr_1fr_1fr] gap-x-5 pb-2 text-[10.5px] uppercase tracking-[0.16em] text-dim/80 sm:grid">
            <span>Планета</span>
            <span>Диаметр</span>
            <span>Расстояние от Солнца</span>
            <span>Орбитальный период</span>
          </div>
          <div>
            {PLANETS.map((p, i) => {
              const sel = selectedId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  style={{ transitionDelay: rows.inView ? `${i * 55}ms` : "0ms" }}
                  className={`group relative grid w-full grid-cols-1 items-center gap-x-5 gap-y-2 border-t border-hairline/70 py-3 pr-8 text-left transition-colors sm:grid-cols-[170px_1fr_1fr_1fr] ${
                    sel ? "bg-white/[0.05]" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        background: p.color,
                        boxShadow: sel ? `0 0 10px ${p.glow}` : "none",
                      }}
                    />
                    <span
                      className={`text-[13.5px] font-semibold ${sel ? "text-solar" : "text-ink"}`}
                    >
                      {p.name}
                    </span>
                  </span>

                  <span className="block">
                    <span className="block h-[10px] rounded-[3px] bg-white/[0.05]">
                      <span
                        className="block h-full rounded-[3px] transition-[width] duration-700 ease-out"
                        style={{
                          width: rows.inView ? `${wDiam(p.diameterKm)}%` : "0%",
                          background: `linear-gradient(90deg, ${p.color}, ${p.color}55)`,
                          transitionDelay: `${i * 55}ms`,
                        }}
                      />
                    </span>
                    <span className="num mt-1 block text-[11px] text-dim">
                      {fmtInt(p.diameterKm)} км
                    </span>
                  </span>

                  <span className="hidden sm:block">
                    <span className="block h-[10px] rounded-[3px] bg-white/[0.05]">
                      <span
                        className="block h-full rounded-[3px] transition-[width] duration-700 ease-out"
                        style={{
                          width: rows.inView
                            ? `${wDist(p.distanceMkm as number)}%`
                            : "0%",
                          background: `linear-gradient(90deg, ${p.color}, ${p.color}55)`,
                          transitionDelay: `${i * 55 + 80}ms`,
                        }}
                      />
                    </span>
                    <span className="num mt-1 block text-[11px] text-dim">
                      {fmtDec(p.distanceMkm as number)} млн км ·{" "}
                      {fmtDec(p.distanceAU as number)} а.е.
                    </span>
                  </span>

                  <span className="hidden sm:block">
                    <span className="block h-[10px] rounded-[3px] bg-white/[0.05]">
                      <span
                        className="block h-full rounded-[3px] transition-[width] duration-700 ease-out"
                        style={{
                          width: rows.inView
                            ? `${wPer(p.periodDays as number)}%`
                            : "0%",
                          background: `linear-gradient(90deg, ${p.color}, ${p.color}55)`,
                          transitionDelay: `${i * 55 + 160}ms`,
                        }}
                      />
                    </span>
                    <span className="num mt-1 block text-[11px] text-dim">
                      {p.periodDays! < 1000
                        ? `${fmtDec(p.periodDays as number)} сут`
                        : `${(p.periodDays as number / 365.25).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} лет`}
                    </span>
                  </span>

                  <svg
                    viewBox="0 0 24 24"
                    className="absolute right-2 h-4 w-4 -translate-x-1 text-dim opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>

        <p
          ref={note.ref}
          className={`reveal mt-6 text-[12px] leading-relaxed text-dim/80 ${note.inView ? "is-in" : ""}`}
        >
          * Шкала логарифмическая: в линейном масштабе Нептун оказался бы в 78
          раз дальше Меркурия, а Юпитер — в 29 раз шире, и сравнение потеряло бы
          наглядность.
        </p>
      </div>
    </section>
  );
}
