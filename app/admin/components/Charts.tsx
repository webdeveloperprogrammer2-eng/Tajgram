"use client";

// ============================================================
//  Grafikho - sabki shadcn/ui charts, vale bо SVG-i sof
//  (bе kitobkhona). Rangho az palitrai sayt (var(--...)).
// ============================================================
import { useId, useState } from "react";

const PINK = "var(--accentA)";
const PURPLE = "var(--accentB)";

// ------------------------------------------------------------
//  Grafiki MAYDON (Area) - afzoиши jamъbasta.
// ------------------------------------------------------------
export function AreaChart({
  data,
  height = 220,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const gid = useId();
  const [hover, setHover] = useState<number | null>(null);

  const W = 720;
  const H = height;
  const padX = 12;
  const padTop = 18;
  const padBottom = 28;

  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = data.length > 1 ? (W - padX * 2) / (data.length - 1) : 0;
  const x = (i: number) => padX + i * stepX;
  const y = (v: number) => padTop + (1 - v / max) * (H - padTop - padBottom);

  const pts = data.map((d, i) => [x(i), y(d.value)] as const);

  // Rohi hamvor (Catmull-Rom -> Bezier)
  const line = smoothPath(pts);
  const area =
    line +
    ` L ${x(data.length - 1)} ${H - padBottom} L ${x(0)} ${H - padBottom} Z`;

  const gridLines = 4;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      preserveAspectRatio="none"
      onMouseLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id={`${gid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PINK} stopOpacity="0.34" />
          <stop offset="55%" stopColor={PURPLE} stopOpacity="0.14" />
          <stop offset="100%" stopColor={PURPLE} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${gid}-line`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={PINK} />
          <stop offset="100%" stopColor={PURPLE} />
        </linearGradient>
      </defs>

      {/* Setka */}
      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const gy = padTop + (i / gridLines) * (H - padTop - padBottom);
        return (
          <line
            key={i}
            x1={padX}
            x2={W - padX}
            y1={gy}
            y2={gy}
            stroke="var(--line)"
            strokeWidth={1}
            strokeDasharray="3 5"
          />
        );
      })}

      <path d={area} fill={`url(#${gid}-fill)`} />
      <path
        d={line}
        fill="none"
        stroke={`url(#${gid}-line)`}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Nuqtaho + hover */}
      {pts.map(([px, py], i) => (
        <g key={i}>
          <rect
            x={px - stepX / 2}
            y={0}
            width={stepX || W}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
          {hover === i && (
            <>
              <line
                x1={px}
                x2={px}
                y1={padTop}
                y2={H - padBottom}
                stroke="var(--lineStrong)"
                strokeWidth={1}
              />
              <circle cx={px} cy={py} r={5} fill="var(--bg)" stroke={PINK} strokeWidth={2.5} />
              <g transform={`translate(${clamp(px, 40, W - 40)}, ${Math.max(py - 14, 14)})`}>
                <rect
                  x={-22}
                  y={-20}
                  width={44}
                  height={22}
                  rx={6}
                  fill="var(--invBg)"
                />
                <text
                  x={0}
                  y={-4}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={700}
                  fill="var(--invFg)"
                >
                  {data[i].value}
                </text>
              </g>
            </>
          )}
        </g>
      ))}

      {/* Podpisho po X (har duyum) */}
      {data.map((d, i) =>
        i % Math.ceil(data.length / 7) === 0 ? (
          <text
            key={i}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize={11}
            fill="var(--muted)"
          >
            {d.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

// ------------------------------------------------------------
//  Grafiki SUTUNI (Bar) - post va reel dar har ruz.
// ------------------------------------------------------------
export function BarGroups({
  data,
}: {
  data: { label: string; posts: number; reels: number }[];
}) {
  const gid = useId();
  const W = 720;
  const H = 220;
  const padX = 14;
  const padTop = 16;
  const padBottom = 28;

  const max = Math.max(1, ...data.flatMap((d) => [d.posts, d.reels]));
  const groupW = (W - padX * 2) / data.length;
  const barW = Math.min(13, groupW / 3);
  const y = (v: number) => padTop + (1 - v / max) * (H - padTop - padBottom);
  const base = H - padBottom;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      <defs>
        <linearGradient id={`${gid}-a`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PINK} />
          <stop offset="100%" stopColor={PINK} stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={`${gid}-b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PURPLE} />
          <stop offset="100%" stopColor={PURPLE} stopOpacity="0.55" />
        </linearGradient>
      </defs>

      <line x1={padX} x2={W - padX} y1={base} y2={base} stroke="var(--line)" />

      {data.map((d, i) => {
        const cx = padX + i * groupW + groupW / 2;
        return (
          <g key={i}>
            <rect
              x={cx - barW - 1}
              y={y(d.posts)}
              width={barW}
              height={Math.max(0, base - y(d.posts))}
              rx={3}
              fill={`url(#${gid}-a)`}
            />
            <rect
              x={cx + 1}
              y={y(d.reels)}
              width={barW}
              height={Math.max(0, base - y(d.reels))}
              rx={3}
              fill={`url(#${gid}-b)`}
            />
            {i % Math.ceil(data.length / 7) === 0 && (
              <text
                x={cx}
                y={H - 8}
                textAnchor="middle"
                fontSize={11}
                fill="var(--muted)"
              >
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ------------------------------------------------------------
//  Halqa (Donut) - taqsimi kontent.
// ------------------------------------------------------------
export function Donut({
  slices,
  size = 180,
}: {
  slices: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = Math.max(1, slices.reduce((s, x) => s + x.value, 0));
  const r = size / 2;
  const stroke = 26;
  const radius = r - stroke / 2 - 2;
  const circ = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <g transform={`rotate(-90 ${r} ${r})`}>
          <circle
            cx={r}
            cy={r}
            r={radius}
            fill="none"
            stroke="var(--line)"
            strokeWidth={stroke}
          />
          {slices.map((s, i) => {
            const frac = s.value / total;
            const len = frac * circ;
            const dash = `${len} ${circ - len}`;
            const el = (
              <circle
                key={i}
                cx={r}
                cy={r}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </g>
        <text
          x={r}
          y={r - 4}
          textAnchor="middle"
          fontSize={26}
          fontWeight={800}
          fill="var(--fg)"
        >
          {total}
        </text>
        <text x={r} y={r + 16} textAnchor="middle" fontSize={11} fill="var(--muted)">
          ҳамагӣ
        </text>
      </svg>

      <ul className="space-y-2">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 rounded-[4px]"
              style={{ background: s.color }}
            />
            <span className="text-[var(--fg)]">{s.label}</span>
            <span className="ml-auto font-semibold text-[var(--muted)]">
              {s.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ------------------------------------------------------------
//  Kumakho
// ------------------------------------------------------------
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function smoothPath(pts: readonly (readonly [number, number])[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0][0]} ${pts[0][1]}`;

  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];
    const t = 0.16;
    const c1x = p1[0] + (p2[0] - p0[0]) * t;
    const c1y = p1[1] + (p2[1] - p0[1]) * t;
    const c2x = p2[0] - (p3[0] - p1[0]) * t;
    const c2y = p2[1] - (p3[1] - p1[1]) * t;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}
