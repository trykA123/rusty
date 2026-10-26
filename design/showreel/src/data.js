export const LEFT = {
  tabs: ['aurora', 'Downloads'],
  crumbs: ['D:', 'Work', 'aurora'],
  drive: 'D: Work',
  free: '209 GB free',
  foot: '10 files, 5 folders · 71.2 MB',
  rows: [
    { name: '..', kind: 'up' },
    { name: 'assets', kind: 'dir', date: '2026-10-15 22:41' },
    { name: 'build', kind: 'dir', date: '2026-10-16 09:12' },
    { name: 'docs', kind: 'dir', date: '2026-10-16 08:55' },
    { name: 'src', kind: 'dir', date: '2026-10-16 09:40' },
    { name: 'tools', kind: 'dir', date: '2026-10-12 17:03' },
    { name: 'aurora_fw', ext: 'elf', kind: 'code', size: '2.4 MB', date: '2026-10-16 09:38' },
    { name: 'aurora_fw', ext: 'map', kind: 'code', size: '1.1 MB', date: '2026-10-16 09:38' },
    { name: 'aurora_fw', ext: 'hex', kind: 'code', size: '6.8 MB', date: '2026-10-16 09:38' },
    { name: 'bootloader', ext: 'hex', kind: 'code', size: '96 KB', date: '2026-09-28 11:20' },
    { name: 'CHANGES', ext: 'md', kind: 'doc', size: '12 KB', date: '2026-10-15 21:10' },
    { name: 'flash_layout', ext: 'png', kind: 'image', size: '340 KB', date: '2026-10-02 14:06' },
    { name: 'linker', ext: 'lsl', kind: 'code', size: '8 KB', date: '2026-10-09 10:31' },
    { name: 'release-0.9', ext: 'zip', kind: 'archive', size: '18.4 MB', date: '2026-10-15 07:30' },
    { name: 'trace_bench', ext: 'blf', kind: 'auto', size: '42.0 MB', date: '2026-10-08 16:44' },
    { name: 'README', ext: 'md', kind: 'doc', size: '4.0 KB', date: '2026-10-15 21:02' },
  ],
};

export const RIGHT = {
  tabs: ['releases', 'Backup'],
  crumbs: ['E:', 'Archive', 'releases'],
  drive: 'E: Archive',
  free: '1.42 TB free',
  foot: '3 files, 2 folders · 2.6 MB',
  rows: [
    { name: '..', kind: 'up' },
    { name: '0.7', kind: 'dir', date: '2026-08-30 18:02' },
    { name: '0.8', kind: 'dir', date: '2026-09-21 12:47' },
    { name: 'aurora_fw', ext: 'elf', kind: 'code', size: '2.4 MB', date: '2026-10-16 09:38', copy: 0.23 },
    { name: 'aurora_fw', ext: 'hex', kind: 'code', size: '6.8 MB', date: '2026-10-16 09:38', copy: 1 },
    { name: 'aurora_fw', ext: 'map', kind: 'code', size: '1.1 MB', date: '2026-10-16 09:38', copy: 0.34 },
    { name: 'checksums', ext: 'txt', kind: 'doc', size: '2 KB', date: '2026-09-21 12:50' },
    { name: 'notes-0.7', ext: 'pdf', kind: 'pdf', size: '1.2 MB', date: '2026-08-30 18:05' },
    { name: 'notes-0.8', ext: 'pdf', kind: 'pdf', size: '1.4 MB', date: '2026-09-21 12:49' },
  ],
};

export const PALETTE = {
  commands: {
    top: { icon: 'cmd', label: 'Copy', meta: 'File list', key: 'F5' },
    groups: [
      ['Commands', [
        { icon: 'cmd', label: 'Copy to clipboard', meta: 'File list', key: 'Ctrl+C' },
        { icon: 'cmd', label: 'Copy full path', meta: 'File list', key: 'F9' },
        { icon: 'cmd', label: 'Copy name only', meta: 'File list', key: '' },
        { icon: 'cmd', label: 'Compare folders', meta: 'File list', key: '' },
      ]],
      ['Folders', [
        { icon: 'dir', label: 'copper-tools', meta: 'D:\\Work', key: '' },
        { icon: 'dir', label: 'copies', meta: 'E:\\Backup', key: '' },
      ]],
    ],
    counts: ['212 results', '64 results', '18 results'],
  },
  files: {
    top: { icon: 'pdf', label: 'notes-0.8.pdf', meta: 'E:\\Archive\\releases', key: '' },
    groups: [
      ['Files', [
        { icon: 'pdf', label: 'notes-0.7.pdf', meta: 'E:\\Archive\\releases', key: '' },
        { icon: 'doc', label: 'meeting-notes.md', meta: 'D:\\Work\\aurora\\docs', key: '' },
        { icon: 'doc', label: 'notes.txt', meta: 'D:\\Downloads', key: '' },
      ]],
      ['Folders', [
        { icon: 'dir', label: 'notes', meta: 'D:\\Work', key: '' },
      ]],
    ],
    counts: ['9,410 results', '2,086 results', '311 results', '74 results', '5 results'],
  },
};

export const SHEET = {
  name: 'build',
  path: 'D:\\Work\\aurora\\build',
  tree: [
    { depth: 0, name: 'debug', dir: true },
    { depth: 1, name: 'obj', dir: true },
    { depth: 1, name: 'aurora_fw.elf', size: '3.1 MB' },
    { depth: 0, name: 'release', dir: true },
    { depth: 1, name: 'obj', dir: true },
    { depth: 1, name: 'aurora_fw.elf', size: '2.4 MB' },
    { depth: 1, name: 'aurora_fw.map', size: '1.1 MB' },
    { depth: 0, name: 'build.log', size: '640 KB' },
  ],
  stats: [
    { label: 'Total size', to: 1.86, fmt: (v) => `${v.toFixed(2)} GB`, big: true },
    { label: 'Files', to: 4212, fmt: (v) => Math.round(v).toLocaleString('en-US') },
    { label: 'Folders', to: 318, fmt: (v) => Math.round(v).toLocaleString('en-US') },
  ],
  types: [
    { ext: '.o', count: '3,904', size: '1.02 GB', share: 1, hue: 40 },
    { ext: '.elf', count: '6', size: '412 MB', share: 0.4, hue: 210 },
    { ext: '.map', count: '6', size: '220 MB', share: 0.22, hue: 82 },
    { ext: 'other', count: '296', size: '228 MB', share: 0.22, hue: 260 },
  ],
};

export const ELF = {
  file: 'aurora_fw.elf',
  facts: 'ELF32 · little-endian · 1,842 symbols',
  regions: [
    { name: 'Data RAM', at: '0x7000_0000', size: '240 KB', used: '171 KB', pct: 71, parts: [['data', 26], ['bss', 45]] },
    { name: 'Flash 0', at: '0x8000_0000', size: '4 MB', used: '2.41 MB', pct: 60, parts: [['code', 38], ['rodata', 18], ['data', 4]] },
    { name: 'Flash 1', at: '0x8040_0000', size: '4 MB', used: '0.62 MB', pct: 15, parts: [['code', 9], ['rodata', 6]] },
    { name: 'Shared RAM', at: '0x9000_0000', size: '768 KB', used: '169 KB', pct: 22, parts: [['data', 8], ['bss', 14]] },
  ],
  strip: [
    ['data', 6], ['bss', 9], ['gap', 5], ['code', 24], ['rodata', 11], ['data', 3], ['gap', 9],
    ['code', 7], ['rodata', 5], ['gap', 9], ['data', 4], ['bss', 6],
  ],
  stripMarks: [['0x7000_0000', 0], ['0x8000_0000', 20], ['0x8040_0000', 62], ['0x9000_0000', 87]],
  symbols: [
    ['can_rx_ring', '.bss', '24.0 KB'],
    ['aes_tables', '.rodata', '18.4 KB'],
    ['app_main_loop', '.text', '9.6 KB'],
    ['diag_dtc_store', '.data', '6.2 KB'],
  ],
  modules: [
    { name: 'app_main', size: '640 KB', share: '30%', hue: 40, x: 0, y: 0, w: 48.7, h: 60.8 },
    { name: 'can_stack', size: '412 KB', share: '19%', hue: 210, x: 0, y: 60.8, w: 48.7, h: 39.2 },
    { name: 'hal', size: '260 KB', share: '12%', hue: 82, x: 48.7, y: 0, w: 20.3, h: 59.4 },
    { name: 'lib_c', size: '210 KB', share: '10%', hue: 238, x: 69, y: 0, w: 16.4, h: 59.4 },
    { name: 'crypto', size: '188 KB', share: '9%', hue: 150, x: 85.4, y: 0, w: 14.6, h: 59.4 },
    { name: 'rtos', size: '150 KB', share: '7%', hue: 300, x: 48.7, y: 59.4, w: 17.1, h: 40.6 },
    { name: 'diag', size: '120 KB', share: '6%', hue: 60, x: 65.8, y: 59.4, w: 13.7, h: 40.6 },
    { name: 'boot', size: '96 KB', share: '4%', hue: 25, x: 79.5, y: 59.4, w: 10.9, h: 40.6 },
    { name: 'other', size: '84 KB', share: '4%', hue: 260, x: 90.4, y: 59.4, w: 9.6, h: 40.6 },
  ],
};
