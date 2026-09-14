# repo-automation-test

A sacrificial test repo. It exists to test one idea: GitHub Issues as the
input channel and the work queue for an autonomous development agent.

The intended shape:

1. User feedback arrives by email.
2. Each item becomes a GitHub issue.
3. Issues feed `agent-kit/ROADMAP.md`.
4. An agent takes the top ready item, builds it, verifies it, and ships it.
5. The cycle repeats.

`agent-kit/` holds the process files that govern that agent. Start at
`agent-kit/ROUTING.md`.

## State

The kit is installed but not tailored. `agent-kit/SETUP.md` has not run,
so `{{PLACEHOLDER}}` values are still present and there is no project
code, no verify command, and no seeded roadmap.
