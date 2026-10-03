/**
 * Procedural, original artwork generator for demo data (no external or copyrighted images).
 * Each function returns an SVG string rendered to WebP by sharp in the seed.
 */

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const PALETTES = {
  purple: { colors: ['#1a0b2e', '#6a1b9a', '#b5179e', '#f72585', '#ffd166'], name: 'purple' },
  sunset: { colors: ['#2b0f3a', '#ff6b35', '#f7931e', '#ffd23f', '#c9184a'], name: 'orange' },
  teal: { colors: ['#03111a', '#006d77', '#83c5be', '#edf6f9', '#ffddd2'], name: 'teal' },
  ocean: { colors: ['#0b132b', '#1c2541', '#3a506b', '#5bc0be', '#e0fbfc'], name: 'blue' },
  forest: { colors: ['#081c15', '#1b4332', '#40916c', '#95d5b2', '#f4a261'], name: 'green' },
  crimson: { colors: ['#14080e', '#7b0828', '#d00000', '#ffba08', '#faa307'], name: 'red' },
  pastel: { colors: ['#fdf0ff', '#ffc8dd', '#bde0fe', '#a2d2ff', '#cdb4db'], name: 'pink' },
  mono: { colors: ['#0d0d0d', '#3a3a3a', '#7a7a7a', '#c4c4c4', '#f2f2f2'], name: 'black-white' },
  indigo: { colors: ['#10002b', '#3c096c', '#7b2cbf', '#c77dff', '#e0aaff'], name: 'purple' },
  earth: { colors: ['#2d1e12', '#7f5539', '#b08968', '#ddb892', '#ede0d4'], name: 'brown' },
  carnival: { colors: ['#0f0a1e', '#ff006e', '#fb5607', '#ffbe0b', '#3a86ff'], name: 'multicolor' },
} as const;

export type PaletteKey = keyof typeof PALETTES;
export type Kind = 'abstract' | 'landscape' | 'mandala' | 'lineart' | 'sketch' | 'portrait' | 'pop' | 'tree';

const f = (n: number) => n.toFixed(1);

export class Ctx {
  constructor(
    public r: Rng,
    public w: number,
    public h: number,
    public p: readonly string[],
  ) {}
  rand(a: number, b: number) {
    return a + (b - a) * this.r();
  }
  int(a: number, b: number) {
    return Math.floor(this.rand(a, b + 1));
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.r() * arr.length)];
  }
  accent() {
    return this.pick(this.p.slice(1));
  }
}

const grainFilter = `<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3"/><feColorMatrix type="saturate" values="0"/></filter>`;
const grain = (w: number, h: number, o = 0.07) => `<rect width="${w}" height="${h}" filter="url(#grain)" opacity="${o}"/>`;

function wrap(w: number, h: number, defs: string, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${grainFilter}${defs}</defs>${body}${grain(w, h)}</svg>`;
}

function brushStroke(c: Ctx, color: string, width: number, opacity: number) {
  const { w, h } = c;
  const x0 = c.rand(-0.1, 0.6) * w;
  const y0 = c.rand(0, 1) * h;
  const x1 = x0 + c.rand(0.3, 0.8) * w;
  const y1 = y0 + c.rand(-0.4, 0.4) * h;
  const cx1 = c.rand(0, 1) * w;
  const cy1 = c.rand(0, 1) * h;
  const cx2 = c.rand(0, 1) * w;
  const cy2 = c.rand(0, 1) * h;
  return `<path d="M${f(x0)} ${f(y0)} C${f(cx1)} ${f(cy1)} ${f(cx2)} ${f(cy2)} ${f(x1)} ${f(y1)}" stroke="${color}" stroke-width="${f(width)}" stroke-linecap="round" fill="none" opacity="${opacity.toFixed(2)}"/>`;
}

function splatter(c: Ctx, n: number, maxR: number) {
  let out = '';
  for (let i = 0; i < n; i++) {
    out += `<circle cx="${f(c.rand(0, c.w))}" cy="${f(c.rand(0, c.h))}" r="${f(Math.pow(c.r(), 3) * maxR + 1)}" fill="${c.accent()}" opacity="${c.rand(0.5, 1).toFixed(2)}"/>`;
  }
  return out;
}

function blob(c: Ctx, cx: number, cy: number, r: number) {
  const pts = c.int(6, 9);
  const coords: [number, number][] = [];
  for (let i = 0; i < pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const rr = r * c.rand(0.65, 1.25);
    coords.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  let d = `M${f((coords[0][0] + coords[1][0]) / 2)} ${f((coords[0][1] + coords[1][1]) / 2)}`;
  for (let i = 1; i <= pts; i++) {
    const p = coords[i % pts];
    const n = coords[(i + 1) % pts];
    d += ` Q${f(p[0])} ${f(p[1])} ${f((p[0] + n[0]) / 2)} ${f((p[1] + n[1]) / 2)}`;
  }
  return d + 'Z';
}

export function abstractArt(c: Ctx) {
  const { w, h, p } = c;
  const m = Math.min(w, h);
  let body = `<rect width="${w}" height="${h}" fill="url(#bg)"/>`;
  for (let i = 0; i < 9; i++) {
    body += `<path d="${blob(c, c.rand(0, w), c.rand(0, h), m * c.rand(0.12, 0.32))}" fill="${c.accent()}" opacity="${c.rand(0.45, 0.85).toFixed(2)}" filter="url(#soft)"/>`;
  }
  for (let i = 0; i < 5; i++) body += `<path d="${blob(c, c.rand(0, w), c.rand(0, h), m * c.rand(0.05, 0.16))}" fill="${c.accent()}" opacity="0.9"/>`;
  for (let i = 0; i < 6; i++) body += brushStroke(c, c.accent(), m * c.rand(0.015, 0.07), c.rand(0.6, 0.95));
  body += splatter(c, 90, m / 45);
  const defs = `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient><filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(m / 22)}"/></filter>`;
  return wrap(w, h, defs, body);
}

export function landscapeArt(c: Ctx) {
  const { w, h, p } = c;
  let body = `<rect width="${w}" height="${h}" fill="url(#sky)"/>`;
  const sunX = c.rand(0.2, 0.8) * w;
  const sunY = c.rand(0.18, 0.4) * h;
  const sunR = Math.min(w, h) * c.rand(0.07, 0.13);
  body += `<circle cx="${f(sunX)}" cy="${f(sunY)}" r="${f(sunR * 2.4)}" fill="${p[4]}" opacity="0.35" filter="url(#glow)"/><circle cx="${f(sunX)}" cy="${f(sunY)}" r="${f(sunR)}" fill="${p[4]}"/>`;
  const layers = 4;
  for (let l = 0; l < layers; l++) {
    const base = h * (0.45 + l * 0.13);
    let d = `M0 ${f(h)} L0 ${f(base)}`;
    const steps = 12 + l * 4;
    for (let i = 1; i <= steps; i++) d += ` L${f((i / steps) * w)} ${f(base - c.rand(0, h * (0.2 - l * 0.035)))}`;
    d += ` L${w} ${h}Z`;
    const color = p[Math.max(0, 3 - l)];
    body += `<path d="${d}" fill="${color}" opacity="${(0.55 + l * 0.15).toFixed(2)}"/>`;
  }
  // Pine silhouettes in the foreground
  for (let i = 0; i < 16; i++) {
    const x = c.rand(0, w);
    const th = h * c.rand(0.12, 0.26);
    const tw = th * 0.38;
    const y = h - c.rand(0, h * 0.05);
    body += `<path d="M${f(x)} ${f(y - th)} L${f(x + tw / 2)} ${f(y)} L${f(x - tw / 2)} ${f(y)}Z" fill="${p[0]}" opacity="0.92"/>`;
  }
  for (let i = 0; i < 40; i++) body += `<circle cx="${f(c.rand(0, w))}" cy="${f(c.rand(0, h * 0.35))}" r="${f(c.rand(0.6, 2.2))}" fill="#fff" opacity="${c.rand(0.2, 0.8).toFixed(2)}"/>`;
  const defs = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="0.55" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[2]}"/></linearGradient><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(sunR / 1.5)}"/></filter>`;
  return wrap(w, h, defs, body);
}

export function mandalaArt(c: Ctx) {
  const { w, h, p } = c;
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.46;
  let body = `<rect width="${w}" height="${h}" fill="url(#bg)"/>`;
  const rings = c.int(6, 9);
  for (let ring = rings; ring >= 1; ring--) {
    const rr = (R * ring) / rings;
    const petals = 6 + ring * c.int(2, 4);
    const color = p[(ring % (p.length - 1)) + 1];
    const pw = (Math.PI * rr) / petals;
    for (let i = 0; i < petals; i++) {
      const a = (360 / petals) * i;
      body += `<ellipse cx="${f(cx)}" cy="${f(cy - rr + pw)}" rx="${f(pw * 0.55)}" ry="${f(pw * 1.3)}" fill="${color}" opacity="0.85" stroke="${p[0]}" stroke-width="1.5" transform="rotate(${f(a)} ${f(cx)} ${f(cy)})"/>`;
    }
    body += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr - pw * 1.6)}" fill="none" stroke="${p[4]}" stroke-width="2" stroke-dasharray="4 6" opacity="0.8"/>`;
  }
  body += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R / rings / 1.4)}" fill="${p[4]}" stroke="${p[0]}" stroke-width="3"/>`;
  body += splatter(c, 40, Math.min(w, h) / 120);
  const defs = `<radialGradient id="bg" cx="0.5" cy="0.5" r="0.75"><stop offset="0" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[0]}"/></radialGradient>`;
  return wrap(w, h, defs, body);
}

/** Minimalist "boho" composition: nested arches, sun disc, hills and fine-line botanicals. */
export function lineArt(c: Ctx) {
  const { w, h, p } = c;
  const muted = ['#c8553d', '#e0a458', '#7d9d9c', '#b5838d', '#6d597a', '#f2cc8f', '#81b29a'];
  const pickM = () => c.pick(p[0] === '#0d0d0d' ? ['#3a3a3a', '#7a7a7a', '#c4c4c4'] : muted);
  let body = `<rect width="${w}" height="${h}" fill="#f4eee4"/>`;
  const ground = h * c.rand(0.68, 0.8);
  body += `<circle cx="${f(c.rand(0.25, 0.75) * w)}" cy="${f(c.rand(0.2, 0.4) * h)}" r="${f(Math.min(w, h) * c.rand(0.1, 0.16))}" fill="${pickM()}"/>`;
  const ax = c.rand(0.3, 0.7) * w;
  const aw = w * c.rand(0.35, 0.55);
  for (let i = 0; i < 4; i++) {
    const ww = aw * (1 - i * 0.2);
    const top = ground - h * 0.45 * (1 - i * 0.18);
    body += `<path d="M${f(ax - ww / 2)} ${f(ground)} L${f(ax - ww / 2)} ${f(top + ww / 2)} A${f(ww / 2)} ${f(ww / 2)} 0 0 1 ${f(ax + ww / 2)} ${f(top + ww / 2)} L${f(ax + ww / 2)} ${f(ground)}Z" fill="${pickM()}" opacity="0.92"/>`;
  }
  body += `<path d="M0 ${f(ground)} Q${f(w * 0.3)} ${f(ground - h * 0.12)} ${f(w * 0.6)} ${f(ground)} T${w} ${f(ground - h * 0.03)} L${w} ${h} L0 ${h}Z" fill="${pickM()}"/>`;
  for (let s = 0; s < 3; s++) {
    const sx = c.rand(0.1, 0.9) * w;
    const sh = h * c.rand(0.25, 0.45);
    body += `<path d="M${f(sx)} ${f(h)} C${f(sx + c.rand(-60, 60))} ${f(h - sh * 0.4)} ${f(sx + c.rand(-80, 80))} ${f(h - sh * 0.7)} ${f(sx + c.rand(-40, 40))} ${f(h - sh)}" stroke="#2a2420" stroke-width="2.5" fill="none"/>`;
    for (let l = 0; l < 6; l++) {
      const ly = h - sh * (0.2 + l * 0.13);
      const dir = l % 2 ? 1 : -1;
      body += `<path d="M${f(sx)} ${f(ly)} q${f(dir * 40)} -30 ${f(dir * 70)} -10 q${f(-dir * 30)} 25 ${f(-dir * 70)} 10" fill="${pickM()}" stroke="#2a2420" stroke-width="1.5"/>`;
    }
  }
  body += `<line x1="0" y1="${f(ground)}" x2="${w}" y2="${f(ground)}" stroke="#2a2420" stroke-width="1.5" opacity="0.6"/>`;
  return wrap(w, h, '', body);
}

export function sketchArt(c: Ctx) {
  const { w, h } = c;
  let body = `<rect width="${w}" height="${h}" fill="#efeae2"/>`;
  for (let i = 0; i < 8; i++) {
    body += `<path d="${blob(c, c.rand(0, w), c.rand(0, h), Math.min(w, h) * c.rand(0.1, 0.25))}" fill="#2b2b2b" opacity="${c.rand(0.06, 0.18).toFixed(2)}" filter="url(#smudge)"/>`;
  }
  // Architectural hatching: buildings / arches
  const cols = c.int(4, 7);
  for (let i = 0; i < cols; i++) {
    const bx = (i / cols) * w + c.rand(-20, 20);
    const bw = w / cols - c.rand(10, 40);
    const bh = h * c.rand(0.35, 0.75);
    const by = h - bh;
    body += `<rect x="${f(bx)}" y="${f(by)}" width="${f(bw)}" height="${f(bh)}" fill="none" stroke="#222" stroke-width="2.2" opacity="0.8"/>`;
    for (let k = 0; k < 18; k++) {
      const y = by + c.rand(0, bh);
      body += `<line x1="${f(bx)}" y1="${f(y)}" x2="${f(bx + bw * c.rand(0.2, 1))}" y2="${f(y + c.rand(-30, 30))}" stroke="#333" stroke-width="${c.rand(0.6, 1.6).toFixed(1)}" opacity="${c.rand(0.25, 0.7).toFixed(2)}"/>`;
    }
    body += `<path d="M${f(bx + bw * 0.25)} ${f(h)} L${f(bx + bw * 0.25)} ${f(by + bh * 0.55)} Q${f(bx + bw / 2)} ${f(by + bh * 0.35)} ${f(bx + bw * 0.75)} ${f(by + bh * 0.55)} L${f(bx + bw * 0.75)} ${f(h)}" fill="#1a1a1a" opacity="0.55"/>`;
  }
  for (let i = 0; i < 4; i++) body += brushStroke(c, '#111', c.rand(2, 6), 0.5);
  return wrap(w, h, `<filter id="smudge" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(Math.min(w, h) / 25)}"/></filter>`, body);
}

export function portraitArt(c: Ctx) {
  const { w, h, p } = c;
  const cx = w * c.rand(0.42, 0.58);
  const headR = Math.min(w, h) * 0.17;
  const headY = h * 0.38;
  const silhouette = `M${f(cx - headR * 0.35)} ${f(headY + headR * 0.85)} L${f(cx - headR * 0.4)} ${f(headY + headR * 1.4)} C${f(cx - headR * 2.6)} ${f(headY + headR * 1.7)} ${f(cx - headR * 3.2)} ${f(h * 0.9)} ${f(cx - headR * 3.4)} ${f(h + 10)} L${f(cx + headR * 3.4)} ${f(h + 10)} C${f(cx + headR * 3.2)} ${f(h * 0.9)} ${f(cx + headR * 2.6)} ${f(headY + headR * 1.7)} ${f(cx + headR * 0.4)} ${f(headY + headR * 1.4)} L${f(cx + headR * 0.35)} ${f(headY + headR * 0.85)}Z`;
  let inner = '';
  for (let i = 0; i < 12; i++) inner += `<path d="${blob(c, c.rand(cx - headR * 3, cx + headR * 3), c.rand(headY - headR * 1.5, h), headR * c.rand(0.4, 1.3))}" fill="${c.accent()}" opacity="${c.rand(0.6, 0.95).toFixed(2)}"/>`;
  for (let i = 0; i < 6; i++) inner += brushStroke(c, c.accent(), headR * c.rand(0.08, 0.3), 0.85);
  let body = `<rect width="${w}" height="${h}" fill="url(#bg)"/>`;
  for (let i = 0; i < 6; i++) body += `<path d="${blob(c, c.rand(0, w), c.rand(0, h), Math.min(w, h) * c.rand(0.1, 0.25))}" fill="${c.accent()}" opacity="0.35" filter="url(#soft)"/>`;
  body += `<g clip-path="url(#sil)"><rect width="${w}" height="${h}" fill="${p[0]}"/>${inner}</g>`;
  body += `<path d="${silhouette}" fill="none" stroke="${p[4]}" stroke-width="3" opacity="0.7"/><ellipse cx="${f(cx)}" cy="${f(headY)}" rx="${f(headR * 0.82)}" ry="${f(headR)}" fill="none" stroke="${p[4]}" stroke-width="3" opacity="0.7"/>`;
  body += splatter(c, 50, Math.min(w, h) / 70);
  const defs = `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[0]}"/></linearGradient><clipPath id="sil"><path d="${silhouette}"/><ellipse cx="${f(cx)}" cy="${f(headY)}" rx="${f(headR * 0.82)}" ry="${f(headR)}"/></clipPath><filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(Math.min(w, h) / 18)}"/></filter>`;
  return wrap(w, h, defs, body);
}

export function popArt(c: Ctx) {
  const { w, h, p } = c;
  const cell = Math.min(w, h) / c.int(2, 3);
  let body = `<rect width="${w}" height="${h}" fill="${p[4]}"/>`;
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      const col = c.accent();
      body += `<rect x="${f(x)}" y="${f(y)}" width="${f(cell)}" height="${f(cell)}" fill="${col}" stroke="#111" stroke-width="8"/>`;
      body += `<rect x="${f(x)}" y="${f(y)}" width="${f(cell)}" height="${f(cell)}" fill="url(#dots)" opacity="0.5"/>`;
      const kind = c.int(0, 2);
      const mx = x + cell / 2;
      const my = y + cell / 2;
      if (kind === 0) body += `<circle cx="${f(mx)}" cy="${f(my)}" r="${f(cell * 0.28)}" fill="${c.accent()}" stroke="#111" stroke-width="7"/>`;
      else if (kind === 1) {
        let star = '';
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
          const rr = i % 2 ? cell * 0.14 : cell * 0.34;
          star += `${i ? 'L' : 'M'}${f(mx + Math.cos(a) * rr)} ${f(my + Math.sin(a) * rr)}`;
        }
        body += `<path d="${star}Z" fill="${c.accent()}" stroke="#111" stroke-width="6"/>`;
      } else body += `<path d="${blob(c, mx, my, cell * 0.3)}" fill="${c.accent()}" stroke="#111" stroke-width="6"/>`;
    }
  }
  const defs = `<pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="4" fill="#111"/></pattern>`;
  return wrap(w, h, defs, body);
}

export function treeOfLife(c: Ctx, opts: { dark?: boolean; depth?: number } = {}) {
  const { w, h, p } = c;
  const leaves: string[] = [];
  const branches: string[] = [];
  const grow = (x: number, y: number, len: number, angle: number, depth: number, width: number) => {
    const x2 = x + Math.cos(angle) * len;
    const y2 = y + Math.sin(angle) * len;
    const mx = (x + x2) / 2 + c.rand(-len * 0.2, len * 0.2);
    const my = (y + y2) / 2 + c.rand(-len * 0.2, len * 0.2);
    branches.push(`<path d="M${f(x)} ${f(y)} Q${f(mx)} ${f(my)} ${f(x2)} ${f(y2)}" stroke="#1b1020" stroke-width="${f(width)}" stroke-linecap="round" fill="none"/>`);
    if (depth === 0) {
      for (let i = 0; i < 6; i++) {
        leaves.push(`<circle cx="${f(x2 + c.rand(-len, len))}" cy="${f(y2 + c.rand(-len, len))}" r="${f(c.rand(len * 0.12, len * 0.5))}" fill="${c.accent()}" opacity="${c.rand(0.55, 0.95).toFixed(2)}"/>`);
      }
      return;
    }
    const n = depth > 5 ? 2 : c.int(2, 3);
    for (let i = 0; i < n; i++) grow(x2, y2, len * c.rand(0.68, 0.82), angle + c.rand(-0.6, 0.6), depth - 1, width * 0.68);
  };
  grow(w / 2, h * 1.02, h * 0.22, -Math.PI / 2, opts.depth ?? 7, Math.min(w, h) * 0.045);
  const bg = opts.dark !== false ? `<rect width="${w}" height="${h}" fill="url(#bg)"/>` : '';
  let glow = '';
  for (let i = 0; i < 10; i++) glow += `<path d="${blob(c, c.rand(0.15, 0.85) * w, c.rand(0.05, 0.6) * h, Math.min(w, h) * c.rand(0.1, 0.22))}" fill="${c.accent()}" opacity="0.5" filter="url(#soft)"/>`;
  const body = `${bg}${glow}${branches.join('')}<g filter="url(#leafglow)">${leaves.join('')}</g>${splatter(c, 160, Math.min(w, h) / 90)}`;
  const defs = `<radialGradient id="bg" cx="0.5" cy="0.35" r="0.9"><stop offset="0" stop-color="${p[1]}"/><stop offset="1" stop-color="#07040d"/></radialGradient><filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(Math.min(w, h) / 14)}"/></filter><filter id="leafglow"><feGaussianBlur stdDeviation="1.2"/></filter>`;
  return wrap(w, h, defs, body);
}

export function generate(kind: Kind, seed: number, w: number, h: number, palette: PaletteKey) {
  const c = new Ctx(mulberry32(seed), w, h, PALETTES[palette].colors);
  switch (kind) {
    case 'abstract':
      return abstractArt(c);
    case 'landscape':
      return landscapeArt(c);
    case 'mandala':
      return mandalaArt(c);
    case 'lineart':
      return lineArt(c);
    case 'sketch':
      return sketchArt(c);
    case 'portrait':
      return portraitArt(c);
    case 'pop':
      return popArt(c);
    case 'tree':
      return treeOfLife(c);
  }
}

/** Abstract avatar: stylised silhouette on a gradient (not a real person). */
export function avatar(seed: number, palette: PaletteKey, size = 600) {
  return portraitArt(new Ctx(mulberry32(seed), size, size, PALETTES[palette].colors));
}
