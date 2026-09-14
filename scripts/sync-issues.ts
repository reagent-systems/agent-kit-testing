/**
 * Syncs the ROADMAP.md Feature Queue into GitHub issues.
 *
 * The roadmap is the source of work. This script makes the queue visible
 * on GitHub, where feedback already lives. It runs in CI when ROADMAP.md
 * changes on the default branch.
 *
 * Usage:
 *   node scripts/sync-issues.ts --dry-run    # print the plan, no writes
 *   node scripts/sync-issues.ts              # apply it
 *
 * Needs GITHUB_TOKEN and GITHUB_REPOSITORY when it writes.
 */

import { readFileSync } from 'node:fs';
import { parseRoadmap, planSync, type ExistingIssue, type SyncAction } from '../src/lib/roadmap.ts';

const ROADMAP_PATH = 'agent-kit/ROADMAP.md';
const API = process.env.GITHUB_API_URL ?? 'https://api.github.com';

const dryRun = process.argv.includes('--dry-run');

function fail(message: string): never {
	console.error(`sync-issues: ${message}`);
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

interface ApiIssue {
	number: number;
	title: string;
	body: string | null;
	state: 'open' | 'closed';
	labels: { name: string }[];
	pull_request?: unknown;
}

async function listRoadmapIssues(repo: string, token: string): Promise<ExistingIssue[]> {
	const found: ExistingIssue[] = [];

	for (let page = 1; ; page++) {
		const batch = await api<ApiIssue[]>(
			`/repos/${repo}/issues?state=all&labels=roadmap&per_page=100&page=${page}`,
			token
		);
		for (const issue of batch) {
			// The issues endpoint returns pull requests too. Skip them.
			if (issue.pull_request) continue;
			found.push({
				number: issue.number,
				title: issue.title,
				body: issue.body ?? '',
				labels: issue.labels.map((label) => label.name),
				state: issue.state
			});
		}
		if (batch.length < 100) break;
	}

	return found;
}

function describe(action: SyncAction): string {
	switch (action.kind) {
		case 'create':
			return `create   ${action.plan.title}`;
		case 'update':
			return `update   #${action.number} ${action.plan.title}`;
		case 'unchanged':
			return `ok       #${action.number} ${action.plan.title}`;
		case 'close':
			return `close    #${action.number} ${action.title}`;
	}
}

async function apply(action: SyncAction, repo: string, token: string): Promise<void> {
	switch (action.kind) {
		case 'create':
			await api(`/repos/${repo}/issues`, token, {
				method: 'POST',
				body: JSON.stringify({
					title: action.plan.title,
					body: action.plan.body,
					labels: action.plan.labels
				})
			});
			return;
		case 'update':
			await api(`/repos/${repo}/issues/${action.number}`, token, {
				method: 'PATCH',
				body: JSON.stringify({
					title: action.plan.title,
					body: action.plan.body,
					labels: action.plan.labels,
					state: 'open'
				})
			});
			return;
		case 'close':
			await api(`/repos/${repo}/issues/${action.number}`, token, {
				method: 'PATCH',
				body: JSON.stringify({ state: 'closed', state_reason: 'not_planned' })
			});
			return;
		case 'unchanged':
			return;
	}
}

const markdown = readFileSync(ROADMAP_PATH, 'utf8');
const items = parseRoadmap(markdown);
console.log(`Parsed ${items.length} queue item(s) from ${ROADMAP_PATH}.`);

if (dryRun) {
	for (const action of planSync(items, [])) {
		console.log(describe(action));
	}
	console.log('Dry run. Nothing was written.');
	process.exit(0);
}

const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY;
if (!token) fail('GITHUB_TOKEN is not set. Use --dry-run to print the plan instead.');
if (!repo) fail('GITHUB_REPOSITORY is not set, e.g. owner/name.');

const existing = await listRoadmapIssues(repo, token);
const actions = planSync(items, existing);

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
		`closed=${counts.close ?? 0} unchanged=${counts.unchanged ?? 0}`
);
