// main.js — the Neon Cover Lab editor.
// Loads the person's own photos from their machine (object URLs, never uploaded), fills the
// panels of the chosen layout with them, and exports the cover as a PNG at a post size.
// A `?shot=` query builds a fixed scene for screenshots instead (./shots.js).
import { LAYOUTS, GRADES, PANEL_VIEWS, drawCoverArt } from './cover.js';
import { runShot } from './shots.js';

export const EXPORT_SIZES = {
  square: { label: 'Square post — 1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait post — 1080 × 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide post — 1920 × 1080', w: 1920, h: 1080 },
};

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const els = {
  caption: document.getElementById('caption'),
  subtitle: document.getElementById('subtitle'),
  layout: document.getElementById('layout'),
  grade: document.getElementById('grade'),
  intensity: document.getElementById('intensity'),
  size: document.getElementById('size'),
  zoom: document.getElementById('zoom'),
  focusX: document.getElementById('focusX'),
  focusY: document.getElementById('focusY'),
  photoStrip: document.getElementById('photo-strip'),
  panelBar: document.getElementById('panel-bar'),
};

/** Editor state: photos are HTMLImageElements; panels mirror the layout's panel list. */
export const state = {
  photos: [],
  photoNames: [],
  activePhoto: -1,
  activePanel: 0,
  panels: [],
  layout: 'poster',
  grade: 'sunset',
  intensity: 0.85,
};

function panelCount() {
  return LAYOUTS[state.layout].panels.length;
}

/** Rebuilds the panel list for the current layout, keeping any framing already chosen. */
export function syncPanels() {
  const next = [];
  for (let i = 0; i < panelCount(); i++) {
    const prev = state.panels[i] ?? {};
    const view = PANEL_VIEWS[i % PANEL_VIEWS.length];
    next.push({
      image: prev.image ?? null,
      zoom: prev.zoom ?? view.zoom,
      focusX: prev.focusX ?? view.focusX,
      focusY: prev.focusY ?? view.focusY,
    });
  }
  state.panels = next;
  if (state.activePanel >= next.length) state.activePanel = 0;
}

/** The scene object cover.js draws, built from live editor state. */
export function currentScene() {
  return {
    layout: state.layout,
    grade: state.grade,
    intensity: state.intensity,
    caption: els.caption.value,
    subtitle: els.subtitle.value,
    panels: state.panels,
  };
}

export function redraw() {
  drawCoverArt(canvas, currentScene());
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Adds a loaded photo to the strip and makes it the active photo. */
export function addPhoto(image, name) {
  state.photos.push(image);
  state.photoNames.push(name);
  state.activePhoto = state.photos.length - 1;
  renderPhotoStrip();
  return state.activePhoto;
}

/** Fills every panel with the active photo (each panel keeps its own framing variety). */
export function fillAllPanelsWithActivePhoto() {
  if (state.activePhoto < 0) return;
  const image = state.photos[state.activePhoto];
  state.panels.forEach((panel) => { panel.image = image; });
  redraw();
  renderPanelBar();
}

/** Puts the active photo into the selected panel only. */
export function assignActivePhotoToPanel() {
  if (state.activePhoto < 0) return;
  state.panels[state.activePanel].image = state.photos[state.activePhoto];
  redraw();
  renderPanelBar();
}

function renderPhotoStrip() {
  els.photoStrip.replaceChildren();
  state.photos.forEach((photo, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb' + (i === state.activePhoto ? ' selected' : '');
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = state.photoNames[i];
    const tag = document.createElement('span');
    tag.textContent = state.photoNames[i];
    btn.append(img, tag);
    btn.addEventListener('click', () => {
      state.activePhoto = i;
      renderPhotoStrip();
    });
    els.photoStrip.append(btn);
  });
}

function renderPanelBar() {
  els.panelBar.replaceChildren();
  state.panels.forEach((panel, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'panel-chip' + (i === state.activePanel ? ' selected' : '');
    btn.textContent = `Panel ${i + 1}${panel.image ? ' ●' : ' ○'}`;
    btn.addEventListener('click', () => selectPanel(i));
    els.panelBar.append(btn);
  });
  syncFramingControls();
}

function syncFramingControls() {
  const panel = state.panels[state.activePanel];
  if (!panel) return;
  els.zoom.value = String(panel.zoom);
  els.focusX.value = String(panel.focusX);
  els.focusY.value = String(panel.focusY);
}

export function selectPanel(i) {
  state.activePanel = i;
  renderPanelBar();
}

/** Sets the preview canvas to the chosen export size so what you see is what you export. */
function applyExportSize() {
  const { w, h } = EXPORT_SIZES[els.size.value] ?? EXPORT_SIZES.portrait;
  canvas.width = w;
  canvas.height = h;
  redraw();
}

function bindEditor() {
  document.getElementById('photo').addEventListener('change', async (e) => {
    for (const file of e.target.files) {
      addPhoto(await loadImage(URL.createObjectURL(file)), file.name);
    }
    if (state.photos.length) {
      fillAllPanelsWithActivePhoto();
      status.textContent = `${state.photos.length} photo(s) loaded — panels filled. Drag the cover to reposition the selected panel.`;
    }
  });
  document.querySelectorAll('[data-sample]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const name = btn.getAttribute('data-sample');
      addPhoto(await loadImage(`samples/${name}.jpg`), `${name} (sample)`);
      fillAllPanelsWithActivePhoto();
      status.textContent = `Sample “${name}” loaded into every panel. Add your own photos to mix panels.`;
    });
  });
  document.getElementById('fill-all').addEventListener('click', fillAllPanelsWithActivePhoto);
  document.getElementById('assign-panel').addEventListener('click', assignActivePhotoToPanel);
  els.caption.addEventListener('input', redraw);
  els.subtitle.addEventListener('input', redraw);
  els.layout.addEventListener('change', () => {
    state.layout = els.layout.value;
    syncPanels();
    renderPanelBar();
    redraw();
  });
  els.grade.addEventListener('change', () => { state.grade = els.grade.value; redraw(); });
  els.intensity.addEventListener('input', () => { state.intensity = Number(els.intensity.value); redraw(); });
  els.size.addEventListener('change', applyExportSize);
  const framing = () => {
    const panel = state.panels[state.activePanel];
    panel.zoom = Number(els.zoom.value);
    panel.focusX = Number(els.focusX.value);
    panel.focusY = Number(els.focusY.value);
    redraw();
  };
  els.zoom.addEventListener('input', framing);
  els.focusX.addEventListener('input', framing);
  els.focusY.addEventListener('input', framing);
  // Drag on the cover repositions the selected panel's photo.
  let dragging = false;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const panel = state.panels[state.activePanel];
    panel.focusX = Math.min(1, Math.max(0, panel.focusX - e.movementX / canvas.clientWidth));
    panel.focusY = Math.min(1, Math.max(0, panel.focusY - e.movementY / canvas.clientHeight));
    syncFramingControls();
    redraw();
  });
  document.getElementById('export').addEventListener('click', () => {
    const { w, h } = EXPORT_SIZES[els.size.value] ?? EXPORT_SIZES.portrait;
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    drawCoverArt(off, currentScene());
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `neon-cover-${w}x${h}.png`;
      a.click();
      status.textContent = `Saved neon-cover-${w}x${h}.png`;
    }, 'image/png');
  });
}

/** Boot: shot mode builds its fixed scene; otherwise wire the editor and draw an empty cover. */
export async function boot() {
  syncPanels();
  const params = new URLSearchParams(location.search);
  if (params.get('shot')) {
    await runShot(params, {
      canvas, state, els, syncPanels, addPhoto, loadImage, redraw, renderPanelBar, EXPORT_SIZES,
    });
    return;
  }
  bindEditor();
  renderPanelBar();
  applyExportSize();
}

boot();
