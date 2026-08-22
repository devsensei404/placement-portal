// TrendChart.jsx — Task 1 deliverable (will be inlined into AdminAnalytics.jsx)
//
// Generalizes AdminDashboard.jsx's MiniBarChart into a single hand-rolled
// SVG renderer parameterized by `type`, per the task's "one component,
// not three" instruction. No charting library introduced — matches the
// existing project convention.
//
// Colors: AdminDashboard.css has no existing per-category color map
// (only functional ad-stat-amber/ad-stat-red for alert states), so
// TREND_COLORS is a new small palette, kept in the same black/white
// minimalist spirit. Tasks 3/4/6 should reuse this rather than picking
// ad-hoc colors.

import { useRef, useState, useEffect } from "react";

// ── New color-per-category convention (none existed to reuse) ──
export const TREND_COLORS = [
  "#111111", // ink (primary series / first category)
  "#6b7280", // slate gray
  "#2563eb", // blue accent
  "#d97706", // amber (matches ad-stat-amber)
  "#dc2626", // red (matches ad-stat-red)
  "#059669", // green accent
];

function colorFor(entry, i) {
  return entry.color || TREND_COLORS[i % TREND_COLORS.length];
}

function isAllZero(series) {
  if (!series || series.length === 0) return true;
  return series.every((s) =>
    s.type === "pie"
      ? (s.value || 0) === 0
      : !s.points || s.points.every((p) => p.count === 0)
  );
}

// ── Legend ──
function Legend({ items }) {
  return (
    <div className="trendchart-legend">
      {items.map((item, i) => (
        <span key={item.key || i} className="trendchart-legend-item">
          <span
            className="trendchart-legend-dot"
            style={{ background: colorFor(item, i) }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

// ── Line / Area renderer (shared path logic; area just adds a fill) ──
//
// Marker distortion fix: the SVG uses viewBox="0 0 100 40" with
// preserveAspectRatio="none" so it stretches non-uniformly to fill
// whatever width the container actually renders at (often much wider
// than 100:40, e.g. a 700x140 card). A <circle> has one radius, so that
// stretch turns every point marker into an ellipse ("egg" shape) — more
// exaggerated the wider the chart is relative to its height.
//
// Fix: measure the SVG's actual rendered pixel width via ResizeObserver,
// then draw markers as <ellipse> with rx/ry chosen so that, after the
// same non-uniform stretch is applied, they come out as true circles of
// a fixed pixel radius (MARKER_PX_RADIUS). Height is already known
// synchronously from the `height` prop, so only width needs measuring.
const MARKER_PX_RADIUS = 3;

function LineAreaChart({ series, area, heightPx }) {
  const svgRef = useRef(null);
  const [widthPx, setWidthPx] = useState(null);

  useEffect(() => {
    const el = svgRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w) setWidthPx(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const allPoints = series.flatMap((s) => s.points || []);
  const max = Math.max(1, ...allPoints.map((p) => p.count));
  const n = Math.max(1, (series[0]?.points || []).length);
  const stepX = n > 1 ? 100 / (n - 1) : 0;

  // viewBox units-per-pixel on each axis, used to size markers so they
  // render as true circles despite the non-uniform stretch.
  const xScale = widthPx ? widthPx / 100 : null;
  const yScale = heightPx ? heightPx / 40 : null;
  const markersReady = xScale && yScale;
  const rx = markersReady ? MARKER_PX_RADIUS / xScale : 0;
  const ry = markersReady ? MARKER_PX_RADIUS / yScale : 0;

  const pathFor = (points) =>
    points
      .map((p, i) => {
        const x = n > 1 ? i * stepX : 50;
        const y = 40 - (p.count / max) * 36 - 2;
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      className="trendchart-svg"
      role="img"
      aria-label="Trend chart"
    >
      {series.map((s, si) => {
        const points = s.points || [];
        const color = colorFor(s, si);
        const linePath = pathFor(points);
        const areaPath = area
          ? `${linePath} L${((n - 1) * stepX).toFixed(2)},40 L0,40 Z`
          : null;
        return (
          <g key={s.key || si}>
            {area && (
              <path d={areaPath} fill={color} opacity="0.15" stroke="none" />
            )}
            <path d={linePath} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
            {markersReady &&
              points.map((p, i) => {
                const x = n > 1 ? i * stepX : 50;
                const y = 40 - (p.count / max) * 36 - 2;
                return (
                  <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill={color}>
                    <title>{`${s.label ? s.label + " — " : ""}${p.label}: ${p.count}`}</title>
                  </ellipse>
                );
              })}
          </g>
        );
      })}
    </svg>
  );
}

// ── Bar renderer (grouped bars when multiple series) ──
function BarChart({ series }) {
  const allPoints = series.flatMap((s) => s.points || []);
  const max = Math.max(1, ...allPoints.map((p) => p.count));
  const n = Math.max(1, (series[0]?.points || []).length);
  const bucketW = 100 / n;
  const groupPad = bucketW * 0.15;
  const barW = (bucketW - groupPad * 2) / series.length;

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="trendchart-svg" role="img" aria-label="Trend chart">
      {(series[0]?.points || []).map((_, i) => {
        const bucketX = i * bucketW + groupPad;
        return series.map((s, si) => {
          const p = s.points[i];
          const color = colorFor(s, si);
          const h = p.count === 0 ? 0.6 : (p.count / max) * 36;
          const x = bucketX + si * barW;
          return (
            <rect key={`${i}-${si}`} x={x} y={40 - h} width={barW * 0.85} height={h} rx="0.6" fill={color}>
              <title>{`${s.label ? s.label + " — " : ""}${p.label}: ${p.count}`}</title>
            </rect>
          );
        });
      })}
    </svg>
  );
}

// ── Stacked bar renderer ──
function StackedBarChart({ series }) {
  const n = Math.max(1, (series[0]?.points || []).length);
  const totals = Array.from({ length: n }, (_, i) =>
    series.reduce((sum, s) => sum + (s.points[i]?.count || 0), 0)
  );
  const max = Math.max(1, ...totals);
  const bucketW = 100 / n;
  const barW = bucketW * 0.6;

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="trendchart-svg" role="img" aria-label="Stacked trend chart">
      {Array.from({ length: n }).map((_, i) => {
        const x = i * bucketW + (bucketW - barW) / 2;
        let yCursor = 40;
        return (
          <g key={i}>
            {series.map((s, si) => {
              const p = s.points[i];
              const color = colorFor(s, si);
              const h = (p.count / max) * 36;
              yCursor -= h;
              return (
                <rect key={si} x={x} y={yCursor} width={barW} height={h} fill={color}>
                  <title>{`${s.label}: ${p.count}`}</title>
                </rect>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

// ── Pie renderer (snapshot, not time-series) ──
function PieChart({ slices }) {
  const total = slices.reduce((sum, s) => sum + (s.value || 0), 0);
  if (total === 0) return null;

  const cx = 20, cy = 20, r = 18;
  let angleCursor = -90; // start at 12 o'clock

  const arcs = slices
    .filter((s) => s.value > 0)
    .map((s, i) => {
      const fraction = s.value / total;
      const startAngle = angleCursor;
      const endAngle = angleCursor + fraction * 360;
      angleCursor = endAngle;

      const toXY = (angle) => {
        const rad = (angle * Math.PI) / 180;
        return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
      };
      const [x1, y1] = toXY(startAngle);
      const [x2, y2] = toXY(endAngle);
      const largeArc = fraction > 0.5 ? 1 : 0;
      const path = `M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${largeArc} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;

      return (
        <path key={s.key || i} d={path} fill={colorFor(s, i)}>
          <title>{`${s.label}: ${s.value} (${Math.round(fraction * 100)}%)`}</title>
        </path>
      );
    });

  return (
    <svg viewBox="0 0 40 40" className="trendchart-svg trendchart-pie-svg" role="img" aria-label="Breakdown pie chart">
      {arcs}
    </svg>
  );
}

// ── Public component ──
export default function TrendChart({ type, series, height = 140, showLegend }) {
  const shouldShowLegend =
    showLegend !== undefined ? showLegend : type === "pie" || (series && series.length > 1);

  const empty = type === "pie"
    ? isAllZero(series.map((s) => ({ type: "pie", value: s.value })))
    : isAllZero(series);

  if (empty) {
    return (
      <p className="trend-empty">
        {type === "pie" ? "No data for this snapshot." : "No activity in this range."}
      </p>
    );
  }

  let body;
  if (type === "line") body = <LineAreaChart series={series} area={false} heightPx={height} />;
  else if (type === "area") body = <LineAreaChart series={series} area={true} heightPx={height} />;
  else if (type === "bar") body = <BarChart series={series} />;
  else if (type === "stackedBar") body = <StackedBarChart series={series} />;
  else if (type === "pie") body = <PieChart slices={series} />;
  else body = null;

  const firstPoints = series[0]?.points;
  const showAxis = type !== "pie" && firstPoints && firstPoints.length > 0;

  return (
    <div className="trendchart-wrap" style={{ "--trendchart-height": `${height}px` }}>
      <div className={`trendchart-body ${type === "pie" ? "trendchart-body-pie" : ""}`}>
        {body}
      </div>
      {showAxis && (
        <div className="trend-axis">
          <span>{firstPoints[0].label}</span>
          <span>{firstPoints[firstPoints.length - 1].label}</span>
        </div>
      )}
      {shouldShowLegend && <Legend items={series} />}
    </div>
  );
}
