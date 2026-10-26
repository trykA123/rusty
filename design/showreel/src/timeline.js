import { ease, mix } from './ease.js';
import { put, clamp01 } from './dom.js';
import { XF } from './script.js';
import { buildOverlay, renderOverlay } from './overlay.js';
import brand from './scenes/brand.js';
import panes from './scenes/panes.js';
import tiles from './scenes/tiles.js';
import sets from './scenes/sets.js';
import search from './scenes/search.js';
import find from './scenes/find.js';
import copy from './scenes/copy.js';
import rename from './scenes/rename.js';
import safety from './scenes/safety.js';
import drawer from './scenes/drawer.js';
import compare from './scenes/compare.js';
import viewers from './scenes/viewers.js';
import plugins from './scenes/plugins.js';
import themes from './scenes/themes.js';
import outro from './scenes/outro.js';

const CHAPTERS = {
  panes: '01 Panes', search: '02 Speed and search', copy: '03 Operations and safety', drawer: '04 The drawer',
  viewers: '05 Viewers', plugins: '06 Plugins', themes: '07 Look and feel',
};

const SCENES = [brand, panes, tiles, sets, search, find, copy, rename, safety, drawer, compare, viewers, plugins, themes, outro];

let at = 0;
SCENES.forEach((s, i) => {
  s.xfIn = i === 0 ? 0 : s.xf ?? XF;
  at -= s.xfIn;
  s.start = Math.max(0, at);
  at = s.start + s.dur;
});
export const DURATION = at;

const smooth = (x) => { const v = clamp01(x); return v * v * (3 - 2 * v); };

export function build(stage) {
  const refs = SCENES.map((s) => {
    const r = s.build();
    r.node.classList.add('scene');
    stage.append(r.node);
    return r;
  });
  const shift = (s, list) => (list ?? []).map(([a, ...rest]) => [a + s.start, ...rest]);
  const captions = SCENES.flatMap((s) => (s.captions ?? []).map(([a, b, ...rest]) => [a + s.start, b + s.start, ...rest]));
  const keys = SCENES.flatMap((s) => shift(s, s.keys));
  const chapters = SCENES.filter((s) => CHAPTERS[s.id]).map((s) => {
    const [n, ...title] = CHAPTERS[s.id].split(' ');
    return { n, title: title.join(' '), at: s.start + 0.2 };
  });
  return { refs, overlay: buildOverlay(stage, { captions, keys, chapters }) };
}

export function renderFrame(b, t) {
  SCENES.forEach((s, i) => {
    const node = b.refs[i].node;
    const lt = t - s.start;
    const next = SCENES[i + 1];
    if (lt < 0 || lt >= s.dur) { node.style.display = 'none'; return; }
    node.style.display = '';
    const pin = s.xfIn ? smooth(lt / s.xfIn) : 1;
    const outStart = next ? s.dur - next.xfIn : Infinity;
    const pout = next ? smooth((lt - outStart - next.xfIn * 0.35) / (next.xfIn * 0.65)) : 0;
    const settle = s.xfIn ? ease.out(clamp01(lt / (s.xfIn * 1.6))) : 1;
    put(node, pin * (1 - pout), `scale(${mix(1.012, 1, settle).toFixed(5)})`);
    const blur = 5 * Math.max(1 - pin, pout);
    node.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
    node.style.zIndex = String(i);
    s.render(b.refs[i], lt);
  });
  renderOverlay(b.overlay, t);
}
