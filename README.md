# repo-automation-test

A sacrificial test repo. It exists to test one idea: GitHub Issues as the
input channel and the work queue for an autonomous development agent.

The intended shape:

1. User feedback arrives by email.
2. Each item becomes a GitHub issue.
3. Issues feed `agent-kit/ROADMAP.md`.
4. An agent takes the top ready item, builds it, verifies it, and ships it.
5. The cycle repeats.

The codebase under test is a SvelteKit app. It gives the agent real code
to change and a real gate to pass.

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

`npm run verify` is the one command that answers "is this repo healthy".
CI runs the same command.

## Testing

Vitest runs two projects. `server` runs plain unit tests in Node.
`client` runs component tests in a real Chromium through Playwright.

The component tests need a Chromium. Install one with
`npx playwright install chromium`, or set `CHROMIUM_PATH` to a Chromium
that is already on the machine:

```sh
CHROMIUM_PATH=/path/to/chromium npm run verify
```

## Process

`agent-kit/` holds the process files that govern the agent. Start at
`agent-kit/ROUTING.md`.

The kit is not tailored yet. `agent-kit/SETUP.md` has not run, so
`{{PLACEHOLDER}}` values are still present and the roadmap has no seeded
queue.
