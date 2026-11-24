// shared drawing helpers for reference illustrations
export const P = pts => c => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); };
export const E = (x, y, rx, ry, rot = 0) => c => c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
export const RR = (x, y, w, h, r) => c => c.roundRect(x, y, w, h, r);
export const lin = (x0, y0, x1, y1, stops) => c => { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, col]) => g.addColorStop(o, col)); return g; };
export const rad = (x, y, r0, r1, stops) => c => { const g = c.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, col]) => g.addColorStop(o, col)); return g; };
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const eo = t => 1 - Math.pow(1 - clamp(t), 3);
export const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const back = (t, s = 1.7) => { t = clamp(t) - 1; return 1 + t * t * ((s + 1) * t + s); };
export const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
// quad bilinear: corners tl, tr, br, bl -> point at (u,v)
export const quadPt = (q, u, v) => { const [a, b, c, d] = q; const top = [lerp(a[0], b[0], u), lerp(a[1], b[1], u)], bot = [lerp(d[0], c[0], u), lerp(d[1], c[1], u)]; return [lerp(top[0], bot[0], v), lerp(top[1], bot[1], v)]; };
export const subQuad = (q, u0, v0, u1, v1) => [quadPt(q, u0, v0), quadPt(q, u1, v0), quadPt(q, u1, v1), quadPt(q, u0, v1)];

// ---- hand-drawn geometry -------------------------------------------------
// A hand does not draw straight lines or true ellipses. These helpers take the
// clean geometry a plate is planned with and let it drift: corners go a few
// pixels off, edges bow, ellipses close with a gap and a doubled stroke.
// The drift is seeded per shape so a plate is reproducible.

let _hseed = 1;
export const handSeed = s => { _hseed = (s | 0) || 1; };
const hrand = () => { _hseed = (_hseed * 1103515245 + 12345) & 0x7fffffff; return _hseed / 0x7fffffff - .5; };

// wobble every point of a polygon, then bow each edge slightly
export const HP = (pts, amt = 5, bowAmt = 4) => {
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;              // edge normal
    const steps = Math.max(1, Math.round(L / 90));
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = (s + 1) / steps;
      const mx = lerp(a[0], b[0], t), my = lerp(a[1], b[1], t);
      // the bow: the middle of a long edge sags a little
      const bow = Math.sin(t * Math.PI) * bowAmt * hrand();
      const px = mx + nx * bow + hrand() * amt;
      const py = my + ny * bow + hrand() * amt;
      out.push([px, py]);
      if (s === steps - 1) {
        const ex = lerp(a[0], b[0], t2) + hrand() * amt, ey = lerp(a[1], b[1], t2) + hrand() * amt;
        out.push([ex, ey]);
      }
    }
  }
  return P(out);
};

// a hand-drawn ellipse: slightly irregular radii, closed with a small overlap
export const HE = (cx, cy, rx, ry, rot = 0, amt = 4) => {
  const n = 26, c = Math.cos(rot), s = Math.sin(rot), pts = [];
  const rr = 1 + hrand() * .08;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + hrand() * .05 + (i % 2 ? .012 : -.012);
    const x = Math.cos(a) * rx * k * rr, y = Math.sin(a) * ry * k * rr;
    pts.push([cx + x * c - y * s + hrand() * amt * .5, cy + x * s + y * c + hrand() * amt * .5]);
  }
  // close past the start, the way a hand does
  pts.push([pts[0][0] + hrand() * amt, pts[0][1] + hrand() * amt]);
  return P(pts);
};

// a hand-drawn rounded rectangle: corners pushed off square, edges slightly bowed
export const HR = (x, y, w, h, r, amt = 4) => {
  const pts = [], seg = Math.max(2, Math.round(r / 8));
  const corner = (cx, cy, a0) => { for (let i = 0; i <= seg; i++) { const a = a0 + (i / seg) * Math.PI / 2; pts.push([cx + Math.cos(a) * r + hrand() * amt, cy + Math.sin(a) * r + hrand() * amt]); } };
  corner(x + w - r, y + r, -Math.PI / 2);
  corner(x + w - r, y + h - r, 0);
  corner(x + r, y + h - r, Math.PI / 2);
  corner(x + r, y + r, Math.PI);
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    out.push(pts[i]);
    const a = pts[i], b = pts[(i + 1) % pts.length];
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 70) out.push([(a[0] + b[0]) / 2 + hrand() * amt, (a[1] + b[1]) / 2 + hrand() * amt]);
  }
  return P(out);
};

// a single wobbly line (an arm, a hem, a scratch) - not closed
export const HL = (pts, amt = 3) => {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    out.push([pts[i][0] + hrand() * amt, pts[i][1] + hrand() * amt]);
    if (i < pts.length - 1) out.push([(pts[i][0] + pts[i + 1][0]) / 2 + hrand() * amt * 1.6, (pts[i][1] + pts[i + 1][1]) / 2 + hrand() * amt * 1.6]);
  }
  return c => {
    c.moveTo(out[0][0], out[0][1]);
    for (let i = 1; i < out.length; i++) c.lineTo(out[i][0], out[i][1]);
  };
};

// a hand's stroke props: the knife wanders, the colour varies, the mark bends
export const HAND = (base = {}) => ({ jit: .17, aj: .75, bend: .9, skew: .5, ...base });
