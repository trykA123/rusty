# Tiled panes

Status: in. Up to four panes, the layout switcher, your own layouts, swap, resize and the narrow-window strip work.

## What it is

Navo can show up to four panes at once, tiled like a tiling window manager. Panes are numbered 1 to 4 from top to bottom, then left to right. The numbers change when the layout changes. The folders do not.

Ctrl+L opens the layout switcher. It is also layout mode: you split, close, swap and resize panes from the keyboard.

## What you can do

- Pick a built-in layout: 1 Side by side, 2 Three columns, 3 Wide + 2, 4 Two by two, 5 Main + 3.
- Keep your own layouts. They appear after the built-ins as 6 to 9.
- Split the focused pane, close it, swap it with a neighbour or move a divider.
- Choose which pane is the target of F5, F6 and Ctrl+Shift+Up.

Applying a layout keeps your folders. Pane k goes to slot k. A bigger layout adds panes at the current folder. A smaller one removes the highest-numbered panes. Their tabs join the last pane that stays. No tab is lost.

A fifth pane is refused with "Four panes is the most in this version."

## Your own layouts

Save the current layout with Ctrl+S in the switcher. Navo asks for a name of 1 to 40 characters. You can also edit navo.toml by hand. A layout stores shape and sizes, not folders. You can have 20 layouts. The first four take keys 6 to 9.

```toml
[[layout.presets]]
name = "Wide + 2"
tiles = "col(52, pane, row(50, pane, pane))"

[[layout.presets]]
name = "Side by side"
tiles = "row(50, pane, pane)"
```

`row(n, a, b)` puts `a` and `b` side by side. `col(n, a, b)` stacks them. `n` is the size of `a` in percent, from 10 to 90. `pane` is one pane. A bad entry is skipped and the settings notice names it. The rest still load. Layouts are shared by all windows and workspaces. Changes in navo.toml show at once.

## Keys in the switcher (Ctrl+L)

- 1 to 9 apply a layout. Arrows choose one, and Enter applies it.
- V splits the focused pane to the right. S splits it below.
- X closes the focused pane. Its tabs move to the last remaining pane.
- Shift+Left, Right, Up and Down swap the focused pane with its neighbour.
- Ctrl+Left, Right, Up and Down move the nearest divider by 5 percent.
- = makes every split even.
- Tab switches between the active pane and the target pane.
- Ctrl+Shift+1 to Ctrl+Shift+4 focus pane 1 to 4.
- Ctrl+S saves the layout as your own.
- Delete removes the chosen own layout after a question.
- Enter or Esc leaves.

A key bar at the foot lists these keys.

## Keys and mouse outside the switcher

- Ctrl+Shift+1 to Ctrl+Shift+4 focus a pane.
- Tab switches between the active and the target pane.
- F5 and F6 copy or move to the target pane. The target has a dashed outline and an "F5/F6" tag. The active pane header is filled with the accent colour.
- Hold Shift and drag a pane header to another pane to swap them. Esc or a drop outside cancels.
- Drag a divider to resize. A guide line shows the new place. The panes resize when you let go. Sizes stay between 10 and 90 percent.
- Double-click a divider to make that split even.
- Ctrl+Alt+0 makes every divider even. Ctrl+Shift+0 also works where Windows does not take it for the keyboard language.
- In Two by two, each row has its own vertical divider. Ctrl+Left and Right move only the focused pane's row.
- Alt+D edits the path of the active pane. Ctrl+L no longer does this.

## Narrow windows

A pane needs at least 280 by 160 px. Below 900 px of window width, or when a layout cannot give every pane that room, Navo shows only the active pane. A strip above it has one button per pane with its number and folder name. The target is marked. Click a button to switch. Tab and Ctrl+Shift+1 to 4 still work. F5 and F6 show the path of the hidden target in their dialog.

Each workspace keeps its own layout, sizes and target.
