# ROADMAP.md — the source of all work

**This file is not optional.** Every feature the agent builds flows down
from here. If it isn't on this roadmap, it doesn't get built; if it needs
building, it gets added here first. One item ships per weekly cycle
(see `WEEKLY.md`).

A CI job mirrors the Feature Queue below into GitHub issues
(`.github/workflows/roadmap-sync.yml`). The roadmap is the source. The
issues are its surface, so the queue is visible where feedback arrives.
Edits made on an issue are overwritten; change this file instead.

## North star

agent-kit-testing is the kit proving itself on a real codebase. The
repository holds a SvelteKit site about the kit, and the kit runs the
repository. Every claim the site makes about automated maintenance and
automated marketing is a claim this repository has to demonstrate on
itself: the queue below ships features, the gate proves them, and the
blog publishes the write-up from the devlog. A reader who doubts the kit
can read this repository's history and check.

## Feature Queue — ordered; top unblocked item ships next

<!-- RULES:
     · Always ≥3 ready items. Refilling the queue is part of every weekly
       cycle (WEEKLY.md step 7) — a starving queue is a failed cycle.
     · Order is priority. The agent takes the TOP unblocked item and may
       not reorder without recording why (below, under "Queue changes").
     · Every item carries a completion promise: ONE testable sentence
       that is unambiguously true or false. No promise, not ready.
     · "Evidence" names how the promise will be proven: which gate,
       screenshot, benchmark, or user-visible behavior. -->

### 1. Skip the browser gate loudly

- **Promise:** `npm run verify` passes on a machine with no Chromium, and prints one line naming the component tests it skipped.
- **Evidence:** The gate run with the Chromium removed from the path exits 0 and prints the skip line; the same run with Chromium present runs the component tests.
- **Use case:** Run the gate — the gate must give one answer in every environment.
- **Scope guard:** Does not add new component tests. Does not change the server test project.
- **Status:** ready

### 2. Publish a feed for the blog

- **Promise:** `/blog/rss.xml` returns a valid RSS 2.0 feed listing every post, newest first.
- **Evidence:** The built feed validates against the RSS 2.0 schema, and its item count equals the post count in `src/content/blog/`.
- **Use case:** Publish the write-up — marketing automation needs a channel that does not depend on a human posting a link.
- **Scope guard:** RSS only. No email digest, no social syndication.
- **Status:** ready

### 3. Turn email feedback into issues

- **Promise:** A message in the feedback mailbox becomes one GitHub issue labelled `feedback`, with the sender's text quoted and no duplicate for a message already filed.
- **Evidence:** A test run against a recorded mailbox fixture files 3 issues from 4 messages, skipping the duplicate, and the parser has unit tests for the dedupe key.
- **Use case:** Collect feedback — the inbound half of the loop the site describes.
- **Scope guard:** Intake only. Does not triage, label by topic, or reply to the sender.
- **Status:** blocked on a decision about which mailbox and which credential CI may use

### 4. Finish the kit tailoring

- **Promise:** No `{{PLACEHOLDER}}` string remains anywhere under `agent-kit/`, and `docs/ARCHITECTURE.md`, `docs/CONFIGURATION.md` and `docs/STYLE.md` describe this repository.
- **Evidence:** A grep for `{{` under `agent-kit/` returns nothing, and the gate stays green.
- **Use case:** Install the kit — SETUP.md is unfinished until this is true.
- **Scope guard:** Fills the existing kit files. Does not add new kit files or change the process.
- **Status:** ready

## Later — candidates, not yet specced

- Render the STATUS table on the site — the project's state becomes a page, not a file a reader has to find.
- A nightly link check over the rendered docs — the kit's cross-references rot silently as files are renamed.
- Sub-issues per roadmap item — GitHub can hold the task breakdown the kit currently keeps in plan files.

## Shipped

<!-- Move queue items here when done, newest first, with the release tag
     and the evidence link. This is the project's real history of intent. -->

| Week       | Feature                   | Release | Evidence                                                                                                                                            |
| ---------- | -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-14 | Agent-kit download button | —       | `npm run verify` green; `static/agent-kit.zip` built by `scripts/build-agent-kit-zip.ts`, round-tripped in `src/lib/server/zip.spec.ts`; issue #12 |

## Explicitly not doing

- A web UI for editing the roadmap — the roadmap is a file in git so that changes carry review, history and blame. A form loses all three.
- Auto-merging the agent's own pull requests — the gate decides what ships, a human decides what merges. That line stays.

## Queue changes

<!-- Any reorder, insertion above position 3, or item removal gets one
     line here: date, what changed, why. -->

- 2026-09-14 — Seeded the queue with 4 items. It was the kit's unfilled template. Items 1 and 4 come from gaps found while installing the kit; items 2 and 3 come from the loop the site describes but the repository does not yet run.
- 2026-09-14 — A human filed issue #12 asking for a download button for the kit and it shipped the same day, ahead of the queue above. It did not come through the roadmap first because the queue tooling here mirrors ROADMAP.md into issues, not the other way; a human-filed issue is feedback, not a queue entry. Recorded here and in Shipped so the roadmap stays the record of what actually happened.
