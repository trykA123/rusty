import { prog, life } from './ease.js';
import { el, put } from './dom.js';
import { icon, hasIcon } from './icons.js';

function keyGroups(keys) {
  const groups = [];
  for (const [at, label] of [...keys].sort((a, b) => a[0] - b[0])) {
    const last = groups[groups.length - 1];
    if (last && last.label === label && at - last.presses[last.presses.length - 1] < 0.6) last.presses.push(at);
    else groups.push({ label, presses: [at] });
  }
  return groups.map((g) => {
    const caps = g.label.split(' ').map((k) => `<span class="cap">${hasIcon(k) ? icon(k) : k}</span>`).join('');
    return { ...g, el: el(`<div class="keygroup">${caps}</div>`) };
  });
}

export function buildOverlay(root, { captions, keys, chapters }) {
  const overlay = el('<div id="overlay"><div class="topscrim"></div><div class="keys"></div></div>');
  const caps = captions.map(([a, b, words, tag]) => {
    const tagHtml = tag ? `<span class="tagchip">${tag}</span>` : '';
    const node = el(`<div class="caption">${words.split(' ').map((w) => `<span>${w} </span>`).join('')}${tagHtml}</div>`);
    overlay.append(node);
    return { a, b, node, words: [...node.children] };
  });
  const groups = keyGroups(keys);
  groups.forEach((k) => overlay.querySelector('.keys').append(k.el));
  const chaps = chapters.map((c) => {
    const node = el(`<div class="chapter"><span class="cn">${c.n}</span><span class="ct">${c.title}</span><i></i></div>`);
    overlay.append(node);
    return { ...c, node, line: node.querySelector('i') };
  });
  root.append(overlay);
  return { caps, groups, chaps, topscrim: overlay.querySelector('.topscrim') };
}

export function renderOverlay(o, t) {
  let scrim = 0;
  o.caps.forEach((c) => {
    const vis = t > c.a - 0.1 && t < c.b + 0.1;
    c.node.style.display = vis ? '' : 'none';
    if (!vis) return;
    c.words.forEach((w, i) => {
      const pin = prog(t, c.a + i * 0.05, 0.7);
      const out = prog(t, c.b - 0.45, 0.45);
      put(w, pin * (1 - out), `translateY(${(1 - pin) * 16 - out * 8}px)`);
    });
    scrim = Math.max(scrim, life(t, c.a, c.b, 0.6, 0.45));
  });
  o.chaps.forEach((c) => {
    const p = life(t, c.at, c.at + 4.2, 0.7, 0.6);
    put(c.node, p, `translateX(${(1 - prog(t, c.at, 0.8)) * -14}px)`);
    c.line.style.transform = `scaleX(${prog(t, c.at + 0.2, 3.6, (x) => Math.min(1, Math.max(0, x))).toFixed(4)})`;
  });
  put(o.topscrim, scrim, '');

  o.groups.forEach((k, gi) => {
    const first = k.presses[0], last = k.presses[k.presses.length - 1];
    const next = o.groups[gi + 1]?.presses[0] ?? Infinity;
    const exitAt = Math.min(last + 0.6, next - 0.14);
    if (t < first - 0.1 || t > exitAt + 0.3) { k.el.style.display = 'none'; return; }
    k.el.style.display = '';
    const inn = prog(t, first - 0.02, 0.18);
    const out = prog(t, exitAt, 0.22);
    let dip = 0;
    for (const at of k.presses) {
      const d = t - at;
      if (d >= 0 && d < 0.16) dip = Math.max(dip, Math.sin((Math.PI * d) / 0.16));
    }
    put(k.el, inn * (1 - out), `translateX(-50%) translateY(${(1 - inn) * 12 + out * 6 + dip * 3}px)`);
  });
}
