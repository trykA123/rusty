/* E–H: A and C structures with four ideas for a bottom dock that shows more than a terminal. */
const RIGHT_VIEWS = ["transfers", "search", "git", "clipboard", "notes", "disk", "activity", "preview"];

DIRECTIONS.E = {
  name: "Console",
  className: "dir-a dir-e",
  render(root) {
    const d = FM.state.dock;
    DIRECTIONS.A.render(root, {
      bottom: () => `<section class="tile-term console" aria-label="Console">
        <div class="con-left">
          <div class="con-h">${UI.icon("terminal", 14)}<b>pwsh</b><span>${FM.esc(FM.current().path)}</span><em>follows pane</em></div>
          ${DOCK.render("terminal")}
        </div>
        <div class="con-right">
          ${DOCK.tabs("right", RIGHT_VIEWS, d.right, `<span class="dock-sp"></span><button class="dock-ico" title="Move to its own tile">${UI.icon("split", 14)}</button>`)}
          <div class="con-body">${DOCK.render(d.right)}</div>
        </div>
      </section>`,
      status: `<span class="dockhint"><kbd>Ctrl Shift ←/→</kbd> console tab</span>`,
    });
  },
};

DIRECTIONS.F = {
  name: "Shelf",
  className: "dir-c dir-f",
  render(root) {
    const d = FM.state.dock;
    const summary = {
      terminal: () => `<code>PS ${FM.esc(FM.base(FM.current().path))}&gt; cargo test -p core</code><span class="ok-t">38 passed</span>`,
      transfers: () => `<div class="mini-bar"><i style="width:64%"></i></div><span>2 running · 212 MB/s · 0:41 left</span>`,
      git: () => `<span><b>main</b> ↑2 · 5 changes</span><span class="git git-M">M</span><span class="git git-A">A</span>`,
      clipboard: () => `<code>${FM.esc(DOCK.clips[0][0])}</code>`,
      disk: () => `<div class="mini-tm"><i style="flex:41"></i><i style="flex:31"></i><i style="flex:12"></i><i style="flex:16"></i></div><span>3.8 GB in this folder</span>`,
      search: () => `<span>“split” · 4 matches in 3 files</span>`,
    };
    const shelf = ["terminal", "transfers", "search", "git", "clipboard", "disk"];
    DIRECTIONS.C.render(root, {
      panel: () => `<section class="panel shelf" aria-label="Shelf">
        ${shelf.map((n) => {
          const v = DOCK.views[n];
          const open = n === d.shelf;
          return `<article class="widget ${open ? "open" : ""}">
            <button class="w-h" data-dock="shelf:${n}">${UI.icon(v.icon, 14)}<b>${v.label}</b>${v.badge?.() ? `<i>${v.badge()}</i>` : ""}<span class="w-x">${UI.icon(open ? "close" : "plus", 12)}</span></button>
            <div class="w-body">${open ? DOCK.render(n) : `<div class="w-sum">${summary[n]()}</div>`}</div>
          </article>`;
        }).join("")}
      </section>`,
    });
  },
};

DIRECTIONS.G = {
  name: "Inspector",
  className: "dir-a dir-g",
  render(root) {
    const d = FM.state.dock;
    const t = FM.current();
    const entries = FM.list(t.path);
    const e = entries[t.sel];
    const kind = e ? FM.kindOf(e) : "folder";
    const auto = { image: "photo", code: "code", folder: "folder", app: "app", archive: "archive", doc: "doc" }[kind];
    const mode = d.inspector ?? auto;
    const siblings = entries.filter((x) => FM.kindOf(x) === "image").slice(0, 9);
    const inspect = {
      photo: () => `<div class="ins-photo"><div class="pv-photo"></div><div class="film">${siblings.map((x) => `<span class="${x === e ? "on" : ""}"></span>`).join("")}</div></div>
        <dl class="ins-kv"><dt>Camera</dt><dd>Fujifilm X-T5</dd><dt>Lens</dt><dd>23 mm f/2</dd><dt>Exposure</dt><dd>1/250 · ISO 160</dd><dt>Taken</dt><dd>11 Oct 2026, 14:12</dd><dt>Location</dt><dd>Sinaia, RO</dd></dl>
        <div class="ins-acts"><button>Rotate</button><button>Set as wallpaper</button><button>Copy to NAS</button></div>`,
      code: () => `<pre class="diff"><span class="dh">@@ layout.rs  +12 −4 @@</span>
<span class="dm">-    fn split(&amp;mut self) -&gt; PaneId {</span>
<span class="dp">+    pub fn split(&amp;mut self, axis: Axis) -&gt; PaneId {</span>
<span class="dp">+        let ratio = self.default_ratio(axis);</span>
         let id = self.next_id();</pre>
        <div class="ins-side"><b>Symbols</b><span>struct Layout</span><span>enum Node</span><span>fn split</span><span>fn close</span><span>fn focus_next</span></div>
        <div class="ins-acts"><button>Open in Zed</button><button>Blame</button><button>Stage</button></div>`,
      folder: () => `<div class="ins-folder">${DOCK.render("disk")}</div><dl class="ins-kv"><dt>Items</dt><dd>${e ? FM.list(FM.join(t.path, e.name)).length : entries.length}</dd><dt>Git</dt><dd>main · clean</dd><dt>Note</dt><dd>Release checklist</dd></dl>
        <div class="ins-acts"><button>Terminal here</button><button>Pin</button><button>Compare with pane 2</button></div>`,
      app: () => `<dl class="ins-kv wide"><dt>Publisher</dt><dd>Rust Foundation · signature valid</dd><dt>Version</dt><dd>1.28.2</dd><dt>SHA-256</dt><dd class="mono">4f1c…9a0e</dd><dt>Downloaded from</dt><dd>static.rust-lang.org</dd></dl>
        <div class="ins-acts"><button>Run</button><button>Run as admin</button><button>Check on VirusTotal</button></div>`,
      archive: () => `<div class="dv-list">${["BIOS/", "BIOS/X670E.CAP", "README.txt", "Flash.exe"].map((x) => `<div class="act"><span>${FM.esc(x)}</span></div>`).join("")}</div><div class="ins-acts"><button>Extract here</button><button>Extract to…</button><button>Open as folder</button></div>`,
      doc: () => `<p class="ins-text">Plain document. Plugins can add previewers for PDF, Office and more.</p><div class="ins-acts"><button>Open</button><button>Open with…</button></div>`,
      transfers: () => DOCK.render("transfers"),
      git: () => DOCK.render("git"),
      clipboard: () => DOCK.render("clipboard"),
    };
    DIRECTIONS.A.render(root, {
      bottom: () => `<section class="tile-term inspector" aria-label="Inspector">
        <div class="ins-left">
          <div class="cmdbar">${UI.icon("chevron", 14)}<span>cargo test -p core</span><em>Enter runs in ${FM.esc(FM.base(t.path))}</em></div>
          <pre class="mini-out"><span class="t-ok">test result: ok.</span> 38 passed; 0 failed
<span class="t-dim">finished in 2.41 s · Ctrl+\` expands to a full terminal</span></pre>
        </div>
        <div class="ins-right">
          <header class="ins-h">${UI.icon(kind === "image" ? "image" : kind, 15)}<b>${FM.esc(e?.name ?? FM.base(t.path))}</b><span>${d.inspector ? "pinned view" : "follows selection"}</span>
            <span class="dock-sp"></span>${["transfers", "git", "clipboard"].map((n) => `<button class="pin-v ${d.inspector === n ? "on" : ""}" data-dock="inspector:${n}">${UI.icon(DOCK.views[n].icon, 13)}${DOCK.views[n].label}</button>`).join("")}</header>
          <div class="ins-body m-${mode}">${inspect[mode]()}</div>
        </div>
      </section>`,
    });
  },
};

DIRECTIONS.H = {
  name: "Blocks",
  className: "dir-c dir-h",
  render(root) {
    const d = FM.state.dock;
    const blocks = [
      { type: "copy", icon: "copy", title: "Copy 40 photos → \\\\nas\\media\\photos", time: "21:31", status: "64%", body: `<div class="job-bar"><i style="width:64%"></i></div><span class="muted">212 MB/s · 0:41 left · verify with sha256</span>` },
      { type: "search", icon: "search", title: "Search “split” in commander", time: "21:34", status: "4 hits", body: DOCK.hits.slice(0, 2).map((h) => `<div class="hit"><span class="hit-f">${FM.esc(h.file)}<em>:${h.line}</em></span><code>${h.text}</code></div>`).join("") },
      { type: "git", icon: "branch", title: "git status · main", time: "21:37", status: "5 changes", body: `<div class="chips-row">${DOCK.changes.map(([s, f]) => `<span><i class="git git-${s}">${s}</i>${FM.esc(f)}</span>`).join("")}</div>` },
      { type: "shell", icon: "terminal", title: `cargo test -p core`, time: "21:39", status: "ok", body: `<pre><span class="t-ok">test result: ok.</span> 38 passed; 0 failed; finished in 2.41s</pre>` },
    ];
    const filters = ["all", "shell", "search", "copy", "git"];
    const shown = blocks.filter((b) => d.blocks === "all" || b.type === d.blocks);
    DIRECTIONS.C.render(root, {
      panel: () => `<section class="panel blocks" aria-label="Blocks">
        <div class="blk-top"><b>Session</b>${filters.map((f) => `<button class="${d.blocks === f ? "on" : ""}" data-dock="blocks:${f}">${f === "all" ? "All" : f[0].toUpperCase() + f.slice(1)}</button>`).join("")}<span class="dock-sp"></span><em>Every action leaves a block you can rerun, copy or pin</em></div>
        <div class="blk-stream">${shown.map((b) => `<article class="blk b-${b.type}"><header>${UI.icon(b.icon, 14)}<b>${FM.esc(b.title)}</b><span class="st">${b.status}</span><time>${b.time}</time><button title="Rerun">${UI.icon("chevron", 12)}</button></header><div class="blk-b">${b.body}</div></article>`).join("")}</div>
        <div class="blk-input">${UI.icon("chevron", 15)}<span class="ph">Shell command, or / for app commands — /copy, /find, /git, /workspace</span><kbd>Enter</kbd></div>
      </section>`,
    });
  },
};
