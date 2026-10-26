import { prog, mix, ease } from '../ease.js';
import { el, put, text } from '../dom.js';
import { appWindow, pane, setCursor, RIGHT_X } from '../chrome.js';
import { icon } from '../icons.js';
import { PHOTOS, EXPORTS, NAS, SETS, PINS } from '../data-roadmap.js';
import { buildQuad, layoutQuad } from './tiles.js';
import { active } from './common.js';

const T = { hud: 0.95, pick: 2.4, swap: 2.85, pinsOpen: 5.85, jump: 6.9 };

function thumb(layout) {
  const cells = {
    quad: [[0, 0, 49, 100], [51, 0, 24, 100], [77, 0, 23, 48], [77, 52, 23, 48]],
    two: [[0, 0, 49, 100], [51, 0, 49, 100]],
    three: [[0, 0, 32, 100], [34, 0, 32, 100], [68, 0, 32, 100]],
    main: [[0, 0, 62, 100], [64, 0, 36, 48], [64, 52, 36, 48]],
  }[layout];
  return `<div class="thumb">${cells.map(([x, y, w, h]) => `<i style="left:${x}%;top:${y}%;width:${w}%;height:${h}%"></i>`).join('')}</div>`;
}

export default {
  id: 'sets',
  dur: 10,
  captions: [[0.8, 4.9, 'Saved sets of panes, on Alt+1 to Alt+9.', 'Planned · beta'], [5.5, 9.4, 'Pinned folders, on Ctrl+1 to Ctrl+9.', 'Planned']],
  keys: [[0.9, 'Alt'], [2.4, 'Alt 2'], [5.4, 'Ctrl'], [6.9, 'Ctrl 4']],
  build() {
    const node = el('<div class="scene-root"></div>');
    const win = appWindow();
    const quadGroup = el('<div class="group"></div>');
    const q = buildQuad(quadGroup);
    layoutQuad(q, 1, 1);
    ['a', 'b', 'c', 'd'].forEach((k, i) => setCursor(q[k], [2, 0, 3, 4][i], k === 'a' ? 1 : 0.4));
    Object.assign(q.ring.style, { left: '12px', top: '64px', width: '782px', height: '754px' });
    const photoGroup = el('<div class="group"></div>');
    const left = pane(PHOTOS, { x: 12 });
    const nas = pane(NAS, { x: 12 });
    const right = pane(EXPORTS, { x: RIGHT_X });
    photoGroup.append(left.node, nas.node, right.node);
    const hud = el(`<div class="sethud"><div class="hudtitle">Sets</div><div class="cards">${SETS.map((s) => `<div class="setcard">
      ${thumb(s.layout)}<div class="sn">${s.name}</div><div class="ss">${s.sub}</div><span class="kbd">Alt+${s.key}</span></div>`).join('')}<div class="hudsel"></div></div></div>`);
    const pins = el(`<div class="popover pins"><div class="pophead">${icon('pin')}Pinned</div>${PINS.map((p) => `<div class="pinrow">
      <span class="k-${p.icon}">${icon(p.icon)}</span><span class="pn">${p.name}</span><span class="pp">${p.path}</span>${p.key ? `<span class="kbd">${p.key}</span>` : ''}</div>`).join('')}
      <div class="pinsel"></div></div>`);
    win.append(quadGroup, photoGroup, hud, pins);
    node.append(win);
    return { node, quadGroup, photoGroup, left, nas, right, hud, sel: hud.querySelector('.hudsel'), cards: [...hud.querySelectorAll('.setcard')], pins, pinsel: pins.querySelector('.pinsel'), pinrows: [...pins.querySelectorAll('.pinrow')] };
  },
  render(r, t) {
    const hud = prog(t, T.hud, 0.25) * (1 - prog(t, T.swap, 0.2));
    put(r.hud, hud, `translate(-50%, -50%) scale(${mix(0.97, 1, hud)})`);
    r.cards.forEach((c, i) => put(c, prog(t, T.hud + 0.05 + i * 0.05, 0.35), `translateY(${(1 - prog(t, T.hud + 0.05 + i * 0.05, 0.35)) * 8}px)`));
    const pick = prog(t, T.pick, 0.22, ease.inOut);
    r.sel.style.transform = `translateX(${(pick * 284).toFixed(2)}px)`;
    const sw = prog(t, T.swap, 0.45);
    put(r.quadGroup, 1 - sw, `scale(${mix(1, 0.985, sw)})`);
    put(r.photoGroup, sw, `scale(${mix(1.01, 1, sw)})`);
    active(r.left, r.right, 'left');
    active(r.nas, r.right, 'left');
    setCursor(r.left, 1); setCursor(r.nas, 3); setCursor(r.right, 0, 0.4);

    const po = prog(t, T.pinsOpen, 0.2) * (1 - prog(t, T.jump + 0.15, 0.18));
    put(r.pins, po, `translateY(${(1 - po) * -6}px) scale(${mix(0.97, 1, po)})`);
    r.pinrows.forEach((row, i) => put(row, prog(t, T.pinsOpen + 0.04 + i * 0.04, 0.3), ''));
    r.pinsel.style.transform = `translateY(${(3 * 40 * prog(t, T.jump - 0.25, 0.2, ease.inOut)).toFixed(2)}px)`;
    const j = prog(t, T.jump + 0.2, 0.35);
    put(r.left.node, 1 - j, '');
    put(r.nas.node, j, '');
    r.nas.rows.forEach((row, i) => {
      const v = prog(t, T.jump + 0.25 + i * 0.035, 0.4);
      put(row.el, v, `translateY(${i * 30 + (1 - v) * 6}px)`);
    });
    text(r.right.foot, EXPORTS.foot);
  },
};
