# Writing rules

How Ferrite text is written. These rules cover specs, commits, release notes, the changelog and pull requests.

## One rule

Human text never shows plan ids, atom ids, branch names, file paths or internal type names. Ids go only on a trailing `Refs:` line.

Key names (Ctrl+K), menu names and setting names are fine. Use the product name Ferrite, not the codename.

## Two-layer specs

- `docs/features/<feature>.md` is for people. It says what you can do, which keys, what was decided and what is still open.
- The owner approves the human spec first.
- The atomic plans under `plans/` are derived from it. They are for agents only.
- A human spec has: what it is, what you can do, keys, settings, decisions, done versus coming, open questions, and a final `Refs:` line.
- Keep each spec under about 120 lines.

## Commits and merges

- The subject says what changed for the user, in plain words.
- An optional short area prefix is fine: `ui:`, `fs:`, `docs:`, `plans:`.
- The body is optional.
- Then a `Refs:` line with the ids, then the attribution line.
- No absolute paths and no session links.

Bad: a merge subject that shows a branch name, a plan id and an atom id.

Good: `Multi-rename: names with two dots keep their extension`

Footer for the good example:

```
Refs: P41 A10b
Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
```

## Release notes

Use this order. Leave out empty sections.

1. New
2. Fixed
3. Built but not switched on yet
4. Known problems
5. Check on the work PC
6. One download line

The documenter writes the notes. The deployer publishes them.

"Built but not switched on yet" lists work that exists but that you cannot try. Never present it as a feature.

## Changelog

- `CHANGELOG.md` holds one entry per release, in the same words as the release notes.
- The roadmap is updated from the changelog. Nobody writes the same text twice.

## Pull requests

Pull requests are not used now. Changes merge locally.

If outside contributions start, use a template with four parts:

- What changes for the user.
- How to check it.
- The risk.
- Refs.

## Controlled English

- Short sentences, 15 to 20 words, in the active voice.
- One idea per sentence. One instruction per bullet.
- One term for one concept.
- No filler, hype or idioms.
- Keep numbers exact. Recompute progress the way the page already does.
