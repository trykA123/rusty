import { buildBrand, brandIn } from './brandkit.js';
import { el } from '../dom.js';

export default {
  id: 'brand',
  dur: 6.2,
  build() {
    const node = el('<div class="scene-root"></div>');
    const b = buildBrand('a', 'A keyboard-first file manager for Windows', 'A tour of the planned product, from the alpha to 2.0');
    node.append(b.node);
    return { node, b };
  },
  render(r, t) {
    brandIn(r.b, t, 0.3);
  },
};
