/* A · Tiles: Hyprland/tmux grammar. */
DIRECTIONS.A = {
  name: "Tiles",
  className: "dir-a",
  render(root, opts = {}) {
    const s = FM.state;
    const ws = FM.ws();
    const n = ws.panes.length;
    const t = FM.current();
    const entries = FM.list(t.path);
    const marked = t.marked.size;
    const panes = ws.panes
      .map((p, pi) => {
        const tab = p.tabs[p.active];
        const count = FM.list(tab.path).length;
        return `<section class="tile ${pi === s.focus ? "active" : ""} t${pi}" data-pane="${pi}" aria-label="Pane ${pi + 1}">
          <header class="tile-h">${UI.tabs(pi)}<span class="tile-n">${pi + 1}</span></header>
          <div class="tile-path">${UI.crumbs(pi, tab.path)}<button class="mini" data-act="copyPath" title="Copy path (Ctrl+Shift+C)">${UI.icon("copy", 14)}</button></div>
          <div class="cols"><span>Name</span><span>Size</span><span>Modified</span></div>
          <div class="list" role="grid">${UI.rows(pi)}</div>
          <footer class="tile-f"><span>${count} items</span>${tab.marked.size ? `<span class="acc">${tab.marked.size} marked</span>` : ""}</footer>
        </section>`;
      })
      .join("");
    const q = s.queue[0];
    root.innerHTML = `
      <header class="bar" data-tauri-drag-region>
        <nav class="wss" aria-label="Workspaces">${FM.workspaces.map((w, i) => `<button class="wsb ${i === s.ws ? "on" : ""}" data-ws="${i}" title="Alt+${w.key}"><b>${w.key}</b>${FM.esc(w.name)}<i>${w.panes.length}</i></button>`).join("")}</nav>
        <button class="omni" data-act="palette">${UI.icon("search", 15)}<span>Jump to file, folder or command</span><kbd>Ctrl K</kbd></button>
        <div class="bar-r">
          <span class="job" title="${FM.esc(q.name)}">${UI.icon("copy", 14)}<span class="job-bar"><i style="width:${q.done * 100}%"></i></span>${Math.round(q.done * 100)}% · ${q.speed}</span>
          <span class="clock">21:40</span>
          <span class="win">${UI.icon("close", 14)}</span>
        </div>
      </header>
      <main class="grid n${n} ${s.terminal ? "with-term" : ""}">
        ${panes}
        ${s.terminal ? (opts.bottom ? opts.bottom() : UI.terminal("term tile-term")) : ""}
      </main>
      <footer class="status">
        <span class="mode">NORMAL</span>
        <span class="mono">${FM.esc(t.path)}${entries[t.sel] ? `\\${FM.esc(entries[t.sel].name)}` : ""}</span>
        ${marked ? `<span class="acc">${marked} marked</span>` : ""}
        <span class="sp"></span>
        <span>${UI.icon("branch", 13)} main ↑2</span>
        <span>D: 2.4 TB free</span>
        ${opts.status ?? ""}<span class="keys"><kbd>Tab</kbd> pane <kbd>Ctrl \\</kbd> split <kbd>Ctrl \`</kbd> term</span>
      </footer>
      ${UI.palette()}${UI.toast()}`;
  },
};
