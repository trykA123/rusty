/* Dock views shared by E–H: everything the bottom area can show besides a terminal. */
FM.state.dock = { left: "terminal", right: "transfers", shelf: "transfers", inspector: null, blocks: "all" };

const DOCK = (() => {
  const ic = UI.icon;
  const esc = FM.esc;
  const jobs = [
    { name: "IMG_4120 … IMG_4159.jpg", to: "\\\\nas\\media\\photos\\2026-10 Sinaia", done: 0.64, speed: "212 MB/s", eta: "0:41", state: "running" },
    { name: "bios-x670e-3201.zip", to: "D:\\backups\\2026-10-08", done: 1, speed: "", eta: "done", state: "done" },
    { name: "films\\Arrival (2016).mkv", to: "D:\\media\\films", done: 0.12, speed: "—", eta: "queued", state: "queued" },
  ];
  const hits = [
    { file: "layout.rs", path: "D:\\work\\commander\\crates\\core", line: 42, text: "pub fn <mark>split</mark>(&mut self, axis: Axis) -> PaneId {" },
    { file: "layout.rs", path: "D:\\work\\commander\\crates\\core", line: 88, text: "fn <mark>split</mark>_ratio(node: &Node) -> f32 {" },
    { file: "pane.rs", path: "D:\\work\\commander\\crates\\core", line: 17, text: "// panes are created by <mark>split</mark>ting the focused one" },
    { file: "PLAN.md", path: "D:\\work\\commander", line: 9, text: "- Ctrl+\\ <mark>split</mark>s the focused pane" },
  ];
  const changes = [["M", "Cargo.toml"], ["M", "Cargo.lock"], ["M", "crates/core/layout.rs"], ["A", "crates/core/fuzzy.rs"], ["A", "PLAN.md"]];
  const clips = [
    ["D:\\work\\commander\\crates\\core\\layout.rs", "Windows", "2 min ago"],
    ["/mnt/d/work/commander/crates/core", "WSL", "9 min ago"],
    ["\"C:\\Users\\admin\\Downloads\\rustup-init.exe\"", "Quoted", "24 min ago"],
    ["\\\\nas\\media\\photos\\2026-10 Sinaia", "UNC", "1 h ago"],
    ["crates/core/fuzzy.rs", "Relative", "1 h ago"],
  ];
  const sizes = [["crates", 41], ["target", 31], ["ui", 12], ["plugins", 8], [".git", 5], ["other", 3]];

  const views = {
    terminal: { label: "Terminal", icon: "terminal", render: () => UI.terminal("term dock-term") },
    transfers: {
      label: "Transfers", icon: "copy", badge: () => jobs.filter((j) => j.state !== "done").length,
      render: () => `<div class="dv-list">${jobs.map((j) => `<div class="job-row ${j.state}">
        ${ic(j.state === "done" ? "copy" : "copy", 15)}
        <div class="job-main"><b>${esc(j.name)}</b><span>→ ${esc(j.to)}</span><div class="job-bar"><i style="width:${j.done * 100}%"></i></div></div>
        <div class="job-meta"><b>${j.state === "done" ? "Done" : `${Math.round(j.done * 100)}%`}</b><span>${j.speed || "verified · sha256"}</span><span>${j.eta}</span></div>
        <div class="job-acts">${j.state === "running" ? `<button title="Pause">Pause</button>` : j.state === "queued" ? `<button title="Start now">Start</button>` : `<button title="Show in pane">Show</button>`}</div>
      </div>`).join("")}</div>`,
    },
    search: {
      label: "Search", icon: "search", badge: () => hits.length,
      render: () => `<div class="dv-search"><div class="dv-q">${ic("search", 14)}<span>split</span><em>in D:\\work\\commander · *.rs, *.md · 4 matches in 3 files · 38 ms</em></div>
        <div class="dv-list">${hits.map((h) => `<div class="hit"><span class="hit-f">${ic("code", 14, "k-code")}${esc(h.file)}<em>:${h.line}</em></span><code>${h.text}</code></div>`).join("")}</div></div>`,
    },
    git: {
      label: "Git", icon: "branch", badge: () => changes.length,
      render: () => `<div class="dv-git"><div class="git-h">${ic("branch", 14)}<b>main</b><span>↑2 ↓0 · origin/main</span><button>Commit…</button><button>Pull</button></div>
        <div class="dv-list">${changes.map(([s, f]) => `<div class="gitrow"><span class="git git-${s}">${s}</span><span>${esc(f)}</span><em>${s === "M" ? "+12 −4" : "new"}</em></div>`).join("")}</div></div>`,
    },
    clipboard: {
      label: "Clipboard", icon: "copy",
      render: () => `<div class="dv-list">${clips.map(([p, kind, when]) => `<div class="clip"><code>${esc(p)}</code><span class="clip-k">${kind}</span><em>${when}</em><button>Copy</button></div>`).join("")}</div>`,
    },
    notes: {
      label: "Notes", icon: "doc",
      render: () => `<div class="dv-notes"><div class="note-h">${ic("doc", 14)}<b>Folder note</b><em>${esc(FM.current().path)}\\.commander-notes.md</em></div>
        <div class="note-body"><h4>Commander dev</h4><p>Release checklist: run <code>cargo test --workspace</code>, bump version in <code>Cargo.toml</code>, tag <code>v0.1.0</code>.</p><ul><li>Plugin API v1 frozen on Friday</li><li>Ask about Everything SDK licence</li></ul></div></div>`,
    },
    disk: {
      label: "Disk", icon: "drive",
      render: () => `<div class="dv-disk"><div class="disk-h"><b>${esc(FM.base(FM.current().path))}</b><span>3.8 GB · scanned from the MFT in 0.4 s</span></div>
        <div class="treemap">${sizes.map(([n, pct], i) => `<div class="tm t${i}" style="flex:${pct}"><b>${esc(n)}</b><span>${(pct * 0.038).toFixed(1)} GB</span></div>`).join("")}</div></div>`,
    },
    preview: { label: "Preview", icon: "eye", render: () => `<div class="dv-preview">${UI.preview()}</div>` },
    activity: {
      label: "Activity", icon: "layers",
      render: () => `<div class="dv-list mono">${[["21:39", "Copied path D:\\work\\commander\\crates\\core\\layout.rs"], ["21:36", "Workspace Commander dev restored (3 panes, 4 tabs)"], ["21:31", "Copy started: 40 files → \\\\nas\\media\\photos"], ["21:12", "Pinned D:\\work\\commander"], ["20:58", "Batch rename: 14 files, undo available"]].map(([t, x]) => `<div class="act"><time>${t}</time><span>${esc(x)}</span></div>`).join("")}</div>`,
    },
  };

  function tabs(slot, names, active, extra = "") {
    return `<div class="dock-tabs" role="tablist">${names.map((n) => {
      const v = views[n];
      const b = v.badge?.();
      return `<button role="tab" class="${n === active ? "on" : ""}" aria-selected="${n === active}" data-dock="${slot}:${n}">${ic(v.icon, 14)}${v.label}${b ? `<b>${b}</b>` : ""}</button>`;
    }).join("")}${extra}</div>`;
  }
  const render = (name) => views[name].render();
  return { views, tabs, render, jobs, hits, changes, clips };
})();

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-dock]");
  if (!el) return;
  const [slot, view] = el.dataset.dock.split(":");
  FM.state.dock[slot] = slot === "inspector" && FM.state.dock.inspector === view ? null : view;
  FM.state.terminal = true;
  FM.emit();
});
