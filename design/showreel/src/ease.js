export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u) => ((ax * u + bx) * u + cx) * u;
  const sy = (u) => ((ay * u + by) * u + cy) * u;
  const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(u) - x;
      const d = dx(u);
      if (Math.abs(err) < 1e-6) return sy(u);
      if (Math.abs(d) < 1e-6) break;
      u -= err / d;
    }
    let lo = 0, hi = 1;
    u = x;
    for (let i = 0; i < 40; i++) {
      if (sx(u) < x) lo = u; else hi = u;
      u = (lo + hi) / 2;
    }
    return sy(u);
  };
}

export const ease = {
  out: bezier(0.23, 1, 0.32, 1),
  inOut: bezier(0.77, 0, 0.175, 1),
  drawer: bezier(0.32, 0.72, 0, 1),
  linear: (x) => Math.min(1, Math.max(0, x)),
};

export const mix = (a, b, p) => a + (b - a) * p;

export function prog(t, start, dur, curve = ease.out) {
  return curve((t - start) / dur);
}

export function life(t, start, end, fadeIn = 0.5, fadeOut = 0.4) {
  return prog(t, start, fadeIn) * (1 - prog(t, end - fadeOut, fadeOut));
}

export function keyed(t, keys, curve = ease.inOut) {
  if (t <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= b.t) {
      const p = curve((t - a.t) / (b.t - a.t));
      const out = { t };
      for (const k of Object.keys(b)) if (k !== 't') out[k] = mix(a[k], b[k], p);
      return out;
    }
  }
  return keys[keys.length - 1];
}

export function steps(t, events, initial) {
  let value = initial;
  for (const [at, v] of events) if (t >= at) value = v;
  return value;
}
