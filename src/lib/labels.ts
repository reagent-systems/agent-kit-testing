/**
 * The label taxonomy for the issues tab.
 *
 * Labels are the ticket pool's index. An agent picks work by them, so
 * they are defined here and applied by CI, not by hand in Settings.
 * `scripts/sync-labels.ts` applies this list.
 *
 * Three axes, and a ticket carries at most one of each:
 *   kind   — what it is
 *   state  — where it is
 *   source — where it came from
 *
 * `help` labels are orthogonal and optional.
 */

export type LabelAxis = 'kind' | 'state' | 'source' | 'help';

export interface Label {
	name: string;
	/** Six hex digits, no leading `#`. */
	color: string;
	description: string;
	axis: LabelAxis;
}

export const LABELS: readonly Label[] = [
	// Kind — what it is.
	{
		name: 'bug',
		color: 'd73a4a',
		description: 'Behaves differently from how it is documented.',
		axis: 'kind'
	},
	{
		name: 'enhancement',
		color: 'a2eeef',
		description: 'A request for behavior the project does not have.',
		axis: 'kind'
	},
	{
		name: 'documentation',
		color: '0075ca',
		description: 'The docs are wrong, missing or unclear.',
		axis: 'kind'
	},
	{
		name: 'security',
		color: 'b60205',
		description: 'Handled per SECURITY.md. Overrides normal process.',
		axis: 'kind'
	},
	{
		name: 'ci-failure',
		color: 'd93f0b',
		description: 'A gate failed. Filed by nightly.yml.',
		axis: 'kind'
	},
	{
		name: 'question',
		color: 'd876e3',
		description: 'Asks for information, not for a change.',
		axis: 'kind'
	},

	// State — where it is. Triage moves a ticket along this axis.
	{
		name: 'needs-triage',
		color: 'fbca04',
		description: 'Not yet accepted. No promise, so it is not work an agent takes.',
		axis: 'state'
	},
	{
		name: 'needs-repro',
		color: 'fef2c0',
		description: 'Waiting on steps that reproduce it.',
		axis: 'state'
	},
	{
		name: 'ready',
		color: '0e8a16',
		description: 'Accepted and has a promise. An agent may start it.',
		axis: 'state'
	},
	{
		name: 'in-progress',
		color: '1d76db',
		description: 'Being worked now. One ticket at a time per agent.',
		axis: 'state'
	},
	{
		name: 'blocked',
		color: 'e99695',
		description: 'Waiting on a decision or another ticket.',
		axis: 'state'
	},
	{
		name: 'wontfix',
		color: 'ffffff',
		description: 'Closed on purpose. The reason is in the thread.',
		axis: 'state'
	},
	{
		name: 'duplicate',
		color: 'cfd3d7',
		description: 'Already tracked by another ticket, which is linked.',
		axis: 'state'
	},

	// Source — where it came from.
	{
		name: 'roadmap',
		color: '5319e7',
		description: 'Generated from the ROADMAP.md Feature Queue. Edits here are overwritten.',
		axis: 'source'
	},
	{
		name: 'feedback',
		color: 'c2e0c6',
		description: 'Came from a user, by email or the issue form.',
		axis: 'source'
	},
	{
		name: 'dependencies',
		color: '0366d6',
		description: 'Updates a dependency. Opened by Dependabot.',
		axis: 'source'
	},
	{
		name: 'github_actions',
		color: '000000',
		description: 'Updates a GitHub Actions workflow. Opened by Dependabot.',
		axis: 'source'
	},
	{
		name: 'javascript',
		color: '168700',
		description: 'Updates JavaScript code. Opened by Dependabot.',
		axis: 'source'
	},

	// Help — orthogonal, for human contributors.
	{
		name: 'good first issue',
		color: '7057ff',
		description: 'Small and self-contained. A good place to start.',
		axis: 'help'
	},
	{
		name: 'help wanted',
		color: '008672',
		description: 'The maintainers would welcome a hand with this.',
		axis: 'help'
	}
];

export function labelsByAxis(axis: LabelAxis): Label[] {
	return LABELS.filter((label) => label.axis === axis);
}

export function findLabel(name: string): Label | undefined {
	return LABELS.find((label) => label.name === name);
}

export interface ExistingLabel {
	name: string;
	color: string;
	description: string;
}

export type LabelAction =
	| { kind: 'create'; label: Label }
	| { kind: 'update'; label: Label }
	| { kind: 'unchanged'; label: Label }
	| { kind: 'extra'; name: string };

/**
 * Decides what to do to make the repository's labels match this list.
 *
 * A label in the list but not on the repository is created. One whose
 * color or description drifted is updated. A label on the repository
 * that is not in the list is reported as `extra` and left alone —
 * deleting a label strips it from every issue carrying it, which is not
 * a thing to do as a side effect of a config change.
 */
export function planLabelSync(existing: ExistingLabel[]): LabelAction[] {
	const byName = new Map(existing.map((label) => [label.name, label]));
	const actions: LabelAction[] = [];

	for (const label of LABELS) {
		const found = byName.get(label.name);
		if (!found) {
			actions.push({ kind: 'create', label });
			continue;
		}
		const same =
			found.color.toLowerCase() === label.color.toLowerCase() &&
			found.description === label.description;
		actions.push({ kind: same ? 'unchanged' : 'update', label });
	}

	const wanted = new Set(LABELS.map((label) => label.name));
	for (const label of existing) {
		if (!wanted.has(label.name)) actions.push({ kind: 'extra', name: label.name });
	}

	return actions;
}
