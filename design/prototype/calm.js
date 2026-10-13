/* I–L: calm by default, add what you need, designed for a laptop-sized window first. */
FM.workspaces.push({ name: "Everyday", key: 4, panes: [{ tabs: [{ path: "C:\\Users\\admin\\Downloads", sel: 0, marked: new Set() }], active: 0 }, { tabs: [{ path: "D:\\work\\commander", sel: 0, marked: new Set() }], active: 0 }] });
const CALM_WS = FM.workspaces.length - 1;
FM.state.calm = { views: ["terminal", "transfers"], active: "terminal", addOpen: false, sections: { transfers: true, terminal: true, clipboard: false }, rail: false };

const CALM = (() => {
  const ic = UI.icon;
  const esc = FM.esc;
  const ALL = ["terminal", "transfers", "search", "git", "clipboard", "notes", "disk", "activity", "preview"];

  function onMount() {
    FM.state.ws = CALM_WS;
    FM.state.focus = 0;
    FM.state.terminal = false;
    FM.state.palette.open = false;
  }

  function wsMenu() {
    const s = FM.state;
    return `<div class="ws-switch" role="group" aria-label="Workspace">${FM.workspaces
      .map((w, i) => `<button class="${i === s.ws ? "on" : ""}" data-ws="${i}" title="${esc(w.name)} · Alt+${i + 1}"><span class="full">${esc(w.name)}</span><span class="short">${i + 1}</span></button>`)
      .join("")}</div>`;
  }

  function pane(pi, opts = {}) {
    const s = FM.state;
    const p = FM.ws().panes[pi];
    const t = p.tabs[p.active];
    const entries = FM.list(t.path);
    const rows = entries
      .map((e, i) => {
        const kind = FM.kindOf(e);
        return `<div class="row ${i === t.sel ? "sel" : ""} ${t.marked.has(i) ? "marked" : ""} ${e.dir ? "dir" : ""}" data-pane="${pi}" data-row="${i}" role="row" aria-selected="${i === t.sel}">
          <span class="c-name">${ic(kind, 16, `k-${kind}`)}<span class="nm">${esc(e.name)}</span>${e.git ? `<span class="git git-${e.git}">${e.git}</span>` : ""}</span>
          <span class="c-size">${e.dir ? "" : FM.fmtSize(e.size)}</span>
          <span class="c-when">${FM.fmtWhen(e.when)}</span>
        </div>`;
      })
      .join("");
    const tabs = p.tabs.length > 1 ? `<div class="ptabs">${p.tabs.map((x, ti) => `<button class="${ti === p.active ? "on" : ""}" data-tab="${ti}" data-pane="${pi}">${esc(FM.base(x.path))}</button>`).join("")}</div>` : "";
    const closable = FM.ws().panes.length > 1;
    return `<section class="pane ${pi === s.focus ? "active" : ""}" data-pane="${pi}" aria-label="${esc(FM.base(t.path))}">
      <header class="ph">
        ${UI.crumbs(pi, t.path)}
        <span class="ph-acts">
          <button data-act="copyPath" title="Copy path (Ctrl+Shift+C)">${ic("copy", 14)}</button>
          ${closable ? `<button data-calm="close:${pi}" title="Close pane">${ic("close", 14)}</button>` : ""}
        </span>
      </header>
      ${tabs}
      <div class="list" role="grid">${rows}</div>
      ${t.marked.size ? `<footer class="pf">${t.marked.size} selected · <button data-cmd="Copy to other pane">Copy</button> <button>Move</button> <button>Delete</button></footer>` : ""}
      ${opts.extra ?? ""}
    </section>`;
  }

  function addMenu(where) {
    const c = FM.state.calm;
    if (!c.addOpen) return "";
    const free = ALL.filter((v) => !c.views.includes(v));
    return `<div class="addmenu ${where}" role="menu">${free.length ? free.map((v) => `<button role="menuitem" data-calm="add:${v}">${ic(DOCK.views[v].icon, 15)}<span>${DOCK.views[v].label}</span></button>`).join("") : `<p>Everything is already in the dock.</p>`}</div>`;
  }

  function viewSwitch() {
    const c = FM.state.calm;
    return `<div class="vswitch" role="tablist">${c.views
      .map((v) => `<span class="vchip ${v === c.active ? "on" : ""}"><button role="tab" aria-selected="${v === c.active}" data-calm="view:${v}">${ic(DOCK.views[v].icon, 14)}${DOCK.views[v].label}${DOCK.views[v].badge?.() ? `<b>${DOCK.views[v].badge()}</b>` : ""}</button>${c.views.length > 1 ? `<button class="vx" data-calm="remove:${v}" aria-label="Remove ${DOCK.views[v].label}">${ic("close", 11)}</button>` : ""}</span>`)
      .join("")}<button class="vadd ${c.addOpen ? "on" : ""}" data-calm="addmenu" aria-label="Add a view">${ic("plus", 14)}</button></div>`;
  }

  function dock(opts = {}) {
    const c = FM.state.calm;
    if (!FM.state.terminal) return "";
    const second = opts.split && c.views.length > 1 ? c.views.find((v) => v !== c.active) : null;
    return `<section class="dock ${second ? "two" : ""}" aria-label="Dock">
      <header class="dh">${viewSwitch()}<button class="dclose" data-act="terminal" title="Hide dock (Ctrl+\`)">${ic("close", 14)}</button></header>
      <div class="db">${second ? `<div class="db-a">${DOCK.render(c.active)}</div><div class="db-b"><span class="db-label">${DOCK.views[second].label}</span>${DOCK.render(second)}</div>` : DOCK.render(c.active)}</div>
      ${addMenu("up")}
    </section>`;
  }

  function topbar(extra = "") {
    return `<header class="tb" data-tauri-drag-region>
      ${wsMenu()}
      <button class="find" data-act="palette">${ic("search", 15)}<span>Search</span><kbd>Ctrl K</kbd></button>
      <span class="tb-acts">${extra}
        <button data-act="split" title="Add pane (Ctrl+\\)">${ic("split", 16)}</button>
        <button data-act="terminal" class="${FM.state.terminal ? "on" : ""}" title="Dock (Ctrl+\`)">${ic("terminal", 16)}</button>
        <span class="wc"><i></i><i></i><i></i></span>
      </span>
    </header>`;
  }

  const overlays = () => `${UI.palette()}${UI.toast()}`;

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-calm]");
    const c = FM.state.calm;
    if (!el) {
      if (c.addOpen && !e.target.closest(".addmenu")) { c.addOpen = false; FM.emit(); }
      return;
    }
    const [cmd, arg] = el.dataset.calm.split(":");
    if (cmd === "view") c.active = arg;
    if (cmd === "addmenu") { c.addOpen = !c.addOpen; FM.emit(); return; }
    if (cmd === "add") { c.views.push(arg); c.active = arg; c.sections[arg] = true; c.addOpen = false; FM.state.terminal = true; }
    if (cmd === "remove") { c.views = c.views.filter((v) => v !== arg); if (c.active === arg) c.active = c.views[0]; }
    if (cmd === "close") { const ws = FM.ws(); ws.panes.splice(Number(arg), 1); FM.state.focus = Math.min(FM.state.focus, ws.panes.length - 1); }
    if (cmd === "stack") FM.state.focus = Number(arg);
    if (cmd === "section") c.sections[arg] = !c.sections[arg];
    if (cmd === "rail") c.rail = !c.rail;
    FM.emit();
  });

  return { onMount, pane, dock, topbar, viewSwitch, addMenu, overlays, ALL };
})();

DIRECTIONS.I = {
  name: "Calm tiles",
  className: "calm dir-i",
  onMount: CALM.onMount,
  render(root) {
    const n = FM.ws().panes.length;
    root.innerHTML = `${CALM.topbar()}
      <main class="work n${n}">${FM.ws().panes.map((_, pi) => CALM.pane(pi)).join("")}</main>
      ${CALM.dock()}${CALM.overlays()}`;
  },
};

DIRECTIONS.J = {
  name: "Calm console",
  className: "calm dir-j",
  onMount() {
    CALM.onMount();
    FM.state.terminal = true;
  },
  render(root) {
    const n = FM.ws().panes.length;
    const wide = root.clientWidth >= 1200;
    root.innerHTML = `${CALM.topbar()}
      <main class="work n${n}">${FM.ws().panes.map((_, pi) => CALM.pane(pi)).join("")}</main>
      ${CALM.dock({ split: wide })}${CALM.overlays()}`;
  },
};

DIRECTIONS.K = {
  name: "Focus",
  className: "calm dir-k",
  onMount: CALM.onMount,
  render(root) {
    const s = FM.state;
    const panes = FM.ws().panes;
    const room = root.clientWidth >= 1180 ? 2 : 1;
    const shown = room === 2 && panes.length > 1 ? [s.focus, (s.focus + 1) % panes.length] : [s.focus];
    const stack = panes
      .map((p, pi) => {
        const t = p.tabs[p.active];
        const on = shown.includes(pi);
        return `<button class="stk ${pi === s.focus ? "focus" : ""} ${on ? "shown" : ""}" data-calm="stack:${pi}">${UI.icon("folder", 15, "k-folder")}<span><b>${FM.esc(FM.base(t.path))}</b><small>${FM.esc(FM.parent(t.path))}</small></span><kbd>${pi + 1}</kbd></button>`;
      })
      .join("");
    root.innerHTML = `${CALM.topbar()}
      <aside class="stack" aria-label="Panes"><h2>Panes</h2>${stack}<button class="stk add" data-act="split">${UI.icon("plus", 15)}<span>New pane</span></button>
        <h2>Pinned</h2>${FM.pins.slice(0, 4).map((p) => `<button class="pinl" data-go="${FM.esc(p.path)}">${UI.icon("pin", 14)}<span>${FM.esc(p.label)}</span></button>`).join("")}</aside>
      <main class="work n${shown.length}">${shown.map((pi) => CALM.pane(pi)).join("")}</main>
      ${CALM.dock()}${CALM.overlays()}`;
  },
};

DIRECTIONS.L = {
  name: "Side dock",
  className: "calm dir-l",
  onMount() {
    CALM.onMount();
    FM.state.terminal = true;
  },
  render(root) {
    const s = FM.state;
    const c = s.calm;
    const n = FM.ws().panes.length;
    const side = s.terminal
      ? c.rail
        ? `<aside class="rail" aria-label="Dock">${c.views.map((v) => `<button data-calm="rail" title="${DOCK.views[v].label}">${UI.icon(DOCK.views[v].icon, 18)}${DOCK.views[v].badge?.() ? `<b>${DOCK.views[v].badge()}</b>` : ""}</button>`).join("")}<button data-calm="rail" class="exp" title="Expand">${UI.icon("chevron", 16)}</button></aside>`
        : `<aside class="side" aria-label="Dock">
            <header class="sh"><b>Dock</b><span class="sp"></span><button data-calm="addmenu" class="${c.addOpen ? "on" : ""}" title="Add a view">${UI.icon("plus", 15)}</button><button data-calm="rail" title="Collapse to icons">${UI.icon("chevron", 15)}</button></header>
            ${CALM.addMenu("down")}
            <div class="sections">${c.views
              .map((v) => `<section class="sec ${c.sections[v] ? "open" : ""}">
                <header><button class="sec-t" data-calm="section:${v}">${UI.icon("chevron", 13, "chev")}${UI.icon(DOCK.views[v].icon, 14)}${DOCK.views[v].label}${DOCK.views[v].badge?.() ? `<b>${DOCK.views[v].badge()}</b>` : ""}</button><button class="vx" data-calm="remove:${v}" aria-label="Remove ${DOCK.views[v].label}">${UI.icon("close", 11)}</button></header>
                ${c.sections[v] ? `<div class="sec-b">${DOCK.render(v)}</div>` : ""}
              </section>`)
              .join("")}</div>
          </aside>`
      : "";
    root.innerHTML = `${CALM.topbar()}
      <div class="body ${s.terminal ? (c.rail ? "with-rail" : "with-side") : ""}"><main class="work n${n}">${FM.ws().panes.map((_, pi) => CALM.pane(pi)).join("")}</main>${side}</div>
      ${CALM.overlays()}`;
  },
};
