import { prog, ease, mix } from '../ease.js';
import { el, put, text, clamp01 } from '../dom.js';
import { appWindow, pane, setCursor, RIGHT_X, seeded } from '../chrome.js';
import { icon } from '../icons.js';
import { LEFT, RIGHT } from '../data.js';
import { JOBS, CLIPS, TERM } from '../data-roadmap.js';
import { ROW } from '../script.js';
import { active, cursorIndex } from './common.js';

const T = { open: 0.85, sel: 2.4, reorder: 3.0, clip: 5.0, clipSel: 6.5, term: 8.0, esc: 10.8, enter: 11.5 };
const TABS = [['transfer', 'Transfers'], ['clipboard', 'Clipboard'], ['search', 'Search'], ['diff', 'Compare'], ['terminal', 'Terminal'], ['note', 'Notes']];
const TAB_X = [0, 136, 270, 384, 512, 640];
const TAB_W = [124, 122, 102, 116, 116, 96];
const DR = { x: 12, y: 404, w: 1576, h: 414 };

function spark(seed) {
  const rnd = seeded(seed);
  const pts = Array.from({ length: 40 }, (_, i) => `${(i * 160 / 39).toFixed(1)},${(30 - 8 - rnd() * 14 - Math.sin(i / 5) * 4).toFixed(1)}`);
  return `<svg class="spark" viewBox="0 0 160 30" preserveAspectRatio="none"><polyline points="${pts.join(' ')}"/></svg>`;
}

const TOOLS = { tabs: ['tools', 'Downloads'], crumbs: ['D:', 'Work', 'aurora', 'tools'], drive: 'D: Work', foot: '4 files · 38 KB', free: '209 GB free',
  rows: [{ name: '..', kind: 'up' }, { name: 'can_replay', ext: 'py', kind: 'code', size: '9 KB', date: '2026-10-12 17:03' },
    { name: 'flash', ext: 'py', kind: 'code', size: '14 KB', date: '2026-10-11 10:20' }, { name: 'gen_dbc', ext: 'py', kind: 'code', size: '6 KB', date: '2026-10-09 15:40' },
    { name: 'make_release', ext: 'cmd', kind: 'code', size: '2 KB', date: '2026-10-15 07:12' }] };

export default {
  id: 'drawer',
  dur: 14,
  captions: [[1.0, 7.6, 'One drawer for transfers, clipboard, search and more.', 'Planned'], [8.2, 13.4, 'A terminal that follows the pane you are in.', 'Planned · 2.0']],
  keys: [[0.8, 'F9'], [2.4, 'Down'], [3.0, 'Ctrl Up'], [5.0, 'Ctrl Tab'], [6.5, 'Down'], [7.95, 'Ctrl `'], [10.8, 'Esc'], [11.0, 'Down'], [11.12, 'Down'], [11.24, 'Down'], [11.5, 'Enter']],
  build() {
    const node = el('<div class="scene-root"></div>');
    const win = appWindow();
    const left = pane(LEFT, { x: 12 });
    const tools = pane(TOOLS, { x: 12 });
    const right = pane({ ...RIGHT, rows: RIGHT.rows.filter((row) => !row.copy) }, { x: RIGHT_X });
    const jobs = JOBS.map((j, i) => `<div class="job" data-i="${i}"><span class="k-cmd ji">${icon(j.icon)}</span>
      <div class="jt"><div class="jl">${j.label}</div><div class="jm">${j.mode}</div></div>
      <div class="jbar"><i></i></div><span class="jn mono"></span>${spark(7 + i)}<span class="jchip"></span></div>`).join('');
    const clips = CLIPS.map((c) => `<div class="clip"><span class="k-${c.k}">${icon(c.icon)}</span><span class="ck">${c.kind}</span><span class="ctext mono">${c.text}</span><span class="cm">${c.meta}</span></div>`).join('');
    const term = TERM.map((l) => `<div class="tl ${l[0]}">${l[0] === 'p' ? `<span class="pr">${l[1]}</span> <span class="cmd"></span>` : l[1]}</div>`).join('');
    const drawer = el(`<section class="drawer" style="left:${DR.x}px;top:${DR.y}px;width:${DR.w}px;height:${DR.h}px">
      <div class="dtabs">${TABS.map(([ic, l], i) => `<div class="dtab" style="left:${16 + TAB_X[i]}px;width:${TAB_W[i]}px">${icon(ic)}${l}</div>`).join('')}
        <div class="dtab add" style="left:${16 + 750}px">${icon('plus')}</div><div class="dind"></div><span class="dkey"><span class="kbd">F9</span> hide</span></div>
      <div class="dview transfers"><div class="jsel"></div>${jobs}<div class="dhint"><span><span class="kbd">Space</span> pause</span><span><span class="kbd">Ctrl+Up</span> run first</span><span><span class="kbd">Del</span> cancel</span></div></div>
      <div class="dview clips"><div class="clist"><div class="csel"></div>${clips}</div><div class="cprev"><div class="cpt">flash_layout.png</div><div class="cimg">${[['code', 38], ['rodata', 18], ['data', 6], ['bss', 12], ['gap', 26]].map(([k, w]) => `<i class="m-${k}" style="flex:${w} 0 0"></i>`).join('')}</div><div class="cpm mono">1280 × 720 · PNG · 340 KB</div></div></div>
      <div class="dview term"><div class="tbody">${term}<div class="tl p extra"><span class="pr">D:\\Work\\aurora&gt;</span> <span class="cmd">cd /d D:\\Work\\aurora\\tools</span></div><div class="tl p extra2"><span class="pr">D:\\Work\\aurora\\tools&gt;</span> <span class="cmd"></span><span class="tcaret"></span></div></div>
        <div class="tside"><div class="tsl">Follows</div><div class="tsv">${icon('dir')}<span class="tf">left pane</span></div><div class="tsl">Shell</div><div class="tsv">${icon('terminal')}PowerShell 7</div></div></div>
    </section>`);
    win.append(left.node, tools.node, right.node, drawer);
    node.append(win);
    const q = (s) => drawer.querySelector(s);
    return {
      node, left, tools, right, drawer, ind: q('.dind'), tabs: [...drawer.querySelectorAll('.dtab')],
      views: [q('.transfers'), q('.clips'), q('.term')], jobs: [...drawer.querySelectorAll('.job')], jsel: q('.jsel'),
      clips: [...drawer.querySelectorAll('.clip')], csel: q('.csel'), cprev: q('.cprev'),
      tl: [...drawer.querySelectorAll('.tl')], cmd: drawer.querySelector('.tl.p .cmd'), extra: q('.extra'), extra2: q('.extra2'), tf: q('.tf'),
    };
  },
  render(r, t) {
    const toolsIn = prog(t, T.enter + 0.05, 0.3);
    active(r.left, r.right, 'left');
    active(r.tools, r.right, 'left');
    put(r.left.node, 1 - toolsIn, ''); put(r.tools.node, toolsIn, '');
    setCursor(r.left, cursorIndex(t, [[11.0, 3], [11.12, 4], [11.24, 5]], 2), t < T.term || t > T.esc ? 1 : 0.4);
    setCursor(r.tools, 0, 1); setCursor(r.right, 0, 0.4);
    text(r.left.foot, '10 files, 5 folders · 71.2 MB');

    const open = prog(t, T.open, 0.5, ease.drawer);
    put(r.drawer, open > 0.001 ? 1 : 0, `translateY(${((1 - open) * (DR.h + 30)).toFixed(2)}px)`);
    const tab = t >= T.term ? 4 : t >= T.clip ? 1 : 0;
    const prevTab = t >= T.term ? 1 : 0;
    const at = t >= T.term ? T.term : T.clip;
    const tp = t >= T.clip ? prog(t, at, 0.3, ease.inOut) : 1;
    const x = mix(TAB_X[prevTab], TAB_X[tab], tp), w = mix(TAB_W[prevTab], TAB_W[tab], tp);
    r.ind.style.transform = `translateX(${(16 + x).toFixed(2)}px) scaleX(${(w / 100).toFixed(4)})`;
    r.tabs.forEach((tb, i) => tb.classList.toggle('on', i === tab));
    r.views.forEach((v, i) => {
      const idx = [0, 1, 4][i];
      const enter = idx === tab ? prog(t, idx === 0 ? 0 : at + 0.05, 0.3) : 0;
      const leave = idx === prevTab && tab !== idx ? 1 - prog(t, at, 0.15) : 0;
      const o = Math.max(enter, leave);
      put(v, o, `translateY(${(1 - enter) * (idx === tab ? 8 : 0)}px)`);
    });

    const swap = prog(t, T.reorder, 0.4, ease.inOut);
    const slots = [swap, 1 - swap, 2];
    r.jobs.forEach((j, i) => {
      j.style.transform = `translateY(${(slots[i] * 72).toFixed(2)}px)`;
      const p = [mix(0.38, 0.66, clamp01(t / 14)), clamp01((t - T.reorder - 0.3) / 9) * 0.82, 1][i];
      j.querySelector('.jbar i').style.transform = `scaleX(${p.toFixed(4)})`;
      const gb = JOBS[i].size;
      text(j.querySelector('.jn'), i === 2 ? '3 of 3 · 12.9 MB' : i === 1 && p === 0 ? 'Waiting for E:' : `${(p * gb).toFixed(2)} of ${gb} GB · ${Math.round(p * 100)}%`);
      text(j.querySelector('.jchip'), i === 2 ? 'Verified' : i === 1 && p === 0 ? 'Queued' : i === 0 ? '412 MB/s' : '96 MB/s');
      j.classList.toggle('done', i === 2);
      put(j, prog(t, T.open + 0.25 + i * 0.07, 0.4), j.style.transform);
    });
    r.jsel.style.transform = `translateY(${(cursorIndex(t, [[T.sel, 1], [T.reorder, 0]]) * 72).toFixed(2)}px)`;

    const cs = cursorIndex(t, [[T.clipSel, 2]], 1);
    r.csel.style.transform = `translateY(${(cs * 52).toFixed(2)}px)`;
    r.clips.forEach((c, i) => put(c, prog(t, T.clip + 0.1 + i * 0.05, 0.35), ''));
    const pv = prog(t, T.clipSel + 0.1, 0.3);
    put(r.cprev, pv, `translateX(${(1 - pv) * 12}px)`);

    const cmd = TERM[0][2];
    const typed = Math.round(clamp01((t - T.term - 0.4) / 0.9) * cmd.length);
    text(r.cmd, cmd.slice(0, typed));
    r.tl.forEach((l, i) => {
      if (i === 0) { put(l, 1, ''); return; }
      if (l.classList.contains('extra') || l.classList.contains('extra2')) return;
      put(l, prog(t, T.term + 1.5 + (i - 1) * 0.28, 0.2), '');
    });
    put(r.extra, prog(t, T.enter + 0.2, 0.2), '');
    put(r.extra2, prog(t, T.enter + 0.45, 0.2), '');
    r.tl[TERM.length - 1].style.display = t >= T.enter + 0.2 ? 'none' : '';
    text(r.tf, t >= T.enter + 0.2 ? 'left pane · tools' : 'left pane · aurora');
  },
};
