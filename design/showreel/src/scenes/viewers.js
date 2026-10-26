import { prog, ease, mix } from '../ease.js';
import { el, put, clamp01 } from '../dom.js';
import { appWindow, seeded } from '../chrome.js';
import { elfViewer } from '../parts.js';
import { icon } from '../icons.js';
import { CAN, SIGNALS, PDF_OUTLINE } from '../data-roadmap.js';
import { WIN } from '../script.js';

const GAP_X = 1720, GAP_Y = 950;
const POS = [[0, 0], [GAP_X, 0], [0, GAP_Y], [GAP_X, GAP_Y]];
const C0 = { s: 1, fx: 960, fy: 540 };
const at = (i) => ({ s: 1, fx: 960 + POS[i][0], fy: 540 + POS[i][1] });
const OVER = { s: 0.5, fx: 960 + GAP_X / 2, fy: 540 + GAP_Y / 2 };
const PATH = [
  { a: 5.6, b: 7.3, from: C0, to: OVER },
  { a: 8.2, b: 9.7, from: OVER, to: at(1) },
  { a: 12.7, b: 14.7, from: at(1), to: at(2), dip: 0.14 },
  { a: 16.2, b: 18.6, from: at(2), to: at(3), dip: 0.12 },
];

function cam(t) {
  let c = C0;
  for (const seg of PATH) {
    if (t < seg.a) break;
    const p = ease.inOut(clamp01((t - seg.a) / (seg.b - seg.a)));
    const dip = (seg.dip ?? 0) * Math.sin(Math.PI * p);
    c = { s: mix(seg.from.s, seg.to.s, p) - dip, fx: mix(seg.from.fx, seg.to.fx, p), fy: mix(seg.from.fy, seg.to.fy, p) };
  }
  return c;
}

const KW = new Set(['void', 'if', 'return', 'static', 'const', 'for', 'while', 'else', 'switch', 'case', 'break']);
const TY = new Set(['uint32_t', 'uint8_t', 'can_bus_t', 'can_frame_t', 'bool']);
function hl(line) {
  if (/^\s*\/\*/.test(line) || /^\s*\/\//.test(line)) return `<span class="sx-c">${line}</span>`;
  if (/^#/.test(line)) return line.replace(/^(#\w+)(\s+)(\S+)?(.*)$/, (m, d, s, a = '', rest = '') => `<span class="sx-p">${d}</span>${s}<span class="sx-m">${a}</span>${hlCode(rest)}`);
  return hlCode(line);
}
function hlCode(s) {
  return s.replace(/("[^"]*")|(\/\*.*\*\/)|\b(\d+u?)\b|\b([A-Za-z_]\w*)\b(\s*\()?/g, (m, str, com, num, id, call) => {
    if (str) return `<span class="sx-s">${str}</span>`;
    if (com) return `<span class="sx-c">${com}</span>`;
    if (num) return `<span class="sx-n">${num}</span>`;
    if (KW.has(id)) return `<span class="sx-k">${id}</span>${call ?? ''}`;
    if (TY.has(id)) return `<span class="sx-t">${id}</span>${call ?? ''}`;
    if (call) return `<span class="sx-f">${id}</span>${call}`;
    if (/^[A-Z][A-Z0-9_]+$/.test(id)) return `<span class="sx-m">${id}</span>`;
    return id;
  });
}
const CODE = [
  '/* CAN interface: polling, timeouts and bus recovery */', '#include "can_if.h"', '#include "diag_dtc.h"', '', '#define CAN_TIMEOUT_MS   250u',
  '#define CAN_POLL_MS        5u', '', 'static uint32_t can_last_rx_ms;', 'static can_bus_t buses[2];', '',
  'void can_if_poll(uint32_t now_ms, can_bus_t bus)', '{', '    can_frame_t frame;', '    while (can_read(bus, &frame)) {', '        can_last_rx_ms = now_ms;',
  '        com_dispatch(&frame);', '    }', '    if (now_ms - can_last_rx_ms > CAN_TIMEOUT_MS) {', '        can_if_report_timeout();', '        can_if_reset_bus(bus);',
  '        diag_dtc_set(DTC_CAN_TIMEOUT);', '    }', '}', '', '/* "bus off" needs 128 x 11 recessive bits */',
];

function codeWindow() {
  const lines = CODE.map((l, i) => `<div class="cl ${i === 17 || i === 20 ? 'hit' : ''}"><span class="ln">${i + 1}</span><span class="lc">${hl(l).replace(/CAN_TIMEOUT(?!_MS)/g, '<em>CAN_TIMEOUT</em>')}</span></div>`).join('');
  const outline = ['CAN_TIMEOUT_MS', 'CAN_POLL_MS', 'can_last_rx_ms', 'buses', 'can_if_poll', 'can_if_init', 'can_if_reset_bus'].map((s, i) => `<div class="on-row ${i === 4 ? 'cur' : ''}"><span class="sk">${i < 2 ? 'M' : i < 4 ? 'V' : 'F'}</span>${s}</div>`).join('');
  return `<section class="viewer codev" style="left:12px;top:64px;width:1576px;height:754px">
    <div class="v-head"><span class="k-code">${icon('code')}</span><span class="file">can_if.c</span><span class="facts">D:\\Work\\aurora\\src\\can · C · 412 lines</span>
      <div class="findbox">${icon('search')}<span class="mono">CAN_TIMEOUT</span><span class="fc">2 of 6</span></div><div class="seg"><span>Simple</span><span class="on">Rich</span><span>Custom</span></div></div>
    <div class="codebody">${lines}</div><div class="marks-strip"><i style="top:24%"></i><i style="top:31%"></i><i style="top:52%" class="b"></i><i style="top:70%"></i></div>
    <div class="vstatus"><span>UTF-8 · LF · Ln 18, Col 25</span><span class="sp"></span><span>Oxidised iron</span></div>
    <div class="navdrawer"><div class="ndh">Outline <span class="kbd">Ctrl+B</span></div>${outline}</div>
    <div class="popover viewmenu"><div class="pophead">View <span class="kbd">Alt+V</span></div><div class="seg"><span>Simple</span><span class="on">Rich</span><span>Custom</span></div>
      ${[['Outline', 'Ctrl+B', false], ['Marks strip', 'Alt+M', true], ['Inspector', 'Ctrl+I', false], ['Line numbers', '', true]].map(([n, k, on]) => `<div class="vrow"><span>${n}</span>${k ? `<span class="kbd">${k}</span>` : '<span></span>'}<span class="tog ${on ? 'on' : ''}"><i></i></span></div>`).join('')}
      <div class="vfoot">Keep as default</div></div>
  </section>`;
}

function canWindow() {
  const rnd = seeded(42);
  const pts = Array.from({ length: 80 }, (_, i) => {
    const v = 120 - i * 0.9 - Math.sin(i / 6) * 18 - rnd() * 6;
    return `${(i * 700 / 79).toFixed(1)},${v.toFixed(1)}`;
  }).join(' ');
  const rows = CAN.map((r, i) => `<div class="fr ${r[2] === 'EngineData' ? 'sel' : ''}"><span class="mono">${r[0]}</span><span class="mono id">${r[1]}</span><span class="nm">${r[2]}</span><span class="mono">${r[3]}</span><span class="mono data">${r[4]}</span></div>`).join('');
  const sig = SIGNALS.map((s, i) => `<div class="sg"><span>${s[0]}</span><span class="mono v">${s[1]}</span><span class="u">${s[2]}</span><span class="track"><i style="width:${[68, 40, 76, 52][i]}%"></i></span></div>`).join('');
  return `<section class="viewer canv" style="left:12px;top:64px;width:1576px;height:754px">
    <div class="v-head"><span class="k-auto">${icon('wave')}</span><span class="file">hil_night.trc</span><span class="facts">Decoded with powertrain.dbc · 1,204,388 frames · 4 buses</span><div class="seg"><span>Simple</span><span class="on">Rich</span></div></div>
    <div class="canbody"><div class="card frames"><h4><span>Frames</span><span>all IDs · 0.00–0.09 s</span></h4><div class="fh"><span>Time s</span><span>ID</span><span>Message</span><span>DLC</span><span>Data</span></div>${rows}</div>
      <div class="card sigs"><h4><span>EngineData · 0x0C4</span><span>4 signals</span></h4>${sig}</div>
      <div class="card plot"><h4><span>EngineSpeed over time</span><span>rpm</span></h4><svg viewBox="0 0 700 150" preserveAspectRatio="none"><g class="grid"><path d="M0 30H700M0 75H700M0 120H700"/></g><polyline class="pl" points="${pts}"/></svg>
        <div class="ax mono"><span>0.0 s</span><span>0.5 s</span><span>1.0 s</span></div></div></div>
  </section>`;
}

function pdfWindow() {
  const outline = PDF_OUTLINE.map((o, i) => `<div class="on-row ${i === 4 ? 'cur' : ''} ${o.includes('.') ? 'sub' : ''}">${o}</div>`).join('');
  return `<section class="viewer pdfv" style="left:12px;top:64px;width:1576px;height:754px">
    <div class="v-head"><span class="k-pdf">${icon('book')}</span><span class="file">transceiver_xc210.pdf</span><span class="facts">48 pages · page 17</span>
      <div class="findbox">${icon('search')}<span class="mono">wake-up</span><span class="fc">3 of 11</span></div><div class="seg"><span>Fit</span><span class="on">100%</span></div></div>
    <div class="navdrawer open"><div class="ndh">Outline <span class="kbd">Ctrl+B</span></div>${outline}</div>
    <div class="paper"><div class="ph">XC-210 · High-speed CAN transceiver</div><h1>3.2 Wake-up</h1>
      <p>The transceiver leaves Sleep mode when a <mark>wake-up</mark> pattern is seen on the bus: two dominant phases of at least t<sub>wake</sub>, separated by a recessive phase. See <u>Figure 9</u> and <u>Table 12</u>.</p>
      <svg class="timing" viewBox="0 0 520 90"><path d="M0 20H60V70H170V20H230V70H360V20H520" /><text x="72" y="88">t wake</text><text x="242" y="88">t wake</text></svg>
      <table><tr><th>Parameter</th><th>Min</th><th>Typ</th><th>Max</th></tr><tr><td>t<sub>wake</sub> dominant time</td><td>0.5 µs</td><td>1.0 µs</td><td>1.8 µs</td></tr><tr><td>Wake-up delay</td><td>–</td><td>18 µs</td><td>40 µs</td></tr><tr><td>Sleep current</td><td>–</td><td>8 µA</td><td>15 µA</td></tr></table>
      <p class="small">Table 12. Wake-up timing. Conditions in <u>section 4</u>.</p></div>
  </section>`;
}

export default {
  id: 'viewers',
  dur: 20.4,
  captions: [[0.6, 5.3, 'Build output, read like a map.'], [10.0, 12.6, 'Every viewer opens calm. Rich when you ask.', 'Planned · beta'], [14.6, 16.6, 'CAN traces, decoded with your DBC.', 'Planned · beta'], [18.2, 19.8, 'PDF manuals, with links and an outline.']],
  keys: [[10.2, 'Alt V'], [11.3, 'Esc'], [11.7, 'Ctrl B']],
  build() {
    const node = el('<div class="scene-root"><div class="world"></div></div>');
    const world = node.firstChild;
    const wins = POS.map(([dx, dy]) => {
      const w = appWindow('wallwin');
      w.style.left = `${WIN.x + dx}px`; w.style.top = `${WIN.y + dy}px`;
      world.append(w);
      return w;
    });
    const elf = elfViewer();
    wins[0].append(elf.node);
    wins[1].insertAdjacentHTML('beforeend', codeWindow());
    wins[2].insertAdjacentHTML('beforeend', canWindow());
    wins[3].insertAdjacentHTML('beforeend', pdfWindow());
    const q = (s) => world.querySelector(s);
    return { node, world, wins, elf, paper: q('.paper'), menu: q('.viewmenu'), nav: q('.codev .navdrawer'), pl: q('.pl'), frames: [...world.querySelectorAll('.fr')] };
  },
  render(r, t) {
    const c = cam(t);
    r.world.style.transform = `translate(960px, 540px) scale(${c.s.toFixed(5)}) translate(${(-c.fx).toFixed(3)}px, ${(-c.fy).toFixed(3)}px)`;
    const v = r.elf;
    const o0 = 0.1;
    v.cards.forEach((card, i) => {
      const p = prog(t, o0 + 0.12 + i * 0.08, 0.5);
      put(card, p, `translateY(${(1 - p) * 10}px)`);
    });
    v.regBars.forEach((bar, ri) => [...bar.children].forEach((part, j) => {
      part.style.transform = `scaleX(${prog(t, o0 + 0.4 + ri * 0.09 + j * 0.06, 0.8)})`;
    }));
    v.blocks.forEach((b, i) => {
      const p = prog(t, o0 + 0.7 + i * 0.035, 0.45);
      put(b, p, `scaleY(${mix(0.6, 1, p)})`);
    });
    v.tiles.forEach((n, i) => {
      const p = prog(t, o0 + 0.9 + i * 0.05, 0.55);
      put(n, p, `scale(${mix(0.96, 1, p)})`);
    });
    const m = prog(t, 10.25, 0.18) * (1 - prog(t, 11.35, 0.15));
    put(r.menu, m, `translateY(${(1 - m) * -6}px) scale(${mix(0.97, 1, m)})`);
    const nav = prog(t, 11.75, 0.45, ease.drawer);
    put(r.nav, nav > 0.001 ? 1 : 0, `translateX(${((1 - nav) * -340).toFixed(2)}px)`);
    r.pl.style.strokeDashoffset = (1400 * (1 - prog(t, 6.7, 1.6, ease.inOut))).toFixed(1);
    r.frames.forEach((f, i) => put(f, prog(t, 6.6 + i * 0.04, 0.35), ''));
    const lit = clamp01((t - 17.4) / 1.8);
    r.paper.style.opacity = (0.5 + 0.5 * lit * lit * (3 - 2 * lit)).toFixed(4);
  },
};
