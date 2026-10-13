# Rusty plugins

Status: proposal for review, 13 October 2026.

## What a plugin is

A plugin is a package that adds to Rusty through fixed extension points. It cannot change Rusty's code, draw its own pixels, or reach the file system, network or other programs unless the user granted that.

There are two kinds:

| Kind | Contains | Can run code | Examples |
| --- | --- | --- | --- |
| **Package** | Data only (TOML, images) | No | Themes, keymaps, command macros, column presets, file-type icons |
| **Extension** | A WebAssembly component plus a manifest | Yes, sandboxed | Previewers, drawer views, remote file systems, search sources, columns, commands |

Macros in packages are sequences of built-in commands (`pane.open-tab`, `path.copy`, `terminal.open`), which covers most personal automation without code. There is no separate scripting language in v1; that keeps one model and one security boundary.

## Extension points

| Point | What it adds | Example |
| --- | --- | --- |
| Command | A new command in the palette, keymaps and menus | “Copy as Markdown link” |
| Drawer view | A view in the drawer | Docker containers for the current folder |
| Previewer | Preview for file types | Markdown, `.blend`, `.psd` |
| Column | Per-file data in panels | Image dimensions, audio length, git author |
| Context action | Items in the file context menu | “Upload to NAS” |
| File system | A browsable location | SFTP, S3, an archive format |
| Search source | Results in Ctrl+K | Bookmarks from a notes app; the bundled **Everything** plugin for instant global search |
| Theme, keymap, icons | Look and keys (packages only) | Total Commander keymap, Nord theme |

Plugins cannot hook into file operations (no “before delete” hooks) and cannot replace built-in safety confirmations.

## How plugin UI works

Extensions describe their UI with a small set of widgets (list, table, text, key-value, progress, image from bytes, button, input, toggle). Rusty renders them with its own components and theme. This keeps every plugin consistent with the app, accessible from the keyboard, and unable to imitate Rusty's own confirmation dialogs.

## The manifest

```toml
[plugin]
id = "dev.example.image-columns"
name = "Image columns"
version = "0.3.1"
api = "0.1"                  # host API (WIT world) version
entry = "image_columns.wasm"

[permissions]
fs.read = ["${selection}", "${pane}"]   # only what the user is looking at
fs.write = []                           # nothing
network = []                            # no hosts
process = []                            # no programs
clipboard.write = false

[[contributes.column]]
id = "dimensions"
title = "Dimensions"
extensions = ["jpg", "png", "webp"]

[settings]
max_megapixels = { type = "int", default = 50, min = 1, max = 400 }
```

Permission scopes are narrow by default: `${selection}`, `${pane}`, a named folder, or a host name. Broad access (`fs.read = ["*"]`) is shown in red at install time.

## Lifecycle

1. **Install:** from a folder or `.rustyplugin` archive into `%APPDATA%\Rusty\plugins\<id>`. Rusty validates the manifest, records the package hash and shows the permissions in plain words. Nothing runs until the user approves.
2. **Load lazily:** an extension starts when one of its contributions is first used (its column becomes visible, its command runs, its previewer is needed), not at Rusty's start.
3. **Run in a sandbox:** each extension gets its own wasmtime instance with a memory limit (default 64 MB), CPU deadlines (epoch interruption), and only the host functions its permissions allow.
4. **Unload when idle:** after 5 minutes unused; state the plugin wants to keep goes through a small key-value store the host provides.
5. **Fail safely:** a trap, timeout or permission error disables the contribution, logs it in the Activity view, and leaves Rusty running.
6. **Update:** a new version shows the permission difference and needs approval again if permissions grew. The previous version is kept for rollback.

## The host boundary

- Every host call checks the grant, canonicalises paths and keeps them inside the granted scope.
- File writes go through Rusty's own job engine, so they get plans, confirmations, verification and undo. Permanent deletion is not available to plugins.
- Network access is limited to the listed hosts, through the host's HTTP client with timeouts and size limits.
- Starting programs uses an allow-list from the manifest, with argument lists only, and asks the user the first time.
- Calls are rate-limited, and large data (thumbnails, file contents) is passed with explicit size limits.

## Making a plugin

- **Rust first:** a `rusty-plugin-sdk` crate with types and helpers over the WIT world, and `cargo rusty-plugin new <name>` for a template with a test.
- **Other languages:** anything that compiles to a WASM component against the published WIT files (Go, C#, JS via componentize-js), without an SDK at first.
- **Development mode:** `rusty --plugin-dev <folder>` loads an unpacked plugin, reloads it on rebuild, and shows its logs in the Activity view.
- **Testing:** a fake host crate runs plugins in unit tests with chosen permissions and fake files.
- **Sharing:** a plain folder or archive in v1. A registry (a git repository index with signed releases) can come later.

## First-party plugins

Some features ship as plugins so they can be turned off or replaced:

- **Everything:** global search through voidtools' Everything. When Everything is missing, the plugin offers to install it: it downloads the official installer from voidtools.com, verifies its checksum, and runs it only after the user agrees. Needs the `network` permission for voidtools.com and `process` for the installer.

## Versioning

- The host API is a versioned WIT world (`rusty:plugin@0.1`). Rusty supports the current and the previous minor version.
- Breaking changes go into a new version with a migration note, never silently.

## Built-in features use the same points

Transfers, Compare, Git, Notes and the other drawer views, the built-in previewers and the columns are implemented against the same extension-point traits inside the app. That keeps the extension points real, tested and expressive enough for third parties.
