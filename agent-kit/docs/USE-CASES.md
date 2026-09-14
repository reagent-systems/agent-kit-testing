# Use cases

Each case has the same shape.
**Trigger** states what starts the case, **Run** states what happens, and **Outcome** states what the reader is left with.

## Install the kit

**Trigger.** You put `agent-kit/` in a repository and point an agent at it.
**Run.** The agent reads `SETUP.md`, fills every placeholder from the repository itself, seeds the Feature Queue, and creates the gate.
**Outcome.** The repository has one contract, one queue and one command that answers whether it is healthy.

## Ship a feature

**Trigger.** A human says "push the weekly feature", or the weekly schedule fires.
**Run.** The agent takes the top ready item, sharpens its promise, builds it in a loop, and proves it with the named evidence.
**Outcome.** One queue item is released, with the changelog, status, roadmap and devlog updated in the same branch.

## Run the gate

**Trigger.** Any change is about to be pushed.
**Run.** One command runs the lint, the type check, the build and the tests, in that order, locally and in CI.
**Outcome.** The change is green, or it does not ship. A gate that cannot run in an environment says so and does not pass silently.

## Collect feedback

**Trigger.** A user sends an email about the project.
**Run.** The message becomes a GitHub issue. Triage labels it and queues it on the roadmap if it is feature-shaped.
**Outcome.** Feedback enters the same queue as planned work, so nothing is tracked in two places.

## Read the queue on GitHub

**Trigger.** The Feature Queue in `ROADMAP.md` changes on the default branch.
**Run.** A CI job mirrors each queue item into a labelled issue, updates the issues that drifted, and closes the issues whose items left the queue.
**Outcome.** A reader sees the same queue on GitHub that the agent works from, without the roadmap losing its place as the source.

## Publish the write-up

**Trigger.** A cycle ends and the devlog has a new entry.
**Run.** The blog-post skill turns the entry into a post for a reader who does not work on the project, and saves it with the other posts.
**Outcome.** The site publishes the post. The marketing of a change ships on the same cycle as the change.

## Read the record

**Trigger.** Someone asks where the project stands, or what happened in a given week.
**Run.** `STATUS.md` answers the first question with evidence. `DEVLOG.md` answers the second, in order, including the weeks that broke.
**Outcome.** The reader gets one answer, not a reconstruction from commits.
