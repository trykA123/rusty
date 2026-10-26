import { keyed } from './ease.js';

export const clamp01 = (v) => Math.min(1, Math.max(0, v));

export const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};

export function put(node, o = 1, transform = '') {
  node.style.opacity = o <= 0.001 ? '0' : o.toFixed(4);
  node.style.transform = transform;
}

export function camera(node, keys, t) {
  const c = keyed(t, keys);
  node.style.transform = `translate(960px, 540px) scale(${c.s.toFixed(5)}) translate(${(-c.fx).toFixed(3)}px, ${(-c.fy).toFixed(3)}px)`;
}

export function text(node, value) {
  if (node.textContent !== value) node.textContent = value;
}

export function html(node, value) {
  if (node.__html !== value) { node.innerHTML = value; node.__html = value; }
}
