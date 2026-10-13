/* Shared prototype engine: mock Windows filesystem, panes, workspaces, fuzzy palette, keyboard. */
const FM = (() => {
  const day = 86400000;
  const now = new Date("2026-10-13T21:40:00");
  const ago = (d, h = 0) => new Date(now - d * day - h * 3600000);
  const f = (name, size, when, git) => ({ name, size, when, git });

  const FS = {
    "C:\\": { dirs: ["Program Files", "Users", "Windows"], files: [] },
    "C:\\Users\\admin": { dirs: ["Desktop", "Documents", "Downloads", "Pictures", ".config"], files: [f("NTUSER.DAT", 3_407_872, ago(0, 2))] },
    "C:\\Users\\admin\\Downloads": {
      dirs: ["fonts-2026", "drivers"],
      files: [
        f("rustup-init.exe", 9_412_608, ago(1)), f("WizTree_4.21.exe", 7_120_384, ago(3)), f("Everything-1.5a.x64-Setup.exe", 2_310_144, ago(4)),
        f("invoice-2026-10.pdf", 184_320, ago(0, 5)), f("hyprsunset-0.4.tar.gz", 88_064, ago(6)), f("wallpaper-3440x1440.jpg", 6_291_456, ago(9)),
        f("bios-x670e-3201.zip", 34_603_008, ago(12)), f("notes.md", 4_096, ago(0, 1)), f("screenshot 2026-10-13 2140.png", 812_032, ago(0, 0.2)),
      ],
    },
    "C:\\Users\\admin\\Pictures": { dirs: ["2026-09 Brasov", "2026-10 Sinaia", "Screenshots"], files: [f("avatar.png", 220_160, ago(80))] },
    "C:\\Users\\admin\\Pictures\\2026-10 Sinaia": {
      dirs: ["raw"],
      files: Array.from({ length: 14 }, (_, i) => f(`IMG_${4120 + i * 3}.jpg`, 5_100_000 + i * 91_337, ago(2, i))),
    },
    "C:\\Users\\admin\\Desktop": { dirs: ["inbox"], files: [f("todo.txt", 1_024, ago(0, 3)), f("Night Light.lnk", 2_048, ago(1))] },
    "D:\\": { dirs: ["work", "games", "backups", "media"], files: [] },
    "D:\\work": { dirs: ["homelab", "nightlight", "commander", "obidy", "musique"], files: [f("ideas.md", 12_288, ago(0, 6))] },
    "D:\\work\\commander": {
      dirs: ["crates", "plugins", "ui", ".github"],
      files: [f("Cargo.toml", 1_640, ago(0, 1), "M"), f("Cargo.lock", 98_304, ago(0, 1), "M"), f("README.md", 6_144, ago(1)), f("PLAN.md", 9_216, ago(0, 0.5), "A"), f("rust-toolchain.toml", 96, ago(14)), f(".gitignore", 210, ago(14))],
    },
    "D:\\work\\commander\\crates": { dirs: ["core", "fs-ops", "index", "plugin-host", "ui"], files: [] },
    "D:\\work\\commander\\crates\\core": {
      dirs: ["src", "tests"],
      files: [f("Cargo.toml", 812, ago(0, 2)), f("layout.rs", 14_336, ago(0, 0.3), "M"), f("workspace.rs", 9_830, ago(0, 4)), f("pane.rs", 7_421, ago(0, 4)), f("fuzzy.rs", 5_632, ago(1), "A")],
    },
    "D:\\work\\homelab": {
      dirs: ["caddy", "jellyfin", "lumen", "musique", "scripts"],
      files: [f("compose.yml", 7_168, ago(2)), f(".env.example", 512, ago(30)), f("AGENTS.md", 10_240, ago(1))],
    },
    "D:\\work\\nightlight": {
      dirs: ["src-tauri", "ui", "plans", "scripts"],
      files: [f("README.md", 7_890, ago(0, 1)), f("DESIGN.md", 2_800, ago(0, 1)), f("PRODUCT.md", 3_900, ago(0, 2)), f("deploy.sh", 1_030, ago(0, 1)), f("package.json", 520, ago(1))],
    },
    "D:\\media": { dirs: ["films", "series", "music"], files: [] },
    "D:\\backups": { dirs: ["2026-10-01", "2026-10-08"], files: [f("restore.ps1", 3_072, ago(20))] },
    "\\\\nas\\media": { dirs: ["films", "photos", "music"], files: [f("index.json", 1_204_224, ago(0, 8))] },
  };
  const sep = "\\";
  const join = (p, n) => (p.endsWith(sep) ? p + n : p + sep + n);
  const parent = (p) => {
    if (/^[A-Z]:\\$/.test(p) || p === "\\\\nas\\media") return p;
    const i = p.lastIndexOf(sep);
    const up = p.slice(0, i);
    return /^[A-Z]:$/.test(up) ? `${up}\\` : up;
  };
  const base = (p) => (/^[A-Z]:\\$/.test(p) ? p : p.slice(p.lastIndexOf(sep) + 1));
  function list(path) {
    const node = FS[path] || { dirs: ["src", "docs"], files: [f("README.md", 2_048, ago(3)), f("notes.txt", 512, ago(5))] };
    const dirs = node.dirs.map((name) => ({ name, dir: true, when: ago(2), size: null, git: null }));
    return [...dirs, ...node.files.map((x) => ({ ...x, dir: false }))];
  }

  const kindOf = (e) => {
    if (e.dir) return "folder";
    const ext = e.name.split(".").pop().toLowerCase();
    if (["jpg", "png", "gif", "webp"].includes(ext)) return "image";
    if (["rs", "toml", "js", "ts", "yml", "json", "sh", "ps1", "lock"].includes(ext)) return "code";
    if (["zip", "gz", "7z"].includes(ext)) return "archive";
    if (["exe", "lnk"].includes(ext)) return "app";
    return "doc";
  };
  const fmtSize = (n) => (n === null ? "" : n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB` : n < 1073741824 ? `${(n / 1048576).toFixed(1)} MB` : `${(n / 1073741824).toFixed(1)} GB`);
  const fmtWhen = (d) => {
    const diff = (now - d) / 3600000;
    if (diff < 1) return `${Math.max(1, Math.round(diff * 60))} min ago`;
    if (diff < 24) return `${Math.round(diff)} h ago`;
    if (diff < 48) return "Yesterday";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  const tab = (path) => ({ path, sel: 0, marked: new Set() });
  const workspaces = [
    { name: "Commander dev", key: 1, panes: [{ tabs: [tab("D:\\work\\commander"), tab("D:\\work\\commander\\crates\\core")], active: 1 }, { tabs: [tab("C:\\Users\\admin\\Downloads")], active: 0 }, { tabs: [tab("D:\\work\\homelab")], active: 0 }] },
    { name: "Photos", key: 2, panes: [{ tabs: [tab("C:\\Users\\admin\\Pictures\\2026-10 Sinaia")], active: 0 }, { tabs: [tab("\\\\nas\\media")], active: 0 }] },
    { name: "Homelab", key: 3, panes: [{ tabs: [tab("D:\\work\\homelab")], active: 0 }, { tabs: [tab("D:\\work\\nightlight")], active: 0 }, { tabs: [tab("D:\\backups")], active: 0 }, { tabs: [tab("D:\\media")], active: 0 }] },
  ];
  const pins = [
    { label: "Downloads", path: "C:\\Users\\admin\\Downloads", key: "1" },
    { label: "Desktop", path: "C:\\Users\\admin\\Desktop", key: "2" },
    { label: "work", path: "D:\\work", key: "3" },
    { label: "commander", path: "D:\\work\\commander", key: "4" },
    { label: "nas · media", path: "\\\\nas\\media", key: "5" },
  ];
  const drives = [
    { label: "System (C:)", path: "C:\\", used: 0.62, size: "1 TB" },
    { label: "Data (D:)", path: "D:\\", used: 0.41, size: "4 TB" },
    { label: "nas · media", path: "\\\\nas\\media", used: 0.77, size: "24 TB" },
  ];

  const state = {
    ws: 0,
    focus: 0,
    terminal: true,
    palette: { open: false, query: "", sel: 0 },
    toast: null,
    queue: [{ name: "IMG_4120…4159.jpg → \\\\nas\\media\\photos", done: 0.64, speed: "212 MB/s" }],
    preview: true,
    clip: "D:\\work\\nightlight",
    recent: ["D:\\work\\homelab\\caddy", "C:\\Users\\admin\\Pictures\\2026-10 Sinaia", "D:\\backups\\2026-10-08"],
  };
  const listeners = new Set();
  const emit = () => listeners.forEach((fn) => fn());

  const ws = () => workspaces[state.ws];
  const pane = (i = state.focus) => ws().panes[i];
  const current = (p = pane()) => p.tabs[p.active];

  function toast(text) {
    state.toast = text;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => {
      state.toast = null;
      emit();
    }, 2200);
  }

  const COMMANDS = [
    ["Copy path", "Ctrl+Shift+C", () => copyPath("windows")],
    ["Copy path as WSL", "", () => copyPath("wsl")],
    ["Copy path quoted", "", () => copyPath("quoted")],
    ["Open terminal here", "Ctrl+`", () => { state.terminal = true; toast(`Terminal in ${current().path}`); }],
    ["Open in Windows Terminal", "Ctrl+Alt+T", () => toast(`wt -d "${current().path}"`)],
    ["Split pane", "Ctrl+\\", () => split()],
    ["Close pane", "Ctrl+Shift+W", () => closePane()],
    ["New tab", "Ctrl+T", () => newTab()],
    ["Pin folder", "Ctrl+D", () => { pins.push({ label: base(current().path), path: current().path, key: String(pins.length + 1) }); toast(`Pinned ${base(current().path)}`); }],
    ["Save workspace as…", "", () => toast("Saved workspace “Commander dev”")],
    ["Toggle preview", "Ctrl+Q", () => { state.preview = !state.preview; }],
    ["Copy to other pane", "F5", () => queueCopy()],
    ["Batch rename…", "Shift+F6", () => toast("Batch rename: 14 files selected")],
    ["Compare panes", "", () => toast("3 differences between panes")],
  ];

  function fuzzy(query, text) {
    if (!query) return { score: 1, hits: [] };
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    let qi = 0;
    let score = 0;
    let prev = -2;
    const hits = [];
    for (let i = 0; i < t.length && qi < q.length; i++) {
      if (t[i] !== q[qi]) continue;
      const start = i === 0 || "\\/ ._-".includes(t[i - 1]);
      score += 1 + (i === prev + 1 ? 3 : 0) + (start ? 2 : 0);
      hits.push(i);
      prev = i;
      qi++;
    }
    if (qi < q.length) return null;
    return { score: score - text.length * 0.02, hits };
  }
  const mark = (text, hits) => {
    const set = new Set(hits);
    return [...text].map((c, i) => (set.has(i) ? `<mark>${esc(c)}</mark>` : esc(c))).join("");
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  const allEntries = () => {
    const out = [];
    for (const [path, node] of Object.entries(FS)) {
      out.push({ type: "folder", label: base(path), detail: path, path });
      for (const file of node.files) out.push({ type: "file", label: file.name, detail: path, path: join(path, file.name), dirPath: path });
    }
    return out;
  };

  function paletteResults() {
    const q = state.palette.query.trim();
    const items = [
      ...COMMANDS.map(([label, keys, run]) => ({ type: "command", label, detail: keys, run })),
      ...workspaces.map((w, i) => ({ type: "workspace", label: w.name, detail: `Alt+${w.key}`, run: () => switchWs(i) })),
      ...pins.map((p) => ({ type: "pin", label: p.label, detail: p.path, run: () => go(p.path) })),
      ...allEntries().map((e) => ({ ...e, run: () => (e.type === "folder" ? go(e.path) : go(e.dirPath, e.label)) })),
    ];
    const scored = [];
    for (const item of items) {
      const m = fuzzy(q, item.label) ?? (item.type !== "command" ? fuzzy(q, item.detail) : null);
      if (m) scored.push({ ...item, score: m.score + (item.type === "command" && q ? 0.5 : 0), hits: fuzzy(q, item.label)?.hits ?? [] });
    }
    if (!q) return scored.filter((i) => i.type !== "file").slice(0, 9);
    return scored.sort((a, b) => b.score - a.score).slice(0, 9);
  }

  function go(path, selectName) {
    const t = current();
    t.path = path;
    const entries = list(path);
    t.sel = selectName ? Math.max(0, entries.findIndex((e) => e.name === selectName)) : 0;
    t.marked = new Set();
  }
  function open() {
    const t = current();
    const e = list(t.path)[t.sel];
    if (!e) return;
    if (e.dir) go(join(t.path, e.name));
    else toast(`Opening ${e.name}`);
  }
  function up() {
    const t = current();
    const from = base(t.path);
    go(parent(t.path), from);
  }
  function move(delta) {
    const t = current();
    const n = list(t.path).length;
    t.sel = Math.max(0, Math.min(n - 1, t.sel + delta));
  }
  function variant(p, kind) {
    if (kind === "wsl") return p.startsWith("\\\\") ? p.replaceAll("\\", "/") : `/mnt/${p[0].toLowerCase()}/${p.slice(3).replaceAll("\\", "/")}`;
    if (kind === "quoted") return `"${p}"`;
    if (kind === "url") return `file:///${p.replaceAll("\\", "/").replaceAll(" ", "%20")}`;
    return p;
  }
  function copy(text, label = "Copied") {
    state.clip = text;
    toast(`${label} ${text}`);
  }
  function copyPath(kind) {
    const t = current();
    const e = list(t.path)[t.sel];
    const p = e ? join(t.path, e.name) : t.path;
    copy(variant(p, kind));
  }
  function split() {
    if (ws().panes.length >= 4) return toast("Four panes is the most this layout holds");
    ws().panes.splice(state.focus + 1, 0, { tabs: [tab(current().path)], active: 0 });
    state.focus += 1;
  }
  function closePane() {
    if (ws().panes.length === 1) return;
    ws().panes.splice(state.focus, 1);
    state.focus = Math.max(0, state.focus - 1);
  }
  function newTab() {
    const p = pane();
    p.tabs.push(tab(current().path));
    p.active = p.tabs.length - 1;
  }
  function switchWs(i) {
    state.ws = i;
    state.focus = 0;
    toast(`Workspace · ${workspaces[i].name}`);
  }
  function queueCopy() {
    const target = ws().panes[(state.focus + 1) % ws().panes.length];
    const t = current();
    const e = list(t.path)[t.sel];
    state.queue.unshift({ name: `${e?.name ?? base(t.path)} → ${current(target).path}`, done: 0.08, speed: "—" });
    toast(`Queued copy to ${current(target).path}`);
  }

  const actions = {
    focus(i) { state.focus = i; emit(); },
    tab(pi, ti) { state.focus = pi; ws().panes[pi].active = ti; emit(); },
    closeTab(pi, ti) { const p = ws().panes[pi]; if (p.tabs.length > 1) { p.tabs.splice(ti, 1); p.active = Math.min(p.active, p.tabs.length - 1); } emit(); },
    select(pi, idx) { state.focus = pi; current(ws().panes[pi]).sel = idx; emit(); },
    openAt(pi, idx) { state.focus = pi; current(ws().panes[pi]).sel = idx; open(); emit(); },
    go(path) { go(path); emit(); },
    crumb(pi, path) { state.focus = pi; go(path); emit(); },
    ws(i) { switchWs(i); emit(); },
    terminal() { state.terminal = !state.terminal; emit(); },
    preview() { state.preview = !state.preview; emit(); },
    split() { split(); emit(); },
    newTab() { newTab(); emit(); },
    copyPath(kind) { copyPath(kind); emit(); },
    palette(open) { state.palette = { open, query: "", sel: 0 }; emit(); },
    run(cmd) { COMMANDS.find((c) => c[0] === cmd)?.[2](); emit(); },
  };

  function onKey(e) {
    const p = state.palette;
    if (p.open) {
      if (e.key === "Escape") { actions.palette(false); e.preventDefault(); }
      else if (e.key === "ArrowDown" || e.key === "ArrowUp") { p.sel = Math.max(0, Math.min(paletteResults().length - 1, p.sel + (e.key === "ArrowDown" ? 1 : -1))); e.preventDefault(); emit(); }
      else if (e.key === "Enter") { const item = paletteResults()[p.sel]; state.palette.open = false; item?.run(); e.preventDefault(); emit(); }
      return;
    }
    const k = e.key;
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && (k === "k" || k === "p")) { actions.palette(true); e.preventDefault(); return; }
    if (ctrl && k === "`") { actions.terminal(); e.preventDefault(); return; }
    if (ctrl && e.shiftKey && k.toLowerCase() === "c") { actions.copyPath("windows"); e.preventDefault(); return; }
    if (ctrl && k === "\\") { actions.split(); e.preventDefault(); return; }
    if (ctrl && k === "t") { actions.newTab(); e.preventDefault(); return; }
    if (e.altKey && /^[1-3]$/.test(k)) { actions.ws(Number(k) - 1); e.preventDefault(); return; }
    if (e.target.closest?.("input, select")) return;
    if (k === "ArrowDown" || k === "j") { move(1); e.preventDefault(); emit(); }
    else if (k === "ArrowUp" || k === "k") { move(-1); e.preventDefault(); emit(); }
    else if (k === "Enter" || k === "l") { open(); e.preventDefault(); emit(); }
    else if (k === "Backspace" || k === "h") { up(); e.preventDefault(); emit(); }
    else if (k === "Tab") { state.focus = (state.focus + (e.shiftKey ? -1 : 1) + ws().panes.length) % ws().panes.length; e.preventDefault(); emit(); }
    else if (k === "F5") { queueCopy(); e.preventDefault(); emit(); }
    else if (k === " ") { const t = current(); t.marked.has(t.sel) ? t.marked.delete(t.sel) : t.marked.add(t.sel); move(1); e.preventDefault(); emit(); }
  }

  return { state, variant, copy, tab, toast, workspaces, pins, drives, list, kindOf, fmtSize, fmtWhen, join, parent, base, ws, pane, current, actions, onKey, paletteResults, mark, esc, subscribe: (fn) => listeners.add(fn), emit, now };
})();

/* Shared markup helpers. Directions style these; some also build their own. */
const UI = (() => {
  const paths = {
    folder: '<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
    doc: '<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z"/><path d="M14 3.5V8h4M9.5 12h5M9.5 15h5"/>',
    code: '<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z"/><path d="M11 12l-2 2 2 2M13.5 12l2 2-2 2"/>',
    image: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M5 17l4.5-4 3 2.5 3-3L19 16"/>',
    archive: '<rect x="4.5" y="4.5" width="15" height="15" rx="2"/><path d="M12 4.5v3M12 9v2M12 12.5v2M10.5 15.5h3v3h-3z"/>',
    app: '<rect x="4.5" y="4.5" width="15" height="15" rx="3"/><path d="M8.5 12h7M12 8.5v7"/>',
    pin: '<path d="M9 4.5h6l-1 5 3 3v1.5H7V12.5l3-3z"/><path d="M12 14v5.5"/>',
    terminal: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M7.5 10l3 2.5-3 2.5M12.5 15.5h4"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="M15.5 15.5L20 20"/>',
    split: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M12 5v14"/>',
    plus: '<path d="M12 6v12M6 12h12"/>',
    close: '<path d="M7 7l10 10M17 7L7 17"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
    drive: '<rect x="3.5" y="7" width="17" height="10" rx="2"/><path d="M7 14h.01M10 14h.01"/>',
    cloud: '<path d="M7.5 18.5h10a3.5 3.5 0 0 0 .5-7 5.5 5.5 0 0 0-10.6-1.5A4 4 0 0 0 7.5 18.5z"/>',
    layers: '<path d="M12 4l8.5 4.5L12 13 3.5 8.5z"/><path d="M3.5 12.5L12 17l8.5-4.5M3.5 16.5L12 21l8.5-4.5"/>',
    branch: '<circle cx="7" cy="6" r="2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="8" r="2"/><path d="M7 8v8M17 10c0 4-10 2-10 6"/>',
    chevron: '<path d="M10 7l5 5-5 5"/>',
    command: '<path d="M8.5 15.5H7a2.5 2.5 0 1 1 2.5-2.5v-6A2.5 2.5 0 1 1 12 9.5h-6"/><path d="M15.5 8.5H17A2.5 2.5 0 1 1 14.5 11v6a2.5 2.5 0 1 1-2.5-2.5h6"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    check: '<path d="M5.5 12.5l4 4 9-9"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
  };
  const icon = (name, size = 16, cls = "") => `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.doc}</svg>`;

  function crumbs(pi, path, cls = "crumbs") {
    const parts = path.startsWith("\\\\") ? ["\\\\nas", "media", ...path.split("\\").slice(4)] : path.split("\\").filter(Boolean);
    let acc = path.startsWith("\\\\") ? "" : "";
    const out = [];
    parts.forEach((part, i) => {
      if (path.startsWith("\\\\")) acc = i === 0 ? "\\\\nas" : i === 1 ? "\\\\nas\\media" : `${acc}\\${part}`;
      else acc = i === 0 ? `${part}\\` : FM.join(acc, part);
      const target = acc === "\\\\nas" ? "\\\\nas\\media" : acc;
      out.push(`<button class="crumb" data-crumb="${FM.esc(target)}" data-pane="${pi}">${FM.esc(part)}</button>`);
    });
    return `<nav class="${cls}" aria-label="Path">${out.join(`<span class="crumb-sep">${icon("chevron", 12)}</span>`)}</nav>`;
  }

  function rows(pi, opts = {}) {
    const p = FM.ws().panes[pi];
    const t = p.tabs[p.active];
    const entries = FM.list(t.path);
    return entries
      .map((e, i) => {
        const kind = FM.kindOf(e);
        const cls = [i === t.sel ? "sel" : "", t.marked.has(i) ? "marked" : "", e.dir ? "dir" : ""].join(" ");
        const git = e.git ? `<span class="git git-${e.git}">${e.git}</span>` : "";
        return `<div class="row ${cls}" role="row" data-pane="${pi}" data-row="${i}" aria-selected="${i === t.sel}">
          <span class="c-name">${icon(kind, opts.iconSize ?? 16, `k-${kind}`)}<span class="nm">${FM.esc(e.name)}</span>${git}</span>
          ${opts.noMeta ? "" : `<span class="c-size">${e.dir ? "" : FM.fmtSize(e.size)}</span><span class="c-when">${FM.fmtWhen(e.when)}</span>`}
        </div>`;
      })
      .join("");
  }

  function tabs(pi, cls = "tabs") {
    const p = FM.ws().panes[pi];
    return `<div class="${cls}" role="tablist">${p.tabs
      .map((t, ti) => `<button class="tab ${ti === p.active ? "on" : ""}" role="tab" aria-selected="${ti === p.active}" data-tab="${ti}" data-pane="${pi}">${icon("folder", 13)}<span>${FM.esc(FM.base(t.path))}</span>${p.tabs.length > 1 ? `<span class="tab-x" data-closetab="${ti}" data-pane="${pi}">${icon("close", 11)}</span>` : ""}</button>`)
      .join("")}<button class="tab-add" data-act="newTab" aria-label="New tab">${icon("plus", 13)}</button></div>`;
  }

  function palette() {
    const s = FM.state.palette;
    if (!s.open) return "";
    const results = FM.paletteResults();
    const typeIcon = { command: "command", workspace: "layers", pin: "pin", folder: "folder", file: "doc" };
    return `<div class="palette-scrim" data-act="closePalette"></div>
      <div class="palette" role="dialog" aria-label="Command palette">
        <label class="pal-input">${icon("search", 18)}<input id="palInput" value="${FM.esc(s.query)}" placeholder="Search files, folders, commands, workspaces…" autocomplete="off" spellcheck="false"></label>
        <ul class="pal-list" role="listbox">${results
          .map((r, i) => `<li class="pal-item ${i === s.sel ? "on" : ""}" role="option" aria-selected="${i === s.sel}" data-pal="${i}">${icon(r.type === "file" ? FM.kindOf({ name: r.label, dir: false }) : typeIcon[r.type], 16)}<span class="pal-label">${FM.mark(r.label, r.hits)}</span><span class="pal-detail">${FM.esc(r.detail ?? "")}</span><span class="pal-type">${r.type}</span></li>`)
          .join("") || `<li class="pal-empty">Nothing matches “${FM.esc(s.query)}”.</li>`}</ul>
        <div class="pal-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span><span class="pal-scope">Searching everything · Everything index</span></div>
      </div>`;
  }

  function terminal(cls = "term") {
    const t = FM.current();
    const cwd = t.path;
    return `<section class="${cls}" aria-label="Terminal">
      <header class="term-h">${icon("terminal", 14)}<span>pwsh</span><span class="term-cwd">${FM.esc(cwd)}</span><span class="term-follow">follows focused pane</span></header>
      <pre class="term-body"><span class="t-dim">PS ${FM.esc(cwd)}&gt;</span> cargo test -p core
<span class="t-ok">   Compiling</span> core v0.1.0
<span class="t-ok">    Finished</span> test [unoptimized] in 2.41s
<span class="t-ok">test result: ok.</span> 38 passed; 0 failed
<span class="t-dim">PS ${FM.esc(cwd)}&gt;</span> <span class="caret"></span></pre>
    </section>`;
  }

  function preview() {
    const t = FM.current();
    const e = FM.list(t.path)[t.sel];
    if (!e) return "";
    const kind = FM.kindOf(e);
    let body;
    if (kind === "image") body = `<div class="pv-image"><div class="pv-photo"></div></div><dl class="pv-meta"><dt>Dimensions</dt><dd>6000 × 4000</dd><dt>Camera</dt><dd>X-T5 · 23 mm · f/2</dd><dt>Size</dt><dd>${FM.fmtSize(e.size)}</dd></dl>`;
    else if (kind === "code") body = `<pre class="pv-code"><span class="k">pub struct</span> <span class="t">Layout</span> {
    root: <span class="t">Node</span>,
    focus: <span class="t">PaneId</span>,
}

<span class="k">pub enum</span> <span class="t">Node</span> {
    Pane(<span class="t">PaneId</span>),
    Split { axis: <span class="t">Axis</span>, ratio: <span class="t">f32</span>,
            a: <span class="t">Box</span>&lt;<span class="t">Node</span>&gt;, b: <span class="t">Box</span>&lt;<span class="t">Node</span>&gt; },
}</pre>`;
    else if (e.dir) body = `<div class="pv-folder">${FM.list(FM.join(t.path, e.name)).slice(0, 8).map((x) => `<div>${icon(FM.kindOf(x), 14)}${FM.esc(x.name)}</div>`).join("")}</div>`;
    else body = `<p class="pv-text">No preview for this file type yet. Plugins can add previewers.</p>`;
    return `<header class="pv-h">${icon(kind, 18)}<strong>${FM.esc(e.name)}</strong><span>${e.dir ? "Folder" : FM.fmtSize(e.size)} · ${FM.fmtWhen(e.when)}</span></header>${body}`;
  }

  function toast() {
    return FM.state.toast ? `<div class="toast" role="status">${icon("copy", 14)}${FM.esc(FM.state.toast)}</div>` : "";
  }

  function bind(root) {
    root.addEventListener("click", (e) => {
      const el = e.target.closest("[data-act],[data-pane],[data-ws],[data-go],[data-pal],[data-cmd]");
      if (!el) return;
      if (el.dataset.closetab) return FM.actions.closeTab(Number(el.dataset.pane), Number(el.dataset.closetab));
      if (el.dataset.crumb) return FM.actions.crumb(Number(el.dataset.pane), el.dataset.crumb);
      if (el.dataset.tab) return FM.actions.tab(Number(el.dataset.pane), Number(el.dataset.tab));
      if (el.dataset.row) return FM.actions.select(Number(el.dataset.pane), Number(el.dataset.row));
      if (el.dataset.ws) return FM.actions.ws(Number(el.dataset.ws));
      if (el.dataset.go) return FM.actions.go(el.dataset.go);
      if (el.dataset.cmd) return FM.actions.run(el.dataset.cmd);
      if (el.dataset.pal) { const r = FM.paletteResults()[Number(el.dataset.pal)]; FM.state.palette.open = false; r?.run(); return FM.emit(); }
      const act = el.dataset.act;
      if (act === "closePalette") return FM.actions.palette(false);
      if (act === "palette") return FM.actions.palette(true);
      if (act === "terminal") return FM.actions.terminal();
      if (act === "preview") return FM.actions.preview();
      if (act === "split") return FM.actions.split();
      if (act === "newTab") return FM.actions.newTab();
      if (act === "copyPath") return FM.actions.copyPath("windows");
      if (el.dataset.pane && !act) return FM.actions.focus(Number(el.dataset.pane));
    });
    root.addEventListener("dblclick", (e) => {
      const el = e.target.closest("[data-row]");
      if (el) FM.actions.openAt(Number(el.dataset.pane), Number(el.dataset.row));
    });
    root.addEventListener("input", (e) => {
      if (e.target.id !== "palInput") return;
      FM.state.palette.query = e.target.value;
      FM.state.palette.sel = 0;
      const list = root.querySelector(".pal-list");
      const fresh = document.createElement("div");
      fresh.innerHTML = palette();
      list.replaceWith(fresh.querySelector(".pal-list"));
    });
  }

  return { icon, crumbs, rows, tabs, palette, terminal, preview, toast, bind };
})();
const DIRECTIONS = {};
