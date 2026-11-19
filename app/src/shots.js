// shots.js — fixed scenes for screenshots, driven by the ?shot= query.
// ?shot=cover renders one finished cover full-viewport (the app's own drawing of an export).
// ?shot=editor shows the editor with sample photos loaded and the panels filled.
// Samples are the kit's own image-model photos under samples/, free to use.
// window.__shotReady is set once the scene has painted, so a screenshot tool can wait for it.

const SAMPLE_NAMES = ['pier', 'boulevard'];

/** Alternating panel fill: panel i takes photos[i % photos.length], keeping default framing. */
function fillPanelsAlternating(state, photos) {
  state.panels.forEach((panel, i) => {
    panel.image = photos[i % photos.length];
  });
}

export async function runShot(params, helpers) {
  const { canvas, state, els, syncPanels, addPhoto, loadImage, redraw, renderPanelBar, EXPORT_SIZES } = helpers;
  const shot = params.get('shot');
  const caption = params.get('caption') ?? 'Neon Harbor';
  const subtitle = params.get('sub') ?? 'Vice City Nights';
  state.layout = params.get('layout') ?? (shot === 'cover' ? 'poster' : 'poster');
  state.grade = params.get('grade') ?? 'sunset';
  state.intensity = Number(params.get('intensity') ?? 0.85);
  els.caption.value = caption;
  els.subtitle.value = subtitle;
  els.layout.value = state.layout;
  els.grade.value = state.grade;

  // Load the requested sample (photo=pier|boulevard) or both (photo=both, the default for cover).
  const wanted = params.get('photo') ?? (shot === 'cover' ? 'both' : 'both');
  const names = wanted === 'both' ? SAMPLE_NAMES : [wanted];
  const photos = [];
  for (const name of names) {
    const img = await loadImage(`samples/${name}.jpg`);
    photos.push(img);
    addPhoto(img, `${name} (sample)`);
  }
  syncPanels();
  fillPanelsAlternating(state, photos);

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  } else {
    const sizeKey = params.get('size') ?? 'portrait';
    const size = EXPORT_SIZES[sizeKey] ?? EXPORT_SIZES.portrait;
    els.size.value = EXPORT_SIZES[sizeKey] ? sizeKey : 'portrait';
    canvas.width = size.w;
    canvas.height = size.h;
    renderPanelBar();
    document.getElementById('status').textContent =
      `${photos.length} sample photos loaded — every panel filled. Pick a panel, drag to reposition, export the PNG.`;
  }
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
