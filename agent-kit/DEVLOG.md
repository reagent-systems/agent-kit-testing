# DEVLOG.md — the live devlog

The plain history of this project. A person who knows nothing about the
code reads this file and knows what happened, in order, with no jargon.
Append only. Never rewrite an old entry — a wrong entry gets a
correction entry, not an edit.

Write every entry in the voice of `TONE.md`.

## Entry shape

Every entry has the same shape:

```
## YYYY-MM-DD — <one line: what happened>

<What we did. What worked. What broke. What we learned.
3–10 short sentences. Plain words. Past tense for what happened,
present tense for how things now stand.>

Evidence: <commit / tag / gate run / screenshot>
```

## When to write

- Every WEEKLY.md cycle writes one entry at step 5 (before merge).
- A failed or abandoned attempt gets an entry too. The devlog records
  what happened, not what succeeded. A week with no shipped feature
  still gets its entry.
- Out-of-band work (security patch, gate repair, big triage) gets one.
- SETUP.md writes the first entry: "Installed the agent kit."

## What does not go here

- Code detail that belongs in commit messages.
- Promises about the future — that is ROADMAP.md.
- State claims — that is STATUS.md. The devlog is the story; STATUS is
  the snapshot.

---

<!-- Entries below, newest first. -->

## 2026-09-14 — Put the site on GitHub Pages

We created `main` from the working branch and made it the branch the
workflows watch. Dependabot noticed within a minute and opened 7 branches,
which is the first sign the automation is live.

We moved the site to GitHub Pages. That meant changing the adapter again.
We picked adapter-node two days ago because the default adapter built
nothing runnable. Pages serves files, not a server, so adapter-static is
now the right one. Every page already prerendered, so the change was the
adapter and two page options: a directory per page, and a 404 fallback.

The build turned out to use relative URLs. That means the site works at
the root and under a subdirectory without being told which. We proved it
by copying the build into a subdirectory and serving it: 5 routes answered
200, and a page 2 levels deep fetched its assets through `../../`.

Two settings still need a human. The repository is not renamed, and the
default branch is still the old working branch. The API proxy we work
through refuses repository settings writes, so both are Settings clicks.
Pages needs one too: its source must be set to GitHub Actions.

Evidence: `npm run verify` green. 4 test files, 36 tests, 0 failures.
27 HTML files in `build/`, served from `/agent-kit-testing/` with every
route answering 200.

## 2026-09-14 — Installed the kit, then gave it something to work on

We installed the agent kit into an empty repository. The kit is 22 markdown
files. They set the contract for changing code, the queue that decides what
gets built, and the gate that decides what ships.

An empty repository cannot prove any of that. So we built the codebase the
kit governs: a SvelteKit site about the kit itself. The site renders the
kit's own files, so the docs cannot drift from the process they describe.

We added one gate, `npm run verify`. It runs the lint, the type check, the
build and the tests, in that order. The same command runs in CI.

Two things broke. The default SvelteKit adapter detected no production
environment, so the build passed while producing nothing runnable; we
switched to adapter-node. The component tests then failed because this
machine has Chromium build 1194 and the installed Playwright wants 1243. We
made the browser path overridable rather than pin the repository to one
machine. The gate still fails hard where no Chromium exists, which breaks
the rule in VERIFICATION.md that a gate skips loudly. That is now item 1 on
the queue.

We also wired the roadmap to GitHub. A CI job parses the Feature Queue and
mirrors each item into an issue. The roadmap stays the source; the issues
are its surface. Writing the tests for it found a real bug before it
shipped: an issue whose body was edited by hand lost its marker, and the
next run filed a duplicate. Matching on the title as a fallback fixed it.

Evidence: `npm run verify` green at the install commit. 4 test files,
27 tests, 0 failures.
