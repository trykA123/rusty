/* B · Commander: Total Commander's heir. Resizable rail, tab path tools, and a drawer of add/remove views. */
const BSTATE = (() => {
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem("fm-b") || "{}"); } catch { return {}; }
  })();
  return {
    rail: { w: saved.w ?? 236, collapsed: saved.collapsed ?? false, locked: saved.locked ?? false },
    drawer: { open: saved.open ?? true, h: saved.h ?? 220, views: saved.views ?? ["transfers", "clipboard", "search"], active: saved.active ?? "transfers" },
    menu: null,
    dragging: null,
  };
})();
const RAIL = { min: 160, max: 420, icons: 56, reset: 236 };
const DRAWER = { min: 120, max: 420 };

function saveB() {
  const { rail, drawer } = BSTATE;
  try { localStorage.setItem("fm-b", JSON.stringify({ ...rail, open: drawer.open, h: drawer.h, views: drawer.views, active: drawer.active })); } catch {}
}

function ensureBViews() {
  if (DOCK.views.compare) return;
  DOCK.views.compare = {
    label: "Compare", icon: "split",
    render() {
      const panes = FM.ws().panes;
      if (panes.length < 2) return `<p class="dv-empty">Open a second panel to compare.</p>`;
      const a = panes[0].tabs[panes[0].active].path;
      const b = panes[1].tabs[panes[1].active].path;
      const left = new Map(FM.list(a).map((e) => [e.name, e]));
      const right = new Map(FM.list(b).map((e) => [e.name, e]));
      const names = [...new Set([...left.keys(), ...right.keys()])].slice(0, 12);
      const row = (n) => {
        const l = left.get(n);
        const r = right.get(n);
        const state = l && r ? (l.size === r.size ? "same" : "diff") : l ? "left" : "right";
        const label = { same: "same", diff: "differs", left: "only left", right: "only right" }[state];
        return `<div class="cmp ${state}"><span>${l ? FM.esc(n) : ""}</span><em>${label}</em><span>${r ? FM.esc(n) : ""}</span></div>`;
      };
      return `<div class="dv-cmp"><div class="cmp-h"><b>${FM.esc(FM.base(a))}</b><span>${names.filter((n) => !(left.has(n) && right.has(n))).length} differences</span><b>${FM.esc(FM.base(b))}</b></div><div class="dv-list">${names.map(row).join("")}</div><div class="cmp-acts"><button>Sync left → right</button><button>Sync both ways</button></div></div>`;
    },
  };
  DOCK.views.selection = {
    label: "Selection", icon: "check",
    badge: () => FM.current().marked.size || null,
    render() {
      const t = FM.current();
      const entries = FM.list(t.path);
      const marked = [...t.marked].map((i) => entries[i]).filter(Boolean);
      if (!marked.length) return `<p class="dv-empty">Mark files with <kbd>Space</kbd> or <kbd>Insert</kbd> to act on several at once.</p>`;
      const size = marked.reduce((a, e) => a + (e.size ?? 0), 0);
      return `<div class="dv-sel"><div class="sel-h"><b>${marked.length} marked</b><span>${FM.fmtSize(size)} · ${FM.esc(t.path)}</span></div>
        <div class="sel-files">${marked.map((e) => `<span>${UI.icon(FM.kindOf(e), 13)}${FM.esc(e.name)}</span>`).join("")}</div>
        <div class="cmp-acts"><button>Copy paths</button><button>Copy to other panel</button><button>Batch rename…</button><button>Zip</button><button>Delete</button></div></div>`;
    },
  };
}

const B_ALL = ["transfers", "clipboard", "search", "compare", "selection", "git", "notes", "disk", "activity", "preview", "terminal"];

function bTabs(pi) {
  const p = FM.ws().panes[pi];
  return `<div class="tabs" role="tablist">${p.tabs
    .map((t, ti) => `<button class="tab ${ti === p.active ? "on" : ""}" role="tab" aria-selected="${ti === p.active}" data-tab="${ti}" data-pane="${pi}" title="${FM.esc(t.path)}">${UI.icon("folder", 13)}<span>${FM.esc(FM.base(t.path))}</span><span class="tab-copy" data-b="tabcopy:${pi}:${ti}" title="Copy path">${UI.icon("copy", 11)}</span>${p.tabs.length > 1 ? `<span class="tab-x" data-closetab="${ti}" data-pane="${pi}">${UI.icon("close", 11)}</span>` : ""}</button>`)
    .join("")}<button class="tab-add" data-b="newmenu:${pi}" aria-label="New tab" aria-haspopup="menu">${UI.icon("plus", 13)}</button></div>`;
}

function bMenu() {
  const m = BSTATE.menu;
  if (!m || m.type === "add") return "";
  const item = (act, icon, label, hint = "") => `<button role="menuitem" data-b="${act}">${UI.icon(icon, 14)}<span>${label}</span>${hint ? `<em>${hint}</em>` : ""}</button>`;
  const pos = `left:${m.x}px;top:${m.y}px`;
  if (m.type === "tab") {
    const t = FM.ws().panes[m.pane].tabs[m.tab];
    return `<div class="bmenu" role="menu" style="${pos}">
      <div class="bm-h">${FM.esc(t.path)}</div>
      ${item(`copy:${m.pane}:${m.tab}:windows`, "copy", "Copy path", "Ctrl+Shift+C")}
      ${item(`copy:${m.pane}:${m.tab}:wsl`, "terminal", "Copy as WSL path", FM.esc(FM.variant(t.path, "wsl")))}
      ${item(`copy:${m.pane}:${m.tab}:quoted`, "copy", "Copy quoted")}
      ${item(`copy:${m.pane}:${m.tab}:url`, "copy", "Copy as file URL")}
      ${item(`copyall:${m.pane}`, "layers", "Copy all tab paths in this panel")}
      <hr>
      ${item(`dup:${m.pane}:${m.tab}`, "plus", "Duplicate tab")}
      ${item(`other:${m.pane}:${m.tab}`, "split", "Open in the other panel")}
      ${item(`close:${m.pane}:${m.tab}`, "close", "Close tab", "Ctrl+W")}
    </div>`;
  }
  const clip = FM.state.clip;
  return `<div class="bmenu" role="menu" style="${pos}">
    ${item(`newhere:${m.pane}`, "plus", "New tab here", "Ctrl+T")}
    ${clip ? item(`newclip:${m.pane}`, "copy", "New tab from clipboard", FM.esc(clip)) : ""}
    <div class="bm-h">Recent</div>
    ${FM.state.recent.map((r, i) => item(`newrecent:${m.pane}:${i}`, "folder", FM.esc(FM.base(r)), FM.esc(FM.parent(r)))).join("")}
    <hr>
    <label class="bm-input">${UI.icon("chevron", 13)}<input id="bPathInput" placeholder="Type or paste a path, Enter opens it" spellcheck="false"></label>
  </div>`;
}

function bDrawer() {
  const d = BSTATE.drawer;
  if (!d.open) return "";
  const free = B_ALL.filter((v) => !d.views.includes(v));
  return `<section class="drawer" aria-label="Drawer">
    <div class="drawer-grip" data-grip="drawer" tabindex="0" role="separator" aria-orientation="horizontal" aria-valuenow="${d.h}" aria-label="Drawer height"></div>
    <header class="dw-h">
      <div class="dw-tabs" role="tablist">${d.views.map((v) => {
        const view = DOCK.views[v];
        const badge = view.badge?.();
        return `<span class="dw-tab ${v === d.active ? "on" : ""}"><button role="tab" aria-selected="${v === d.active}" data-b="view:${v}">${UI.icon(view.icon, 13)}${view.label}${badge ? `<b>${badge}</b>` : ""}</button>${d.views.length > 1 ? `<button class="dw-x" data-b="remove:${v}" aria-label="Remove ${view.label}">${UI.icon("close", 10)}</button>` : ""}</span>`;
      }).join("")}
        <button class="dw-add" data-b="addmenu" aria-label="Add a view" aria-haspopup="menu">${UI.icon("plus", 13)}</button>
      </div>
      <button class="dw-close" data-b="drawer" title="Hide drawer (F9)">${UI.icon("close", 13)}</button>
    </header>
    <div class="dw-body">${DOCK.render(d.active)}</div>
    ${BSTATE.menu?.type === "add" ? `<div class="bmenu add" role="menu">${free.map((v) => `<button role="menuitem" data-b="add:${v}">${UI.icon(DOCK.views[v].icon, 14)}<span>${DOCK.views[v].label}</span></button>`).join("") || "<p>Everything is already here.</p>"}</div>` : ""}
  </section>`;
}

function bRail() {
  const s = FM.state;
  const r = BSTATE.rail;
  const head = (label) => (r.collapsed ? `<hr>` : `<h2>${label}</h2>`);
  return `<aside class="rail ${r.collapsed ? "icons" : ""}" aria-label="Sidebar">
    <div class="rail-top">
      ${r.collapsed ? "" : `<span>Navigator</span>`}
      <button data-b="lock" class="${r.locked ? "on" : ""}" title="${r.locked ? "Width locked · click to unlock" : "Lock this width"}">${UI.icon("pin", 14)}</button>
      <button data-b="collapse" title="${r.collapsed ? "Expand sidebar" : "Collapse to icons"}">${UI.icon("chevron", 14, r.collapsed ? "" : "flip")}</button>
    </div>
    ${head("Pinned")}
    ${FM.pins.map((p) => `<button class="rail-i" data-go="${FM.esc(p.path)}" title="${FM.esc(p.label)} · Ctrl+${p.key}">${UI.icon(p.path.startsWith("\\\\") ? "cloud" : "pin", 15)}<span>${FM.esc(p.label)}</span><kbd>${p.key}</kbd></button>`).join("")}
    ${head("Sets")}
    ${FM.workspaces.slice(0, 3).map((w, i) => `<button class="rail-i set ${i === s.ws ? "on" : ""}" data-ws="${i}" title="${FM.esc(w.name)} · Alt+${w.key}"><span class="glyph g${w.panes.length}">${"<i></i>".repeat(w.panes.length)}</span><span>${FM.esc(w.name)}</span><kbd>Alt ${w.key}</kbd></button>`).join("")}
    ${head("Drives")}
    ${FM.drives.map((d) => `<button class="rail-i drive-i" data-go="${FM.esc(d.path)}" title="${FM.esc(d.label)} · ${Math.round((1 - d.used) * 100)}% free">${UI.icon(d.path.startsWith("\\\\") ? "cloud" : "drive", 15)}<span>${FM.esc(d.label)}<small><i style="width:${d.used * 100}%"></i></small></span><em>${d.size}</em></button>`).join("")}
    <div class="rail-grip ${r.locked ? "locked" : ""}" data-grip="rail" tabindex="0" role="separator" aria-orientation="vertical" aria-valuemin="${RAIL.min}" aria-valuemax="${RAIL.max}" aria-valuenow="${r.collapsed ? RAIL.icons : r.w}" aria-label="Sidebar width"></div>
    ${BSTATE.dragging === "rail" ? `<span class="wbadge">${r.collapsed ? "icons" : `${r.w} px`}</span>` : ""}
  </aside>`;
}

DIRECTIONS.B = {
  name: "Commander",
  className: "dir-b",
  onMount(root) {
    ensureBViews();
    FM.state.terminal = false;
    root.addEventListener("click", onBClick);
    root.addEventListener("contextmenu", (e) => {
      const tab = e.target.closest(".tab[data-tab]");
      if (!tab) return;
      e.preventDefault();
      const box = root.getBoundingClientRect();
      BSTATE.menu = { type: "tab", pane: Number(tab.dataset.pane), tab: Number(tab.dataset.tab), x: Math.min(e.clientX - box.left, box.width - 320), y: e.clientY - box.top + 4 };
      FM.emit();
    });
    root.addEventListener("pointerdown", (e) => startDrag(e, root));
    root.addEventListener("keydown", (e) => {
      const grip = e.target.closest?.("[data-grip]");
      if (e.key === "Escape" && BSTATE.menu) { BSTATE.menu = null; FM.emit(); e.stopPropagation(); return; }
      if (e.key === "F9") { BSTATE.drawer.open = !BSTATE.drawer.open; saveB(); FM.emit(); e.preventDefault(); e.stopPropagation(); return; }
      if (e.target.id === "bPathInput" && e.key === "Enter") { openTab(BSTATE.menu.pane, e.target.value.trim() || FM.state.clip); e.stopPropagation(); return; }
      if (!grip) return;
      const step = e.shiftKey ? 48 : 16;
      if (grip.dataset.grip === "rail" && !BSTATE.rail.locked) {
        if (e.key === "ArrowLeft") setRail(BSTATE.rail.w - step);
        else if (e.key === "ArrowRight") setRail((BSTATE.rail.collapsed ? RAIL.min : BSTATE.rail.w) + step, true);
        else if (e.key === "Enter") BSTATE.rail.collapsed = !BSTATE.rail.collapsed;
        else return;
      } else if (grip.dataset.grip === "drawer") {
        if (e.key === "ArrowUp") BSTATE.drawer.h = Math.min(DRAWER.max, BSTATE.drawer.h + step);
        else if (e.key === "ArrowDown") BSTATE.drawer.h = Math.max(DRAWER.min, BSTATE.drawer.h - step);
        else return;
      } else return;
      e.preventDefault();
      e.stopPropagation();
      saveB();
      FM.emit();
      root.querySelector(`[data-grip="${grip.dataset.grip}"]`)?.focus();
    }, true);
    root.addEventListener("dblclick", (e) => {
      if (e.target.closest('[data-grip="rail"]') && !BSTATE.rail.locked) { BSTATE.rail = { ...BSTATE.rail, w: RAIL.reset, collapsed: false }; saveB(); FM.emit(); }
    });
  },
  render(root) {
    const s = FM.state;
    const ws = FM.ws();
    const t = FM.current();
    const r = BSTATE.rail;
    root.style.setProperty("--rail-w", `${r.collapsed ? RAIL.icons : r.w}px`);
    root.style.setProperty("--drawer-h", `${BSTATE.drawer.h}px`);
    root.classList.toggle("is-dragging", Boolean(BSTATE.dragging));
    const ext = (e) => (e.dir || !e.name.includes(".") ? "" : e.name.split(".").pop());
    const stem = (e) => (e.dir || !e.name.includes(".") ? e.name : e.name.slice(0, e.name.lastIndexOf(".")));
    const panes = ws.panes
      .map((p, pi) => {
        const tab = p.tabs[p.active];
        const entries = FM.list(tab.path);
        const files = entries.filter((e) => !e.dir);
        const total = files.reduce((a, e) => a + e.size, 0);
        const marked = [...tab.marked].map((i) => entries[i]).filter(Boolean);
        const rows = entries
          .map((e, i) => `<div class="row ${i === tab.sel ? "sel" : ""} ${tab.marked.has(i) ? "marked" : ""} ${e.dir ? "dir" : ""} ${i % 2 ? "odd" : ""}" data-pane="${pi}" data-row="${i}" role="row" aria-selected="${i === tab.sel}">
              <span class="c-name">${UI.icon(FM.kindOf(e), 15, `k-${FM.kindOf(e)}`)}<span class="nm">${e.dir ? `[${FM.esc(e.name)}]` : FM.esc(stem(e))}</span>${e.git ? `<span class="git git-${e.git}">${e.git}</span>` : ""}</span>
              <span class="c-ext">${FM.esc(ext(e))}</span>
              <span class="c-size">${e.dir ? "&lt;DIR&gt;" : FM.fmtSize(e.size)}</span>
              <span class="c-when">${e.when.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" })} ${e.when.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>`)
          .join("");
        return `<section class="pane ${pi === s.focus ? "active" : ""}" data-pane="${pi}" aria-label="Panel ${pi + 1}">
          ${bTabs(pi)}
          <div class="pathbar"><span class="drive">${FM.esc(tab.path.startsWith("\\\\") ? "\\\\nas" : tab.path.slice(0, 2))}</span>${UI.crumbs(pi, tab.path)}<button class="ghost" data-b="tabcopy:${pi}:${p.active}" title="Copy path">${UI.icon("copy", 14)}</button></div>
          <div class="heads"><span>Name</span><span>Ext</span><span>Size</span><span>Date</span></div>
          <div class="list" role="grid">${rows}</div>
          <footer class="pane-f">${marked.length ? `<b>${marked.length}</b> of ${entries.length} marked · ${FM.fmtSize(marked.reduce((a, e) => a + (e.size ?? 0), 0))}` : `${files.length} files, ${entries.length - files.length} folders · ${FM.fmtSize(total)}`}</footer>
        </section>`;
      })
      .join("");
    const fkeys = [["F2", "Rename"], ["F3", "View"], ["F4", "Edit"], ["F5", "Copy"], ["F6", "Move"], ["F7", "New folder"], ["F8", "Delete"], ["F9", "Drawer"], ["F10", "Palette"]];
    root.innerHTML = `
      <header class="top" data-tauri-drag-region>
        <div class="brand">${UI.icon("layers", 18)}<b>Commander</b></div>
        <div class="tools">
          <button data-act="split" title="Split (Ctrl+\\)">${UI.icon("split", 16)}</button>
          <button data-b="drawer" class="${BSTATE.drawer.open ? "on" : ""}" title="Drawer (F9)">${UI.icon("layers", 16)}</button>
        </div>
        <button class="search" data-act="palette">${UI.icon("search", 15)}<span>Find anywhere: files, folders, commands</span><kbd>Ctrl K</kbd></button>
        <div class="winctl"><span></span><span></span><span></span></div>
      </header>
      ${bRail()}
      <main class="panes n${ws.panes.length}">${panes}</main>
      ${bDrawer()}
      <div class="cmdline"><span class="prompt">${FM.esc(t.path)}&gt;</span><span class="cmd-ph">type a command, or ! for PowerShell</span></div>
      <nav class="fkeys">${fkeys.map(([k, l]) => `<button ${k === "F9" ? 'data-b="drawer"' : ""}><kbd>${k}</kbd>${l}</button>`).join("")}</nav>
      ${bMenu()}${UI.palette()}${UI.toast()}`;
    const input = root.querySelector("#bPathInput");
    if (input && BSTATE.menu?.focusInput) input.focus();
  },
};

function setRail(w, expand = false) {
  const r = BSTATE.rail;
  if (w < RAIL.min - 40) { r.collapsed = true; return; }
  if (expand || w >= RAIL.min) r.collapsed = false;
  r.w = Math.max(RAIL.min, Math.min(RAIL.max, Math.round(w)));
}

function openTab(pi, path) {
  const p = FM.ws().panes[pi];
  p.tabs.push(FM.tab(path));
  p.active = p.tabs.length - 1;
  FM.state.focus = pi;
  BSTATE.menu = null;
  FM.toast(`New tab · ${path}`);
  FM.emit();
}

function onBClick(e) {
  const el = e.target.closest("[data-b]");
  if (!el) {
    if (BSTATE.menu && !e.target.closest(".bmenu")) { BSTATE.menu = null; FM.emit(); }
    return;
  }
  e.stopPropagation();
  const [cmd, a, b, c] = el.dataset.b.split(":");
  const box = e.currentTarget.getBoundingClientRect();
  const tabPath = (pi, ti) => FM.ws().panes[Number(pi)].tabs[Number(ti)].path;
  const d = BSTATE.drawer;
  if (cmd === "tabcopy") FM.copy(tabPath(a, b));
  if (cmd === "copy") FM.copy(FM.variant(tabPath(a, b), c));
  if (cmd === "copyall") FM.copy(FM.ws().panes[Number(a)].tabs.map((t) => t.path).join("\n"), `Copied ${FM.ws().panes[Number(a)].tabs.length} paths ·`);
  if (cmd === "dup") return openTab(Number(a), tabPath(a, b));
  if (cmd === "other") return openTab((Number(a) + 1) % FM.ws().panes.length, tabPath(a, b));
  if (cmd === "close") FM.actions.closeTab(Number(a), Number(b));
  if (cmd === "newmenu") {
    const r = el.getBoundingClientRect();
    BSTATE.menu = { type: "new", focusInput: true, pane: Number(a), x: Math.min(r.left - box.left, box.width - 340), y: r.bottom - box.top + 4 };
    FM.emit();
    return;
  }
  if (cmd === "newhere") return openTab(Number(a), FM.current(FM.ws().panes[Number(a)]).path);
  if (cmd === "newclip") return openTab(Number(a), FM.state.clip);
  if (cmd === "newrecent") return openTab(Number(a), FM.state.recent[Number(b)]);
  if (cmd === "lock") BSTATE.rail.locked = !BSTATE.rail.locked;
  if (cmd === "collapse") BSTATE.rail.collapsed = !BSTATE.rail.collapsed;
  if (cmd === "drawer") d.open = !d.open;
  if (cmd === "view") d.active = a;
  if (cmd === "remove") { d.views = d.views.filter((v) => v !== a); if (d.active === a) d.active = d.views[0]; }
  if (cmd === "addmenu") { BSTATE.menu = BSTATE.menu?.type === "add" ? null : { type: "add" }; saveB(); FM.emit(); return; }
  if (cmd === "add") { d.views.push(a); d.active = a; BSTATE.menu = null; }
  BSTATE.menu = null;
  saveB();
  FM.emit();
}

function startDrag(e, root) {
  const grip = e.target.closest("[data-grip]");
  if (!grip || e.button !== 0) return;
  const kind = grip.dataset.grip;
  if (kind === "rail" && BSTATE.rail.locked) return;
  e.preventDefault();
  const box = root.getBoundingClientRect();
  const scale = box.width / root.offsetWidth;
  const startY = e.clientY;
  const startH = BSTATE.drawer.h;
  BSTATE.dragging = kind;
  FM.emit();
  const move = (ev) => {
    if (kind === "rail") {
      setRail((ev.clientX - box.left) / scale);
      root.style.setProperty("--rail-w", `${BSTATE.rail.collapsed ? RAIL.icons : BSTATE.rail.w}px`);
      const badge = root.querySelector(".wbadge");
      if (badge) badge.textContent = BSTATE.rail.collapsed ? "icons" : `${BSTATE.rail.w} px`;
      root.querySelector(".rail")?.classList.toggle("icons", BSTATE.rail.collapsed);
    } else {
      BSTATE.drawer.h = Math.max(DRAWER.min, Math.min(DRAWER.max, startH + (startY - ev.clientY) / scale));
      root.style.setProperty("--drawer-h", `${BSTATE.drawer.h}px`);
    }
  };
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    BSTATE.dragging = null;
    saveB();
    FM.emit();
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}
