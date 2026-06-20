const swatch = document.getElementById('swatch');
const colorInput = document.getElementById('color-input');
const hexField = document.getElementById('hex');
const rgbField = document.getElementById('rgb');
const hslField = document.getElementById('hsl');
const cmykField = document.getElementById('cmyk');

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function rgbToHsl({ r, g, b }) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: Math.round(h * 60), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb({ h, s, l }) {
  const sn = s / 100, ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = ln - c / 2;
  let r, g, b;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

function rgbToCmyk({ r, g, b }) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round((1 - rn - k) / (1 - k) * 100),
    m: Math.round((1 - gn - k) / (1 - k) * 100),
    y: Math.round((1 - bn - k) / (1 - k) * 100),
    k: Math.round(k * 100)
  };
}

function cmykToRgb({ c, m, y, k }) {
  const kn = 1 - k / 100;
  return {
    r: Math.round(255 * (1 - c / 100) * kn),
    g: Math.round(255 * (1 - m / 100) * kn),
    b: Math.round(255 * (1 - y / 100) * kn)
  };
}

function updateAll(rgb, skip) {
  const hex = rgbToHex(rgb);
  const hsl = rgbToHsl(rgb);
  const cmyk = rgbToCmyk(rgb);

  swatch.style.background = hex;
  colorInput.value = hex;

  if (skip !== 'hex') hexField.value = hex;
  if (skip !== 'rgb') rgbField.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  if (skip !== 'hsl') hslField.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  if (skip !== 'cmyk') cmykField.value = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
}

function parseHex(v) {
  const m = v.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split('').map(c => c + c).join('') : m[1];
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function parseRgb(v) {
  const m = v.match(/(\d{1,3})[,\s]+(\d{1,3})[,\s]+(\d{1,3})/);
  if (!m) return null;
  const [r, g, b] = [+m[1], +m[2], +m[3]];
  if ([r, g, b].some(n => n > 255)) return null;
  return { r, g, b };
}

function parseHsl(v) {
  const m = v.match(/([\d.]+)[°,\s]+(\d{1,3})%?[,\s]+(\d{1,3})%?/);
  if (!m) return null;
  const h = +m[1] % 360, s = +m[2], l = +m[3];
  if (s > 100 || l > 100) return null;
  return hslToRgb({ h, s, l });
}

function parseCmyk(v) {
  const m = v.match(/(\d{1,3})%?[,\s]+(\d{1,3})%?[,\s]+(\d{1,3})%?[,\s]+(\d{1,3})%?/);
  if (!m) return null;
  const [c, mg, y, k] = [+m[1], +m[2], +m[3], +m[4]];
  if ([c, mg, y, k].some(n => n > 100)) return null;
  return cmykToRgb({ c, m: mg, y, k });
}

function markError(field, bad) {
  field.classList.toggle('error', bad);
}

colorInput.addEventListener('input', () => {
  updateAll(hexToRgb(colorInput.value));
});

swatch.addEventListener('click', () => colorInput.click());

hexField.addEventListener('input', () => {
  const rgb = parseHex(hexField.value);
  markError(hexField, !rgb);
  if (rgb) updateAll(rgb, 'hex');
});

rgbField.addEventListener('input', () => {
  const rgb = parseRgb(rgbField.value);
  markError(rgbField, !rgb);
  if (rgb) updateAll(rgb, 'rgb');
});

hslField.addEventListener('input', () => {
  const rgb = parseHsl(hslField.value);
  markError(hslField, !rgb);
  if (rgb) updateAll(rgb, 'hsl');
});

cmykField.addEventListener('input', () => {
  const rgb = parseCmyk(cmykField.value);
  markError(cmykField, !rgb);
  if (rgb) updateAll(rgb, 'cmyk');
});

document.querySelectorAll('.format-row button').forEach(btn => {
  btn.addEventListener('click', () => {
    const field = document.getElementById(btn.dataset.for);
    navigator.clipboard.writeText(field.value).then(() => {
      btn.textContent = 'Copied';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 1500);
    });
  });
});

updateAll(hexToRgb('#ec4899'));

// PWA install
(function () {
  if (window.matchMedia('(display-mode: standalone)').matches) return;

  const btn = document.getElementById('install-btn');
  let prompt;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS) {
    btn.textContent = '⊕ Install';
    btn.hidden = false;
    btn.addEventListener('click', () => alert('Tap the Share icon ⎋, then "Add to Home Screen".'));
    return;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    prompt = e;
    btn.hidden = false;
  });

  window.addEventListener('appinstalled', () => { btn.hidden = true; prompt = null; });

  btn.addEventListener('click', async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') btn.hidden = true;
    prompt = null;
  });
}());
