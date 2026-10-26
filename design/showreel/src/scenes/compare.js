import { prog, ease, mix } from '../ease.js';
import { el, put, text } from '../dom.js';
import { appWindow } from '../chrome.js';
import { icon } from '../icons.js';
import { COMPARE, DIFF } from '../data-roadmap.js';
import { cursorIndex } from './common.js';

const T = { reveal: 0.45, open: 4.45, hunk: 6.4, copy: 7.5 };
const GLYPH = { diff: '≠', left: '◂', right: '▸', same: '' };
const BEFORE = [[36, 'static can_bus_t buses[2];'], [37, ''], [38, '#include "can_if.h"'], [39, '#include "diag_dtc.h"'], [40, '']];
const AFTER = [[53, 'void can_if_init(void)'], [54, '{'], [55, '    can_last_rx_ms = 0u;'], [56, '    buses[0] = can_open(CAN_A);'], [57, '    buses[1] = can_open(CAN_B);'], [58, '}']];

function side(row, s) {
  const [kind, name, status, depth, ls, rs, delta] = row;
  const present = status === 'same' || status === 'diff' || (status === 'left' && s === 'l') || (status === 'right' && s === 'r');
  if (!present) return '<div class="crow gap"></div>';
  const size = s === 'l' ? ls : rs;
  const ch = status === 'diff' || status === 'left' || status === 'right';
  const kicon = kind === 'dir' ? 'dir' : kind;
  return `<div class="crow st-${status}" style="--d:${depth}"><span class="k-${kicon}">${icon(kicon)}</span><span class="cn">${name}</span>
    ${ch ? `<span class="cg">${GLYPH[status]}</span>` : ''}${delta && s === 'r' ? `<span class="cdelta mono">${delta}</span>` : ''}<span class="csz mono">${size ?? ''}</span></div>`;
}

function mark(textv, word, cls) {
  if (!word) return textv;
  const at = textv.indexOf(word);
  return at < 0 ? textv : `${textv.slice(0, at)}<em class="${cls}">${word}</em>${textv.slice(at + word.length)}`;
}

function diffLines() {
  const rows = [...BEFORE.map(([n, c]) => [n, n, 'same', c, c]), ...DIFF, ...AFTER.map(([n, c]) => [n - 1, n, 'same', c, c])];
  const l = [], r = [];
  rows.forEach(([ln, rn, st, lt, rt, words]) => {
    const lcls = st === 'chg' ? 'chg' : st === 'del' ? 'del' : st === 'add' ? 'gapl' : '';
    const rcls = st === 'chg' ? 'chg' : st === 'add' ? 'add' : st === 'del' ? 'gapl' : '';
    l.push(`<div class="dl ${lcls}"><span class="ln">${ln ?? ''}</span><span class="lc">${lt === null || lt === undefined ? '' : mark(lt, words?.[0], 'wd')}</span></div>`);
    r.push(`<div class="dl ${rcls}"><span class="ln">${rn ?? ''}</span><span class="lc">${rt === null || rt === undefined ? '' : mark(rt, words?.[1], 'wa')}</span></div>`);
  });
  return { l: l.join(''), r: r.join(''), n: rows.length };
}

export default {
  id: 'compare',
  dur: 10,
  captions: [[0.8, 4.3, 'Compare folders, branches and repositories.', 'Planned · 1.0'], [5.0, 9.4, 'See every changed word. Copy a hunk across.', 'Planned · 1.0']],
  keys: [[0.3, 'Ctrl Shift D'], [1.8, 'Alt Down'], [2.6, 'Alt Down'], [3.4, 'Alt Up'], [4.4, 'Enter'], [6.4, 'Alt Down'], [7.5, 'Ctrl Alt Left']],
  build() {
    const node = el('<div class="scene-root"></div>');
    const win = appWindow();
    const spine = COMPARE.map(([, , st], i) => `<i class="sp-${st}" style="--i:${i}"></i>`).join('');
    const cmp = el(`<div class="cmpview">
      <div class="ctool"><span class="cti">${icon('transfer')}</span><b>Compare</b><div class="seg"><span class="on">All 15</span><span>Differences 10</span><span>Same 5</span><span>Orphans 2</span></div>
        <span class="chip">${icon('git')}.gitignore · 1,284 ignored</span><span class="hashing">Checking contents · 2 left</span><span class="sp"></span><span class="chip">Leave <span class="kbd">Esc</span></span></div>
      <div class="cpanel l"><div class="cpath mono">${icon('dir')}D:\\src\\aurora</div><div class="cmplist"><div class="ccur"></div>${COMPARE.map((row) => side(row, 'l')).join('')}</div></div>
      <div class="cspine">${spine}<div class="cview"></div></div>
      <div class="cpanel r"><div class="cpath mono">${icon('git')}aurora @ release/1.0 <span class="ro">${icon('lock')}read-only</span></div><div class="cmplist"><div class="ccur"></div>${COMPARE.map((row) => side(row, 'r')).join('')}</div></div>
      <div class="cfoot"><span>10 different · 1 left only · 1 right only · 5 same</span><span class="sp"></span><span><span class="kbd">Enter</span> open</span><span><span class="kbd">Alt+Down</span> next difference</span><span><span class="kbd">Ctrl+Alt+Left</span> copy to left</span></div>
    </div>`);
    const dl = diffLines();
    const diff = el(`<section class="diffview">
      <div class="v-head"><span class="k-code">${icon('code')}</span><span class="file">can_if.c</span><span class="facts mono">D:\\src\\aurora ⟷ release/1.0</span><span class="chip add">+14</span><span class="chip del">−9</span><span class="edited chip">Edited · <span class="kbd">Ctrl+S</span> save</span>
        <div class="seg"><span>Simple</span><span class="on">Rich</span><span>Custom</span></div></div>
      <div class="dcols"><div class="dcol l"><div class="dhdr mono">D:\\src\\aurora\\src\\can\\can_if.c</div><div class="dlines">${dl.l}<div class="dcopy" style="top:360px"><div class="dl add"><span class="ln">47</span><span class="lc">        can_if_reset_bus(bus);</span></div><div class="dl add"><span class="ln">48</span><span class="lc">        diag_dtc_set(DTC_CAN_TIMEOUT);</span></div></div></div></div>
        <div class="dcol r"><div class="dhdr mono">release/1.0 · src/can/can_if.c</div><div class="dlines">${dl.r}</div></div>
        <div class="dmap"><i style="top:18%;height:3%" class="chg"></i><i style="top:26%;height:3%" class="chg"></i><i style="top:34%;height:6%" class="add"></i><i style="top:52%;height:3%" class="chg"></i><i style="top:71%;height:2%" class="chg"></i><div class="dthumb"></div></div>
        <div class="dhunk"></div></div>
    </section>`);
    win.append(cmp, diff);
    node.append(win);
    return {
      node, cmp, diff, rows: [...cmp.querySelectorAll('.crow')], curs: [...cmp.querySelectorAll('.ccur')], spine: [...cmp.querySelectorAll('.cspine i')],
      hunk: diff.querySelector('.dhunk'), dcopy: diff.querySelector('.dcopy'), edited: diff.querySelector('.edited'),
      dels: [...diff.querySelectorAll('.dcol.l .dl.del, .dcol.l .dl.gapl')],
    };
  },
  render(r, t) {
    const n = COMPARE.length;
    r.rows.forEach((row, i) => {
      const k = i % n;
      const v = prog(t, T.reveal + k * 0.04, 0.4);
      put(row, v, `translateY(${(k * 30 + (1 - v) * 6).toFixed(2)}px)`);
    });
    r.spine.forEach((s, i) => s.style.transform = `scaleX(${prog(t, T.reveal + 0.3 + i * 0.04, 0.4).toFixed(4)})`);
    const ci = cursorIndex(t, [[1.8, 3], [2.6, 5], [3.4, 3]], 0);
    r.curs.forEach((c) => { c.style.transform = `translateY(${(ci * 30).toFixed(2)}px)`; });

    const o = prog(t, T.open, 0.35);
    put(r.diff, o, `scale(${mix(0.97, 1, o)})`);
    put(r.cmp, 1 - prog(t, T.open + 0.1, 0.3), '');
    const hy = cursorIndex(t, [[T.hunk, 1]], 0);
    r.hunk.style.transform = `translateY(${(mix(7, 11, hy) * 30).toFixed(2)}px) scaleY(${mix(1, 3, prog(t, T.hunk, 0.25, ease.inOut)).toFixed(3)})`;
    const cp = prog(t, T.copy + 0.1, 0.35);
    put(r.dcopy, cp, '');
    r.dels.forEach((d) => { d.style.opacity = (1 - cp).toFixed(3); });
    put(r.edited, cp, '');
  },
};
