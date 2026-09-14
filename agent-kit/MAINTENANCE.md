# MAINTENANCE.md — the between-features runbook

## Cadence

| Task | When | How |
|---|---|---|
| Issue/PR triage | Weekly, start of cycle | Label, ask for repro, close-with-reason or queue on ROADMAP.md |
| Dependency updates | Weekly (automated) | Merge green Dependabot PRs; batch minors |
| Security advisories | Immediately | SECURITY.md |
| Stale sweep | Automated | `stale.yml` (CI.md) |
| Health check | Per PR + nightly | `{{VERIFY_CMD}}` in CI |

## The ticket pool

Issues are the single pool of work. Three sources fill it:

| Source | How it arrives | Label |
|---|---|---|
| A person | Issue form (`bug`, `enhancement`) | `needs-triage` |
| The roadmap | `roadmap-sync.yml` mirrors each Feature Queue item | `roadmap` |
| The repo itself | `nightly.yml` files a failing gate | `ci-failure` |

The roadmap items are the planned work, already broken into pieces with a
promise each. The other two are unplanned. Triage decides which of them
become roadmap items and which are closed with a reason.

An agent working the pool takes the top `roadmap` + `ready` ticket first,
then `ci-failure`, then triage. It never takes a `needs-triage` ticket as
feature work — an untriaged ticket has no promise, so nothing says when it
is done.

## Triage labels

The list lives in `src/lib/labels.ts` and `label-sync.yml` applies it.
Add a label there, not in Settings. Three axes, at most one of each per
ticket:

| Axis | Labels |
|---|---|
| Kind | `bug` · `enhancement` · `documentation` · `security` · `ci-failure` · `question` |
| State | `needs-triage` · `needs-repro` · `ready` · `in-progress` · `blocked` · `wontfix` · `duplicate` |
| Source | `roadmap` · `feedback` · `dependencies` · `github_actions` · `javascript` |

`good first issue` and `help wanted` are orthogonal and optional.

The sync creates and updates. It never deletes: removing a label strips
it from every issue carrying it. A label on the repository that is not in
the list is reported as `extra` and left alone.

`roadmap-sync.yml` owns the `roadmap` label and the state label on the
issues it generates. Do not hand-edit those issues; change ROADMAP.md.

## Issue lifecycle

new → labeled → (needs-repro?) → accepted (queued on ROADMAP.md if it's
feature-shaped) → in progress → closed by PR or closed-with-reason.
Never close silently; one sentence of why is the minimum.

A feature-shaped ticket that is accepted leaves the pool and comes back
as a `roadmap` ticket once it has a promise and its evidence. The
original ticket closes with a link to it, so the work is in one place.

## Deprecation policy

Deprecate in release N with a warning; remove no earlier than N+2.
Every deprecation gets a CHANGELOG entry under "Deprecated".

## Bus factor

Maintainers: <!-- handles -->. If unmaintained, the intent is:
<!-- archive with notice / hand to org / bless a fork -->.
