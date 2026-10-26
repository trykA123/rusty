import { buildBrand, brandIn } from './brandkit.js';
import { prog } from '../ease.js';
import { el, put } from '../dom.js';

export default {
  id: 'outro',
  dur: 7.6,
  xf: 1.6,
  build() {
    const node = el('<div class="scene-root"></div>');
    const b = buildBrand('z', 'In alpha today. The beta, 1.0 and 2.0 follow.', 'Features marked Planned are on the roadmap and not built yet');
    node.append(b.node);
    return { node, b };
  },
  render(r, t) {
    brandIn(r.b, t, 0.5);
    const out = prog(t, 6.6, 0.9);
    put(r.b.node, 1 - out, '');
  },
};
