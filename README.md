# agent-kit-testing

The agent kit proving itself on a real codebase.

`agent-kit/` holds a process an AI agent runs: the contract for changing
code, the queue that decides what gets built, the gate that decides what
ships, and the voice it writes in. The codebase it governs is a SvelteKit
site about the kit. The site renders the kit's own files, so the docs
cannot drift from the process they describe.

## The loop under test

1. **Feedback arrives.** A person opens an issue, or an email becomes one.
2. **The roadmap decides.** `agent-kit/ROADMAP.md` holds the queue. Each
   item carries one testable promise and the evidence that proves it.
3. **The queue becomes tickets.** `roadmap-sync.yml` mirrors each item into
   a labelled GitHub issue. The roadmap stays the source; issues are its
   surface, and the single pool an agent works from.
4. **The agent builds.** It takes the top ready ticket and runs the weekly
   cycle: spec, build, prove, document, ship.
5. **The gate decides.** `npm run verify` answers whether the repo is
   healthy. No green, no push.
6. **The work is told.** The devlog records what happened. The blog-post
   skill turns it into a post. This site publishes it.

Maintenance and marketing run on the same cycle.

## Stack

SvelteKit 2 with Svelte 5 in runes mode, TypeScript, Vite 8, and
`@sveltejs/adapter-node`. Requires Node 22 or later.

## Commands

```sh
npm install
npm run dev       # dev server
npm run build     # production build into build/
npm run verify    # the gate: lint, check, build, test
```

CI runs the same `npm run verify`.

## The roadmap sync

```sh
node scripts/sync-issues.ts --dry-run   # print the plan, write nothing
node scripts/sync-issues.ts             # apply it
```

Applying needs `GITHUB_TOKEN` and `GITHUB_REPOSITORY`. In CI this runs
from `.github/workflows/roadmap-sync.yml` on a push to `main` that touches
the roadmap. On a pull request it prints the plan and writes nothing.

Issues it generates are overwritten on the next run. To change one, change
`agent-kit/ROADMAP.md`.

## Testing

Vitest runs two projects. `server` runs unit tests in Node. `client` runs
component tests in a real Chromium through Playwright.

The component tests need a Chromium. Install one with
`npx playwright install chromium`, or point at one already on the machine:

```sh
CHROMIUM_PATH=/path/to/chromium npm run verify
```

Without a Chromium the gate fails rather than skipping. That contradicts
`agent-kit/VERIFICATION.md` and is item 1 on the queue.

## Process

Start at [`agent-kit/ROUTING.md`](agent-kit/ROUTING.md). It says which file
governs which situation.

The kit is partly tailored. The roadmap and use cases describe this
repository, but `{{PLACEHOLDER}}` values remain in other kit files.
Finishing that is item 4 on the queue.
