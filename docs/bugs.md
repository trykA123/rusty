# Known bugs

Open bugs found by the owner or by reviews that are parked on purpose. Each line: date, what happens, how to reproduce, where it was seen. Fixed bugs move to the log of the plan that fixed them.

## Open

- **2026-10-16 · Follow shows no new lines (owner, alpha-2026-10-16c, Windows).** Open a log in F3, press Alt+F, append lines from VS Code and save: nothing new appears. Parked by the owner ("il notam ca bug si il rezolvam mai tarziu"). Next step: a checker reproduces it on Windows CI with a writer process (append in place, and a VS Code style save) and proves the root cause before any fix.
- **2026-10-16 · Enter in an archive shows "A folder: its files are listed by their full path." on a file row (owner, alpha-2026-10-16b, an `.xlsx`).** Not reproduced on Linux with an xlsx-like zip or with directory entries; regression tests added. Waiting for the owner's exact steps (row, filter text).
- **2026-10-16 · Opening a text file builds the editor on the UI thread** (about 48 ms per MB in release; 0.6 s for 15 MB). Found while fixing the Backspace freeze.
