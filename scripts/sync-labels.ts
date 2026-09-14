/**
 * Applies the label taxonomy in src/lib/labels.ts to the repository.
 *
 * Labels are the ticket pool's index, so they are defined in git and
 * applied by CI. This script creates a missing label and updates one
 * whose color or description drifted. It never deletes: removing a label
 * strips it from every issue carrying it.
 *
 * Usage:
 *   node scripts/sync-labels.ts --dry-run    # print the plan, no writes
 *   node scripts/sync-labels.ts              # apply it
 *
 * Needs GITHUB_TOKEN and GITHUB_REPOSITORY when it writes.
 */

import { LABELS, planLabelSync, type ExistingLabel, type LabelAction } from '../src/lib/labels.ts';

const API = process.env.GITHUB_API_URL ?? 'https://api.github.com';
const dryRun = process.argv.includes('--dry-run');

function fail(message: string): never {
	console.error(`sync-labels: ${message}`);
	process.exit(1);
}

async function api<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
	const response = await fetch(`${API}${path}`, {
		...init,
		headers: {
			accept: 'application/vnd.github+json',
			authorization: `Bearer ${token}`,
			'content-type': 'application/json',
			'x-github-api-version': '2022-11-28',
			...init.headers
		}
	});

	if (!response.ok) {
		fail(`${init.method ?? 'GET'} ${path} returned ${response.status}: ${await response.text()}`);
	}

	return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

interface ApiLabel {
	name: string;
	color: string;
	description: string | null;
}

async function listLabels(repo: string, token: string): Promise<ExistingLabel[]> {
	const found: ExistingLabel[] = [];

	for (let page = 1; ; page++) {
		const batch = await api<ApiLabel[]>(`/repos/${repo}/labels?per_page=100&page=${page}`, token);
		for (const label of batch) {
			found.push({ name: label.name, color: label.color, description: label.description ?? '' });
		}
		if (batch.length < 100) break;
	}

	return found;
}

function describe(action: LabelAction): string {
	switch (action.kind) {
		case 'create':
			return `create     ${action.label.name}`;
		case 'update':
			return `update     ${action.label.name}`;
		case 'unchanged':
			return `ok         ${action.label.name}`;
		case 'extra':
			return `extra      ${action.name} (not in the list, left alone)`;
	}
}

async function apply(action: LabelAction, repo: string, token: string): Promise<void> {
	if (action.kind === 'unchanged' || action.kind === 'extra') return;

	const body = JSON.stringify({
		name: action.label.name,
		color: action.label.color,
		description: action.label.description
	});

	if (action.kind === 'create') {
		await api(`/repos/${repo}/labels`, token, { method: 'POST', body });
		return;
	}

	await api(`/repos/${repo}/labels/${encodeURIComponent(action.label.name)}`, token, {
		method: 'PATCH',
		body
	});
}

console.log(`Defined ${LABELS.length} label(s) in src/lib/labels.ts.`);

if (dryRun) {
	for (const action of planLabelSync([])) {
		console.log(describe(action));
	}
	console.log('Dry run. Nothing was written.');
	process.exit(0);
}

const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY;
if (!token) fail('GITHUB_TOKEN is not set. Use --dry-run to print the plan instead.');
if (!repo) fail('GITHUB_REPOSITORY is not set, e.g. owner/name.');

const actions = planLabelSync(await listLabels(repo, token));

for (const action of actions) {
	console.log(describe(action));
	await apply(action, repo, token);
}

const counts = actions.reduce<Record<string, number>>((totals, action) => {
	totals[action.kind] = (totals[action.kind] ?? 0) + 1;
	return totals;
}, {});
console.log(
	`Done. created=${counts.create ?? 0} updated=${counts.update ?? 0} ` +
		`unchanged=${counts.unchanged ?? 0} extra=${counts.extra ?? 0}`
);
