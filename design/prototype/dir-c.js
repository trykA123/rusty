/* C · Studio: IDE grammar. Activity bar, workspace cards, editor-style panes, preview, bottom panel. */
DIRECTIONS.C = {
  name: "Studio",
  className: "dir-c",
  render(root, opts = {}) {
    const s = FM.state;
    const ws = FM.ws();
    const n = ws.panes.length;
    const thumb = (w) => `<span class="thumb n${w.panes.length}">${w.panes.map(() => "<i></i>").join("")}</span>`;
    const panes = ws.panes
      .map((p, pi) => {
        const tab = p.tabs[p.active];
        return `<section class="ed ${pi === s.focus ? "active" : ""} e${pi}" data-pane="${pi}">
          ${UI.tabs(pi)}
          <div class="ed-path">${UI.crumbs(pi, tab.path)}<span class="ed-n">${FM.list(tab.path).length}</span></div>
          <div class="list" role="grid">${UI.rows(pi)}</div>
        </section>`;
      })
      .join("");
    const activity = [["folder", "Explorer", true], ["search", "Search"], ["layers", "Workspaces"], ["pin", "Pinned"], ["copy", "Transfers"], ["app", "Plugins"]];
    root.innerHTML = `
      <header class="title" data-tauri-drag-region>
        <span class="logo">${UI.icon("layers", 16)}</span>
        <span class="menu">File</span><span class="menu">Edit</span><span class="menu">View</span><span class="menu">Go</span>
        <button class="center" data-act="palette">${UI.icon("search", 14)}<span>${FM.esc(ws.name)}</span><kbd>Ctrl K</kbd></button>
        <span class="winb"><i></i><i></i><i></i></span>
      </header>
      <nav class="activity" aria-label="Views">${activity.map(([ic, label, on]) => `<button class="${on ? "on" : ""}" title="${label}">${UI.icon(ic, 20)}</button>`).join("")}<button class="settings" title="Settings">${UI.icon("settings", 20)}</button></nav>
      <aside class="side">
        <h2>Workspaces <button data-cmd="Save workspace as…" title="Save current">${UI.icon("plus", 14)}</button></h2>
        <div class="cards">${FM.workspaces.map((w, i) => `<button class="card ${i === s.ws ? "on" : ""}" data-ws="${i}">${thumb(w)}<span class="card-t"><b>${FM.esc(w.name)}</b><small>${w.panes.map((p) => FM.esc(FM.base(p.tabs[p.active].path))).join(" · ")}</small></span><kbd>Alt ${w.key}</kbd></button>`).join("")}</div>
        <h2>Pinned</h2>
        <div class="tree">${FM.pins.map((p) => `<button data-go="${FM.esc(p.path)}">${UI.icon(p.path.startsWith("\\\\") ? "cloud" : "folder", 15, "k-folder")}<span>${FM.esc(p.label)}</span><kbd>Ctrl ${p.key}</kbd></button>`).join("")}</div>
        <h2>Drives</h2>
        <div class="tree">${FM.drives.map((d) => `<button data-go="${FM.esc(d.path)}">${UI.icon(d.path.startsWith("\\\\") ? "cloud" : "drive", 15)}<span>${FM.esc(d.label)}</span><em>${Math.round((1 - d.used) * 100)}% free</em></button>`).join("")}</div>
      </aside>
      <main class="eds n${n}">${panes}</main>
      ${s.preview ? `<aside class="pv">${UI.preview()}</aside>` : ""}
      ${opts.panel ? opts.panel() : `<section class="panel ${s.terminal ? "" : "min"}">
        <div class="panel-tabs"><button class="${s.terminal ? "on" : ""}" data-act="terminal">${UI.icon("terminal", 14)}Terminal</button><button>${UI.icon("copy", 14)}Transfers <b>${s.queue.length}</b></button><button>${UI.icon("search", 14)}Search results</button><span class="panel-sp"></span><button data-act="terminal" title="Toggle panel">${UI.icon(s.terminal ? "close" : "plus", 14)}</button></div>
        ${s.terminal ? UI.terminal("term") : ""}
      </section>`}
      <footer class="sb">
        <span>${UI.icon("layers", 13)}${FM.esc(ws.name)}</span>
        <span>${UI.icon("branch", 13)}main</span>
        <span>${UI.icon("copy", 13)}${Math.round(s.queue[0].done * 100)}% · ${s.queue[0].speed}</span>
        <span class="sp"></span>
        <span>${FM.ws().panes.length} panes</span>
        <span>Everything index · 2.1 M files</span>
      </footer>
      ${UI.palette()}${UI.toast()}`;
  },
};
