// cover.js — the cover renderer for Neon Cover Lab.
// Pure canvas drawing: multi-panel poster layouts, per-panel cover-crop placement, a Vice City
// neon-sunset grade drawn in code (sunset wash, teal-pink split, vignette, seeded grain) and
// bold stacked caption lettering. No images, fonts or libraries are loaded: everything is drawn.

/** Panel layouts as normalised rectangles (x, y, w, h in fractions of the cover). */
export const LAYOUTS = {
  poster: {
    label: 'Poster collage (5 panels)',
    panels: [
      { x: 0, y: 0, w: 0.625, h: 0.54 },
      { x: 0.625, y: 0, w: 0.375, h: 0.54 },
      { x: 0, y: 0.54, w: 0.375, h: 0.31 },
      { x: 0.375, y: 0.54, w: 0.625, h: 0.31 },
      { x: 0, y: 0.85, w: 1, h: 0.15 },
    ],
  },
  hero: {
    label: 'Hero + side strips',
    panels: [
      { x: 0, y: 0, w: 0.66, h: 1 },
      { x: 0.66, y: 0, w: 0.34, h: 0.5 },
      { x: 0.66, y: 0.5, w: 0.34, h: 0.5 },
    ],
  },
  cinema: {
    label: 'Cinema wide (4 panels)',
    panels: [
      { x: 0, y: 0, w: 0.38, h: 1 },
      { x: 0.38, y: 0, w: 0.34, h: 0.52 },
      { x: 0.38, y: 0.52, w: 0.34, h: 0.48 },
      { x: 0.72, y: 0, w: 0.28, h: 1 },
    ],
  },
  triptych: {
    label: 'Triptych (3 tall panels)',
    panels: [
      { x: 0, y: 0, w: 0.34, h: 1 },
      { x: 0.34, y: 0, w: 0.33, h: 1 },
      { x: 0.67, y: 0, w: 0.33, h: 1 },
    ],
  },
  mosaic: {
    label: 'Mosaic grid (6 panels)',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.34 },
      { x: 0.5, y: 0, w: 0.5, h: 0.34 },
      { x: 0, y: 0.34, w: 1, h: 0.32 },
      { x: 0, y: 0.66, w: 0.34, h: 0.34 },
      { x: 0.34, y: 0.66, w: 0.33, h: 0.34 },
      { x: 0.67, y: 0.66, w: 0.33, h: 0.34 },
    ],
  },
};

/** Colour grades: top tint, horizon glow and low sunset wash for the duotone split. */
export const GRADES = {
  sunset: { label: 'Sunset Vice', top: [0, 229, 255], mid: [255, 113, 206], low: [255, 122, 24], sky: '#241040' },
  neon: { label: 'Neon Nights', top: [64, 0, 255], mid: [255, 0, 128], low: [0, 229, 255], sky: '#0d0221' },
  teal: { label: 'Teal Heat', top: [0, 255, 200], mid: [0, 140, 255], low: [255, 60, 120], sky: '#06222b' },
  gold: { label: 'Golden Hour', top: [255, 200, 64], mid: [255, 110, 64], low: [180, 30, 90], sky: '#2b1206' },
};

/** Default per-panel framing variety, cycled when a panel has no explicit framing. */
export const PANEL_VIEWS = [
  { zoom: 1.0, focusX: 0.5, focusY: 0.42 },
  { zoom: 1.35, focusX: 0.35, focusY: 0.3 },
  { zoom: 1.2, focusX: 0.65, focusY: 0.55 },
  { zoom: 1.5, focusX: 0.5, focusY: 0.35 },
  { zoom: 1.15, focusX: 0.45, focusY: 0.6 },
  { zoom: 1.4, focusX: 0.6, focusY: 0.4 },
];

function rgba([r, g, b], a) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Deterministic 32-bit seeded RNG so grain and placeholder art are the same on every draw. */
export function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Draws one photo into a panel rectangle with cover-crop math: the photo is scaled to fill the
 * panel, multiplied by the panel zoom, and positioned so focusX/focusY (0..1) selects which part
 * of the overflow stays visible.
 */
export function drawPanelPhoto(ctx, image, rect, view) {
  const zoom = view?.zoom ?? 1;
  const focusX = view?.focusX ?? 0.5;
  const focusY = view?.focusY ?? 0.5;
  const scale = Math.max(rect.w / image.naturalWidth, rect.h / image.naturalHeight) * zoom;
  const dw = image.naturalWidth * scale;
  const dh = image.naturalHeight * scale;
  const dx = rect.x - (dw - rect.w) * focusX;
  const dy = rect.y - (dh - rect.h) * focusY;
  // A saturation/contrast lift as the photo lands, so the grade colours stay vivid.
  ctx.filter = 'saturate(1.28) contrast(1.07) brightness(1.03)';
  ctx.drawImage(image, dx, dy, dw, dh);
  ctx.filter = 'none';
}

/** Placeholder art for an empty panel: a striped retro sun over a gradient sea, drawn in code. */
export function drawPanelPlaceholder(ctx, rect, grade, index) {
  const sky = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  sky.addColorStop(0, grade.sky);
  sky.addColorStop(0.55, rgba(grade.mid, 0.55));
  sky.addColorStop(1, rgba(grade.low, 0.9));
  ctx.fillStyle = sky;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const rand = seededRandom(977 + index * 131);
  ctx.fillStyle = 'rgba(255, 230, 150, 0.9)';
  const sunR = Math.min(rect.w, rect.h) * 0.26;
  const sunX = rect.x + rect.w * (0.3 + rand() * 0.4);
  const sunY = rect.y + rect.h * 0.42;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba(grade.mid, 0.85);
  for (let i = 0; i < 4; i++) {
    const y = sunY + sunR * (0.1 + i * 0.22);
    ctx.fillRect(sunX - sunR, y, sunR * 2, sunR * 0.07);
  }
  // Palm silhouettes: a leaning trunk and a few fronds, kept simple and graphic.
  ctx.strokeStyle = 'rgba(8, 2, 16, 0.9)';
  ctx.lineWidth = Math.max(2, rect.w * 0.014);
  const baseX = rect.x + rect.w * (0.18 + rand() * 0.2);
  const topX = baseX + rect.w * 0.1;
  const topY = rect.y + rect.h * 0.3;
  ctx.beginPath();
  ctx.moveTo(baseX, rect.y + rect.h);
  ctx.quadraticCurveTo(baseX + rect.w * 0.02, rect.y + rect.h * 0.6, topX, topY);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * (0.08 + i * 0.22);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(a) * rect.w * 0.16, topY - Math.sin(a) * rect.h * 0.1 - rect.h * 0.03,
      topX + Math.cos(a) * rect.w * 0.24, topY - Math.sin(a) * rect.h * 0.12 + rect.h * 0.07,
    );
    ctx.stroke();
  }
}

/** The Vice City grade for one panel: teal from the top, pink-orange sunset from the bottom. */
export function gradePanel(ctx, rect, grade, intensity) {
  const wash = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  wash.addColorStop(0, rgba(grade.top, 0.34 * intensity));
  wash.addColorStop(0.45, 'rgba(0, 0, 0, 0)');
  wash.addColorStop(0.78, rgba(grade.mid, 0.28 * intensity));
  wash.addColorStop(1, rgba(grade.low, 0.52 * intensity));
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = `rgba(255, 140, 60, ${0.16 * intensity})`;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'source-over';
}

/** Film grain from the seeded RNG: thousands of 1-2px specks at low alpha, same every draw. */
export function drawGrain(ctx, w, h, amount) {
  if (amount <= 0) return;
  const rand = seededRandom(20261119);
  const count = Math.floor((w * h) / 900 * amount);
  for (let i = 0; i < count; i++) {
    const v = rand();
    ctx.fillStyle = v > 0.5 ? `rgba(255,255,255,${0.05 + rand() * 0.06})` : `rgba(0,0,0,${0.05 + rand() * 0.07})`;
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 1.6, 1 + rand() * 1.6);
  }
}

/** Vignette: transparent centre darkening to deep purple-black at the corners. */
export function drawVignette(ctx, w, h) {
  const r = Math.hypot(w, h) * 0.62;
  const g = ctx.createRadialGradient(w / 2, h / 2, r * 0.35, w / 2, h / 2, r);
  g.addColorStop(0, 'rgba(10, 0, 24, 0)');
  g.addColorStop(1, 'rgba(10, 0, 24, 0.5)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

const DISPLAY_FONT = `'Arial Black', Impact, 'Segoe UI Black', system-ui, sans-serif`;

/** Fits stacked display lines: shrinks the font until the widest line fits the target width. */
export function fitDisplayLines(ctx, lines, baseSize, maxWidth) {
  let size = baseSize;
  const setFont = () => { ctx.font = `900 ${size}px ${DISPLAY_FONT}`; };
  setFont();
  while (size > 14 && lines.some((line) => ctx.measureText(line).width > maxWidth)) {
    size -= 3;
    setFont();
  }
  return size;
}

/**
 * Bold caption lettering: the caption stacked in heavy capitals with a cyan echo offset, a thick
 * deep-purple outline, and a white-to-pink gradient fill; the subtitle rides above it in spaced
 * letters over a neon rule.
 */
export function drawCaptionLettering(ctx, w, h, caption, subtitle) {
  const text = (caption ?? '').trim().toUpperCase();
  const sub = (subtitle ?? '').trim().toUpperCase();
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length && !sub) return;
  // Stack: two words a line where that reads better, else one word a line for short captions.
  const lines = [];
  if (words.length >= 4) {
    for (let i = 0; i < words.length; i += 2) lines.push(words.slice(i, i + 2).join(' '));
  } else {
    lines.push(...words);
  }
  const capped = lines.slice(0, 3);
  const baseSize = h * (capped.length > 1 ? 0.105 : 0.15);
  const size = capped.length ? fitDisplayLines(ctx, capped, baseSize, w * 0.92) : baseSize;
  const lineHeight = size * 1.04;
  const blockH = capped.length * lineHeight;
  const bottom = h * 0.955;
  const top = bottom - blockH;

  // Legibility scrim: a soft dark-violet gradient behind the lettering block.
  const scrim = ctx.createLinearGradient(0, top - h * 0.16, 0, h);
  scrim.addColorStop(0, 'rgba(16, 2, 32, 0)');
  scrim.addColorStop(1, 'rgba(16, 2, 32, 0.62)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, top - h * 0.16, w, h - (top - h * 0.16));

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (sub) {
    const subSize = Math.max(13, h * 0.026);
    ctx.font = `700 ${subSize}px 'Segoe UI', system-ui, sans-serif`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(subSize * 0.55)}px`;
    ctx.fillStyle = '#7df9ff';
    ctx.shadowColor = 'rgba(0, 229, 255, 0.8)';
    ctx.shadowBlur = subSize * 0.55;
    ctx.fillText(sub, w / 2, top - h * 0.035);
    ctx.shadowBlur = 0;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.fillStyle = '#ff71ce';
    ctx.fillRect(w * 0.36, top - h * 0.024, w * 0.28, Math.max(2, h * 0.004));
  }
  if (!capped.length) return;
  ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
  capped.forEach((line, i) => {
    const y = top + lineHeight * (i + 0.86);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2a0a3a';
    ctx.lineWidth = size * 0.2;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.05;
    // Cyan echo: the whole line redrawn a few pixels down-right in neon teal.
    ctx.fillStyle = '#01cdfe';
    ctx.fillText(line, w / 2 + size * 0.045, y + size * 0.055);
    ctx.strokeText(line, w / 2, y);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    const fill = ctx.createLinearGradient(0, y - size, 0, y);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(0.55, '#ffd7f4');
    fill.addColorStop(1, '#ff71ce');
    ctx.fillStyle = fill;
    ctx.fillText(line, w / 2, y);
  });
}

/**
 * Draws the whole cover onto the canvas at its own pixel size.
 * scene: { layout, grade, intensity, caption, subtitle,
 *          panels: [{ image|null, zoom, focusX, focusY }] } — panels line up with LAYOUTS[layout].
 */
export function drawCoverArt(canvas, scene) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const layout = LAYOUTS[scene.layout] ?? LAYOUTS.poster;
  const grade = GRADES[scene.grade] ?? GRADES.sunset;
  const intensity = scene.intensity ?? 0.85;
  ctx.fillStyle = grade.sky;
  ctx.fillRect(0, 0, w, h);
  const gap = Math.max(3, Math.round(w * 0.006));
  layout.panels.forEach((p, i) => {
    const rect = {
      x: p.x * w + gap / 2, y: p.y * h + gap / 2,
      w: p.w * w - gap, h: p.h * h - gap,
    };
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    const panel = scene.panels?.[i] ?? {};
    const view = { ...PANEL_VIEWS[i % PANEL_VIEWS.length], ...panel };
    if (panel.image) drawPanelPhoto(ctx, panel.image, rect, view);
    else drawPanelPlaceholder(ctx, rect, grade, i);
    gradePanel(ctx, rect, grade, intensity);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = gap;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });
  drawVignette(ctx, w, h);
  drawGrain(ctx, w, h, 0.7);
  drawCaptionLettering(ctx, w, h, scene.caption, scene.subtitle);
}
