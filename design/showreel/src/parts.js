import { PALETTE, SHEET, ELF } from './data.js';
import { icon } from './icons.js';
import { el } from './dom.js';
import { PANE_H } from './chrome.js';

function hitHtml(h, top = false) {
  return `<div class="hit ${top ? 'top' : ''}"><span class="k-${h.icon}">${icon(h.icon)}</span>
    <span class="lbl" data-label="${h.label}">${h.label}</span><span class="meta">${h.meta}</span>
    ${h.key ? `<span class="kbd">${h.key}</span>` : ''}</div>`;
}

function resultSet(set, topName) {
  const groups = set.groups.map(([g, hits]) => `<div class="grp">${g}</div>${hits.map((h) => hitHtml(h)).join('')}`).join('');
  return el(`<div class="set"><div class="grp">${topName}</div>${hitHtml(set.top, true)}${groups}</div>`);
}

export function palette() {
  const node = el(`<div class="palette" style="left:420px;top:60px">
    <div class="input">${icon('search')}<span class="typed"></span><span class="caret"></span><span class="ph">Search files, folders and commands</span><span class="kbd">Esc</span></div>
    <div class="results"></div>
    <div class="pfoot"><span class="count"></span><span class="sp"></span>
      <span><span class="kbd">Enter</span> open</span><span><span class="kbd">Shift+Enter</span> reveal</span><span><span class="kbd">Esc</span> close</span></div>
  </div>`);
  const results = node.querySelector('.results');
  const commands = resultSet(PALETTE.commands, 'Top hit');
  const files = resultSet(PALETTE.files, 'Top hit · disk index');
  results.append(commands, files);
  return {
    node, commands, files,
    typed: node.querySelector('.typed'), caret: node.querySelector('.caret'), ph: node.querySelector('.ph'),
    count: node.querySelector('.count'), labels: [...node.querySelectorAll('.lbl')],
  };
}

export function folderSheet() {
  const tree = SHEET.tree.map((r) => `<div class="tr ${r.dir ? 'dir' : ''}" style="padding-left:${r.depth * 24}px">
    <span class="${r.dir ? 'k-dir' : 'k-code'}">${icon(r.dir ? 'dir' : 'code')}</span>${r.name}<span class="sz">${r.size ?? ''}</span></div>`).join('');
  const tiles = SHEET.stats.map((s) => `<div class="tile"><div class="tl">${s.label}</div><div class="tv">0</div></div>`).join('');
  const types = SHEET.types.map((ty) => `<div class="ty"><span class="mono">${ty.ext}</span><span class="n mono">${ty.count}</span>
    <span class="n mono">${ty.size}</span><span class="track"><i style="background:oklch(68% 0.1 ${ty.hue}); width:${ty.share * 100}%"></i></span></div>`).join('');
  const node = el(`<aside class="sheet" style="left:806px;top:64px;width:782px;height:${PANE_H}px">
    <div class="sh-head"><div class="sh-icon">${icon('dir')}</div><div><div class="sh-name">${SHEET.name}</div><div class="sh-path">${SHEET.path}</div></div>
      <span class="badge">Folder</span><span class="sh-close kbd">Esc</span></div>
    <h3><span>Contents</span><span>3 items</span></h3><div class="tree">${tree}</div>
    <div class="tiles">${tiles}</div>
    <h3><span>By type</span><span>4 kinds</span></h3><div class="types">${types}</div>
  </aside>`);
  return {
    node, tree: [...node.querySelectorAll('.tr')], tiles: [...node.querySelectorAll('.tile')],
    values: [...node.querySelectorAll('.tv')], bars: [...node.querySelectorAll('.track i')], types: [...node.querySelectorAll('.ty')],
  };
}

export function elfViewer(rect = { x: 12, y: 64, w: 1576, h: PANE_H }) {
  const regions = ELF.regions.map((r) => `<div class="reg"><div><div class="rn">${r.name}</div><div class="ra">${r.at}</div></div>
    <div class="rbar">${r.parts.map(([k, w]) => `<i class="m-${k}" style="width:${w}%"></i>`).join('')}</div>
    <div class="ru">${r.pct}% <span>of ${r.size}</span></div></div>`).join('');
  const legend = ['code', 'rodata', 'data', 'bss', 'gap'].map((k) => `<span><i class="m-${k}"></i>${k === 'gap' ? 'free' : k}</span>`).join('');
  const strip = ELF.strip.map(([k, w]) => `<i class="m-${k}" style="flex:${w} 0 0"></i>`).join('');
  const marks = ELF.stripMarks.map(([a, at]) => `<span style="left:${at}%">${a}</span>`).join('');
  const tiles = ELF.modules.map((m) => `<div class="tt" style="left:${m.x}%;top:${m.y}%;width:${m.w}%;height:${m.h}%;--h:${m.hue}">
    <div><b>${m.name}</b><span>${m.size}</span><span>${m.share}</span></div></div>`).join('');
  const symbols = ELF.symbols.map(([n, sec, size]) => `<div class="sym"><span class="mono">${n}</span><span class="sec mono">${sec}</span><span class="r mono">${size}</span></div>`).join('');
  const node = el(`<section class="viewer" style="left:${rect.x}px;top:${rect.y}px;width:${rect.w}px;height:${rect.h}px">
    <div class="v-head"><span class="k-code">${icon('code')}</span><span class="file">${ELF.file}</span><span class="facts">${ELF.facts}</span>
      <div class="seg"><span>Simple</span><span class="on">Rich</span></div></div>
    <div class="v-body">
      <div class="card"><h4><span>Memory regions</span><span>4 regions · 3.36 MB used</span></h4>${regions}</div>
      <div class="card" style="grid-row: span 3"><h4><span>Who uses the flash</span><span>2.11 MB</span></h4><div class="tmap">${tiles}</div></div>
      <div class="card"><h4><span>Address map</span><div class="legend">${legend}</div></h4><div class="mstrip">${strip}</div><div class="marks">${marks}</div></div>
      <div class="card"><h4><span>Largest symbols</span><span>1,842 symbols</span></h4>${symbols}</div>
    </div>
  </section>`);
  return {
    node, regs: [...node.querySelectorAll('.reg')], regBars: [...node.querySelectorAll('.rbar')],
    blocks: [...node.querySelectorAll('.mstrip i')], tiles: [...node.querySelectorAll('.tt')], cards: [...node.querySelectorAll('.card')],
  };
}

export function jobStrip(label, done) {
  const node = el(`<div class="strip" style="left:24px;top:${64 + PANE_H - 56}px;width:1552px">
    <span class="k-cmd">${icon('copy')}</span><span class="label">${label}</span>
    <span class="bar"><span class="fill"></span></span><span class="nums mono"></span>
    <div class="done">${icon('check')}<span class="dl">${done}</span></div></div>`);
  return { node, fill: node.querySelector('.fill'), nums: node.querySelector('.nums'), done: node.querySelector('.done'), dl: node.querySelector('.dl'), label: node.querySelector('.label') };
}

export function noticeStrip() {
  const node = el(`<div class="strip notice" style="left:24px;top:${64 + PANE_H - 56}px;width:1552px">
    <span class="nicon"></span><span class="label"></span><span class="sp"></span><span class="hint"></span></div>`);
  return { node, icon: node.querySelector('.nicon'), label: node.querySelector('.label'), hint: node.querySelector('.hint') };
}
