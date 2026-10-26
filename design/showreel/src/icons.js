const FILE = '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>';

const PATHS = {
  dir: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  up: '<path d="M14 9 9 4 4 9"/><path d="M20 20h-7a4 4 0 0 1-4-4V4"/>',
  file: FILE,
  code: FILE + '<path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/>',
  doc: FILE + '<path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  pdf: FILE + '<path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  image: FILE + '<circle cx="10" cy="12" r="2"/><path d="m20 17-1.3-1.3a2.4 2.4 0 0 0-3.4 0L9 22"/>',
  archive: FILE + '<path d="M10 7h1"/><path d="M10 11h1"/><path d="M10 15h1"/><path d="M9 19h2"/>',
  auto: FILE + '<path d="m8 17 2.5-3.5 2 2L16 11"/>',
  cmd: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m10 8 4 4-4 4"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  drive: '<path d="M22 12H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><path d="M6 16h.01"/><path d="M10 16h.01"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  minus: '<path d="M5 12h14"/>',
  square: '<rect width="16" height="16" x="4" y="4" rx="2"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  Down: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  Up: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  Enter: '<path d="M20 4v7a4 4 0 0 1-4 4H4"/><path d="m9 10-5 5 5 5"/>',
  Left: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  Right: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  net: '<rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6 6h.01"/><path d="M6 18h.01"/>',
  pin: '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
  terminal: '<path d="m4 17 6-6-6-6"/><path d="M12 19h8"/>',
  clipboard: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
  transfer: '<path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>',
  diff: '<path d="M12 3v14"/><path d="M5 10h14"/><path d="M5 21h14"/>',
  note: '<path d="M12 20h9"/><path d="M16.38 3.62a1 1 0 0 1 3 3L7.37 18.64a2 2 0 0 1-.85.5l-2.87.84a.5.5 0 0 1-.62-.62l.84-2.87a2 2 0 0 1 .5-.85z"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>',
  pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  puzzle: '<path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  layout: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/><path d="M12 12h9"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  edit: '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>',
  cpu: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>',
  git: '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>',
  sliders: '<path d="M10 5H3"/><path d="M12 19H3"/><path d="M14 3v4"/><path d="M16 17v4"/><path d="M21 12h-9"/><path d="M21 19h-5"/><path d="M21 5h-7"/><path d="M8 10v4"/><path d="M8 12H3"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  zip: FILE + '<path d="M10 7h1"/><path d="M10 11h1"/><path d="M10 15h1"/><path d="M9 19h2"/>',
  wave: '<path d="M2 12h3l3-8 4 16 3-8h7"/>',
  book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
};

export function icon(name, cls = '') {
  return `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${PATHS[name] ?? FILE}</svg>`;
}

export const hasIcon = (name) => name in PATHS;

const F_GLYPH = 'M51.3 105.28H39.17V92.34H51.3V78.45L64.25 65.5H87.31V78.18H70.86L66.27 82.63V92.34H87.31V105.28H66.54V159.5H51.3Z';
const E_GLYPH = 'M98.31 146.15V105.82L111.66 92.34H148.21L161.83 105.82V130.91H113.55V141.7L118.68 146.82H141.74L146.59 141.83V137.79H161.7V146.42L148.62 159.5H111.53ZM146.59 119.72V110.41L141.33 105.02H118.81L113.55 110.41V119.72Z';

export function logo(cls, ids = false) {
  const pre = typeof ids === 'string' ? ids : 'logo';
  const id = (name) => (ids ? ` id="${pre}-${name.replace('logo-', '')}"` : '');
  return `<svg class="${cls}" viewBox="0 0 256 256" aria-hidden="true">
    <defs><linearGradient id="lg${cls}${pre}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#31353b"/><stop offset="1" stop-color="#23262b"/></linearGradient></defs>
    <g${id('logo-tile')}><rect x="8" y="8" width="240" height="240" rx="54" fill="url(#lg${cls}${pre})"/>
    <rect x="9" y="9" width="238" height="238" rx="53" fill="none" stroke="#fff" stroke-opacity=".10" stroke-width="2"/></g>
    <path${id('logo-f')} d="${F_GLYPH}" fill="#EEEAE3"/>
    <path${id('logo-e')} d="${E_GLYPH}" fill="#EEEAE3"/>
    <rect${id('logo-cursor')} x="172.83" y="168.5" width="44" height="18" rx="3" fill="#E8601F"/>
  </svg>`;
}

const WORD = [
  'M11 -40.2H2V-49.8H11V-60.1L20.6 -69.7H37.7V-60.3H25.5L22.1 -57V-49.8H37.7V-40.2H22.3V0H11Z',
  'M44.7 -9.9V-39.8L54.6 -49.8H81.7L91.8 -39.8V-21.2H56V-13.2L59.8 -9.4H76.9L80.5 -13.1V-16.1H91.7V-9.7L82 0H54.5ZM80.5 -29.5V-36.4L76.6 -40.4H59.9L56 -36.4V-29.5Z',
  'M103.3 -49.8H113.8V-41.3L122.1 -49.8H135.9V-40.1H124.6L114.6 -29.9V0H103.3Z',
  'M143.4 -49.8H153.9V-41.3L162.2 -49.8H176V-40.1H164.7L154.7 -29.9V0H143.4Z',
  'M183 -60.5V-66.3L187.1 -70.3H193.2L197.3 -66.3V-60.5L193.2 -56.5H187.1ZM184.5 -49.8H195.8V0H184.5Z',
  'M214.3 -9.9V-40.2H205.3V-49.8H214.5V-66H225.6V-49.8H240.9V-40.2H225.6V-13.5L229.5 -9.6H240.9V0H224.2Z',
  'M249.4 -9.9V-39.8L259.3 -49.8H286.4L296.5 -39.8V-21.2H260.7V-13.2L264.5 -9.4H281.6L285.2 -13.1V-16.1H296.4V-9.7L286.7 0H259.2ZM285.2 -29.5V-36.4L281.3 -40.4H264.6L260.7 -36.4V-29.5Z',
];

export function wordmark(prefix) {
  const letters = WORD.map((d, i) => `<path id="${prefix}-l${i}" d="${d}" fill="currentColor"/>`).join('');
  return `<svg class="wordmark" viewBox="0 -70.30 347.70 80.90" aria-hidden="true">${letters}
    <rect id="${prefix}-bar" x="301.50" y="1.00" width="46.20" height="9.60" fill="#E8601F"/></svg>`;
}
