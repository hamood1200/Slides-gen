// Charts as inline SVG, drawn at build time. No libraries.
// deck.json:
//   "chart": {
//     "kind": "bar" | "line",
//     "x": ["0", "25", ...] or { "en": [...], "ar": [...] },   categories (bar) or x values (line)
//     "series": [ { "name": {...}, "values": [ ... ] } ],        1 to 4 series
//     "x_label": {...}, "y_label": {...},                        axis titles, units in brackets
//     "y_min": 0, "y_max": 3500,                                 optional; nice ticks otherwise
//     "lines": [ { "y": 3150, "label": {...} } ],                optional reference lines
//     "labels": true                                             print the value on each bar / point
//   }
// Colours come from CSS classes (.s0 .. .s3) so the theme owns them. The SVG is always LTR:
// numbers on an axis read left to right in Arabic textbooks too.
import { esc, isolateLatin } from './text.mjs';

const W = 1120, H = 620, P = { l: 120, r: 40, t: 40, b: 110 };

function ticks(lo, hi, n = 5) {
  const span = hi - lo || 1, raw = span / n, mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(f => f * mag).find(s => s >= raw);
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step, out = [];
  for (let v = a; v <= b + step / 2; v += step) out.push(+v.toFixed(10));
  return out;
}
const AR = /[\u0600-\u06FF]/;
const flip = { start: 'end', end: 'start', middle: 'middle' };
// <text> with the right bidi: Arabic runs right-to-left, and in SVG an rtl "end" sits on the left
const txt = (cls, x, y, anchor, s, extra = '') => AR.test(s)
  ? `<text class="${cls}" x="${x}" y="${y}" direction="rtl" text-anchor="${flip[anchor]}"${extra}>${esc(isolateLatin(s))}</text>`
  : `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}"${extra}>${esc(s)}</text>`;
const fmt = v => Math.abs(v) >= 1000 ? v.toLocaleString('en-US') : String(+v.toFixed(3));

export function chart(c, lang, t, m) {
  if (!c) throw new Error('chart slide needs a "chart" object');
  // the language picker turns numbers into strings; turn them back
  const num = v => v == null ? v : Number(v);
  const xs = t(c.x), series = c.series.map(s => ({ name: s.name ? t(s.name) : '', v: s.values.map(num) }));
  const lines = (c.lines || []).map(l => ({ ...l, y: num(l.y) }));
  const all = series.flatMap(s => s.v).concat(lines.map(l => l.y));
  const tk = ticks(num(c.y_min) ?? Math.min(0, ...all), num(c.y_max) ?? Math.max(...all));
  const y0 = tk[0], y1 = tk[tk.length - 1];
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const Y = v => P.t + ih - (v - y0) / (y1 - y0) * ih;
  let g = '';

  // grid + y axis
  for (const v of tk) g += `<line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="tick" x="${P.l - 16}" y="${Y(v) + 8}" text-anchor="end">${fmt(v)}</text>`;
  g += `<line class="axis" x1="${P.l}" x2="${W - P.r}" y1="${Y(y0)}" y2="${Y(y0)}"/>`;

  // reference lines first, so the data and its labels sit on top
  for (const l of lines) g += `<line class="ref" x1="${P.l}" x2="${W - P.r}" y1="${Y(l.y)}" y2="${Y(l.y)}"/>` + txt('reflab', W - P.r, Y(l.y) - 14, 'end', l.label ? t(l.label) : fmt(l.y));

  if (c.kind === 'line') {
    const xn = xs.map(Number), numeric = xn.every(Number.isFinite);
    const X = numeric ? (v => P.l + (v - xn[0]) / (xn[xn.length - 1] - xn[0]) * iw) : ((_, k) => P.l + k * iw / (xs.length - 1));
    xs.forEach((x, k) => { g += `<text class="tick" x="${X(xn[k], k)}" y="${H - P.b + 40}" text-anchor="middle">${esc(x)}</text>`; });
    series.forEach((s, si) => {
      const pts = s.v.map((v, k) => [X(xn[k], k), Y(v)]);
      g += `<polyline class="ln s${si}" points="${pts.map(p => p.join(',')).join(' ')}"/>`;
      pts.forEach(([x, y], k) => { g += `<circle class="dot s${si}" cx="${x}" cy="${y}" r="7"/>${c.labels ? `<text class="val" x="${x}" y="${y - 18}" text-anchor="middle">${fmt(s.v[k])}</text>` : ''}`; });
    });
  } else {
    const band = iw / xs.length, gap = band * 0.28, bw = (band - gap) / series.length;
    xs.forEach((x, k) => {
      g += txt('tick', P.l + band * k + band / 2, H - P.b + 40, 'middle', x);
      series.forEach((s, si) => {
        const v = s.v[k], bx = P.l + band * k + gap / 2 + bw * si, top = Y(Math.max(v, 0)), h = Math.abs(Y(v) - Y(0));
        g += `<rect class="bar s${si}" x="${bx}" y="${top}" width="${bw - 6}" height="${h}"/>`;
        if (c.labels) g += `<text class="val" x="${bx + (bw - 6) / 2}" y="${top - 14}" text-anchor="middle">${fmt(v)}</text>`;
      });
    });
  }

  if (c.x_label) g += txt('atitle', P.l + iw / 2, H - 14, 'middle', t(c.x_label));
  if (c.y_label) g += txt('atitle', 0, 0, 'middle', t(c.y_label), ` transform="translate(30 ${P.t + ih / 2}) rotate(-90)"`);

  const legend = series.length > 1 && series.every(s => s.name)
    ? `<div class="legend">${series.map((s, si) => `<span><i class="s${si}"></i>${m(s.name)}</span>`).join('')}</div>` : '';
  return `<svg class="cht" dir="ltr" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${g}</svg>${legend}`;
}
