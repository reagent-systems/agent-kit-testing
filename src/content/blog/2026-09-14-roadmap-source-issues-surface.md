---
title: The roadmap is the source, the issues are the surface
date: 2026-09-14
tags: [kit, roadmap, ci]
---

The Feature Queue in `ROADMAP.md` now appears as GitHub issues. A CI job
reads the queue and files one issue per item. You can see the work the
agent will do next without opening the repository.

The roadmap does not move. It stays the source of work, in git, where a
change carries review, history and blame. The issues are generated from
it. An edit made on an issue is overwritten on the next run, and the
issue body says so.

## How it looks

Each queue item in the roadmap looks like this:

```markdown
### 1. Skip the browser gate loudly

- **Promise:** `npm run verify` passes on a machine with no Chromium,
  and prints one line naming the component tests it skipped.
- **Evidence:** The gate run with the Chromium removed from the path
  exits 0 and prints the skip line.
- **Status:** ready
```

The job turns that into an issue titled `[roadmap] Skip the browser gate
loudly`, labelled `roadmap` and `ready`, with the promise and the
evidence in the body. When the status changes to `blocked`, the label
changes with it. When the item leaves the queue, the issue closes.

The job runs on a push to `main` that touches the roadmap. On a pull
request it prints the plan and writes nothing, so a roadmap change can be
reviewed before it files anything.

## What broke

The first version identified an issue by a hidden marker in its body. That
works until somebody edits the issue. The marker goes, the next run finds
no match, and it files a duplicate.

A test caught it before it shipped. The fix is small: match on the marker,
fall back to the title, and restore the marker on the update. The test
that found it is now the test that keeps it fixed:

```
it('updates an issue whose body lost the marker, rather than filing a duplicate')
```

This is the point of writing the gate before the feature. The bug was
cheap on a Saturday and expensive after it had filed forty duplicate
issues.

## The wider loop

The queue is one half. Feedback is the other. A user sends an email, it
becomes an issue, and triage either closes it with a reason or puts it on
the roadmap. Both halves end in the same place, so no work is tracked
twice.

Two pieces of that are not built. Email intake is item 3 on the queue and
is blocked on a decision about which mailbox CI may read. And the gate
still fails hard on a machine with no Chromium, when `VERIFICATION.md`
says a gate that cannot run must skip loudly. That is item 1, and it ships
next.

This post was written from `DEVLOG.md`, which is the rule here: the
write-up is part of shipping, not work that happens afterwards.
