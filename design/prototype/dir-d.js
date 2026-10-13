/* D · Strip: niri/PaperWM scrolling columns with an inline preview column. */
DIRECTIONS.D = {
  name: "Strip",
  className: "dir-d",
  render(root) {
    const s = FM.state;
    const ws = FM.ws();
    const prevScroll = root.querySelector(".strip")?.scrollLeft ?? 0;
    const cols = ws.panes
      .map((p, pi) => {
        const tab = p.tabs[p.active];
        const entries = FM.list(tab.path);
        const parentPath = FM.parent(tab.path);
        const card = `<section class="col ${pi === s.focus ? "active" : ""}" data-pane="${pi}" aria-label="Column ${pi + 1}">
          <header class="col-h">
            <div class="col-title"><span class="col-n">${pi + 1}</span><h2>${FM.esc(FM.base(tab.path))}</h2><button class="mini" data-act="copyPath" title="Copy path">${UI.icon("copy", 14)}</button></div>
            ${parentPath !== tab.path ? `<button class="col-parent" data-crumb="${FM.esc(parentPath)}" data-pane="${pi}">${FM.esc(parentPath)}</button>` : `<span class="col-parent">${FM.esc(tab.path)}</span>`}
            ${p.tabs.length > 1 ? `<div class="chips">${p.tabs.map((t, ti) => `<button class="chip ${ti === p.active ? "on" : ""}" data-tab="${ti}" data-pane="${pi}">${FM.esc(FM.base(t.path))}</button>`).join("")}</div>` : ""}
          </header>
          <div class="list" role="grid">${UI.rows(pi, { iconSize: 17 })}</div>
          <footer class="col-f"><span>${entries.length} items</span>${tab.marked.size ? `<b>${tab.marked.size} marked</b>` : ""}<span class="col-hint">${pi === s.focus ? "Enter opens · Backspace goes up" : ""}</span></footer>
        </section>`;
        const preview = pi === s.focus && s.preview ? `<aside class="col peek" aria-label="Preview">${UI.preview()}</aside>` : "";
        return card + preview;
      })
      .join("");
    root.innerHTML = `
      <header class="top" data-tauri-drag-region>
        <div class="dots" aria-label="Workspaces">${FM.workspaces.map((w, i) => `<button class="dot ${i === s.ws ? "on" : ""}" data-ws="${i}" title="${FM.esc(w.name)} · Alt+${w.key}"><span>${FM.esc(w.name)}</span></button>`).join("")}</div>
        <button class="omni" data-act="palette">${UI.icon("search", 18)}<span>Jump anywhere</span><em>files · folders · commands · sets</em><kbd>Ctrl K</kbd></button>
        <div class="top-r"><button data-act="split" title="New column (Ctrl+\\)">${UI.icon("plus", 16)}</button><button data-act="preview" title="Preview column" class="${s.preview ? "on" : ""}">${UI.icon("eye", 16)}</button></div>
      </header>
      <main class="strip" aria-label="Columns">${cols}<div class="strip-end"></div></main>
      <footer class="dock">
        <div class="pins">${FM.pins.map((p) => `<button class="pin" data-go="${FM.esc(p.path)}">${UI.icon(p.path.startsWith("\\\\") ? "cloud" : "pin", 14)}${FM.esc(p.label)}</button>`).join("")}</div>
        <div class="dock-r">
          <span class="xfer">${UI.icon("copy", 14)}<span class="bar"><i style="width:${s.queue[0].done * 100}%"></i></span>${Math.round(s.queue[0].done * 100)}%</span>
          <button class="term-btn ${s.terminal ? "on" : ""}" data-act="terminal">${UI.icon("terminal", 15)}Terminal<kbd>Ctrl \`</kbd></button>
        </div>
      </footer>
      ${s.terminal ? `<div class="scratch">${UI.terminal("term")}</div>` : ""}
      ${UI.palette()}${UI.toast()}`;
    const strip = root.querySelector(".strip");
    strip.scrollLeft = prevScroll;
    const active = root.querySelector(".col.active");
    if (active) {
      const target = active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2 + 160;
      strip.scrollTo({ left: Math.max(0, target), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  },
};
