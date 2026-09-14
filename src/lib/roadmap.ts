/**
 * Parses the Feature Queue in `agent-kit/ROADMAP.md`.
 *
 * ROADMAP.md is the single source of work. This parser is the seam that
 * turns it into GitHub issues, so the queue is visible where people
 * already look. The roadmap stays the source; issues are its surface.
 */

export type StatusKind = 'ready' | 'blocked' | 'in-progress' | 'unknown';

export interface RoadmapItem {
	/** 1-based position in the queue. Position is priority. */
	position: number;
	name: string;
	promise: string;
	evidence: string;
	useCase: string;
	scopeGuard: string;
	/** The Status field verbatim, e.g. `blocked on the adapter rewrite`. */
	status: string;
	statusKind: StatusKind;
	/** Stable identity, derived from the name. */
	slug: string;
}

const QUEUE_HEADING = /^##\s+Feature Queue\b/;
const NEXT_SECTION = /^##\s+(?!#)/;
const ITEM_HEADING = /^###\s+(\d+)\.\s*(.+?)\s*$/;
const FIELD = /^[-*]\s+\*\*(.+?):\*\*\s*(.*)$/;

const FIELD_KEYS: Record<string, keyof RoadmapItem> = {
	promise: 'promise',
	evidence: 'evidence',
	'use case': 'useCase',
	'scope guard': 'scopeGuard',
	status: 'status'
};

/**
 * True when an item is still the kit's unfilled template, e.g.
 * `### 1. <feature name>` with `- **Promise:** …`. SETUP.md replaces
 * these. Syncing them would file placeholder issues.
 */
export function isTemplateItem(item: RoadmapItem): boolean {
	if (item.name === '' || /^<.*>$/.test(item.name)) return true;
	const promise = item.promise.trim();
	return promise === '' || promise === '…' || /^<.*>$/.test(promise);
}

export function classifyStatus(status: string): StatusKind {
	const value = status.trim().toLowerCase();
	if (value.startsWith('ready')) return 'ready';
	if (value.startsWith('blocked')) return 'blocked';
	if (value.startsWith('in progress')) return 'in-progress';
	return 'unknown';
}

export function slugify(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60);
}

/** Extracts the Feature Queue section, without the headings around it. */
function queueSection(markdown: string): string[] {
	const lines = markdown.replace(/\r\n/g, '\n').split('\n');
	const start = lines.findIndex((line) => QUEUE_HEADING.test(line));
	if (start === -1) return [];

	const rest = lines.slice(start + 1);
	const end = rest.findIndex((line) => NEXT_SECTION.test(line));
	return end === -1 ? rest : rest.slice(0, end);
}

export function parseRoadmap(markdown: string): RoadmapItem[] {
	const items: RoadmapItem[] = [];
	let current: RoadmapItem | undefined;

	for (const line of queueSection(markdown)) {
		const heading = ITEM_HEADING.exec(line);
		if (heading) {
			const name = heading[2].trim();
			current = {
				position: Number(heading[1]),
				name,
				promise: '',
				evidence: '',
				useCase: '',
				scopeGuard: '',
				status: '',
				statusKind: 'unknown',
				slug: slugify(name)
			};
			items.push(current);
			continue;
		}

		if (!current) continue;

		const field = FIELD.exec(line.trim());
		if (!field) continue;

		const key = FIELD_KEYS[field[1].trim().toLowerCase()];
		if (!key) continue;

		const value = field[2].trim();
		if (key === 'status') {
			current.status = value;
			current.statusKind = classifyStatus(value);
		} else if (key !== 'position' && key !== 'statusKind' && key !== 'slug') {
			current[key] = value;
		}
	}

	return items;
}

/** The queue item the agent takes next: the top item that is ready. */
export function topReadyItem(items: RoadmapItem[]): RoadmapItem | undefined {
	return items
		.filter((item) => !isTemplateItem(item) && item.statusKind === 'ready')
		.sort((a, b) => a.position - b.position)[0];
}

export interface IssuePlan {
	slug: string;
	title: string;
	body: string;
	labels: string[];
}

/** The hidden marker that ties an issue back to its roadmap item. */
export function markerFor(slug: string): string {
	return `<!-- roadmap-item: ${slug} -->`;
}

export function findMarker(body: string): string | undefined {
	return /<!--\s*roadmap-item:\s*([a-z0-9-]+)\s*-->/.exec(body)?.[1];
}

// The state labels in src/lib/labels.ts. labels.spec.ts asserts every
// value here exists there.
const LABEL_BY_STATUS: Record<StatusKind, string> = {
	ready: 'ready',
	blocked: 'blocked',
	'in-progress': 'in-progress',
	unknown: 'needs-triage'
};

/** Renders a roadmap item as the issue that represents it. */
export function issueFor(item: RoadmapItem): IssuePlan {
	const rows = [
		['Promise', item.promise],
		['Evidence', item.evidence],
		['Use case', item.useCase],
		['Scope guard', item.scopeGuard],
		['Status', item.status],
		['Queue position', String(item.position)]
	].filter(([, value]) => value !== '');

	const body = [
		markerFor(item.slug),
		'',
		'This issue tracks a Feature Queue item in `agent-kit/ROADMAP.md`.',
		'The roadmap is the source. This issue is generated from it, so edits',
		'here are overwritten. Change the roadmap instead.',
		'',
		...rows.map(([label, value]) => `**${label}:** ${value}`),
		''
	].join('\n');

	return {
		slug: item.slug,
		title: `[roadmap] ${item.name}`,
		body,
		labels: ['roadmap', LABEL_BY_STATUS[item.statusKind]]
	};
}

export type SyncAction =
	| { kind: 'create'; plan: IssuePlan }
	| { kind: 'update'; plan: IssuePlan; number: number }
	| { kind: 'unchanged'; plan: IssuePlan; number: number }
	| { kind: 'close'; number: number; title: string };

export interface ExistingIssue {
	number: number;
	title: string;
	body: string;
	labels: string[];
	state: 'open' | 'closed';
}

/**
 * Decides what to do to make the issues match the queue.
 *
 * An item with no issue is created. An item whose issue drifted is
 * updated. An issue whose item left the queue is closed — the roadmap
 * removed it, so it is no longer work.
 */
export function planSync(items: RoadmapItem[], existing: ExistingIssue[]): SyncAction[] {
	const live = items.filter((item) => !isTemplateItem(item));

	// An issue is identified by its marker. A hand-edited body can lose the
	// marker, so the title is the fallback — matching on it updates the
	// issue and restores the marker instead of filing a duplicate.
	const bySlug = new Map<string, ExistingIssue>();
	const byTitle = new Map<string, ExistingIssue>();
	for (const issue of existing) {
		const slug = findMarker(issue.body);
		if (slug) bySlug.set(slug, issue);
		byTitle.set(issue.title, issue);
	}

	const matched = new Set<number>();
	const actions: SyncAction[] = [];
	for (const item of live) {
		const plan = issueFor(item);
		const issue = bySlug.get(item.slug) ?? byTitle.get(plan.title);
		if (!issue) {
			actions.push({ kind: 'create', plan });
			continue;
		}

		matched.add(issue.number);
		const same =
			issue.title === plan.title &&
			issue.body.trim() === plan.body.trim() &&
			sameLabels(issue.labels, plan.labels) &&
			issue.state === 'open';
		actions.push(
			same
				? { kind: 'unchanged', plan, number: issue.number }
				: { kind: 'update', plan, number: issue.number }
		);
	}

	for (const issue of existing) {
		if (!matched.has(issue.number) && issue.state === 'open') {
			actions.push({ kind: 'close', number: issue.number, title: issue.title });
		}
	}

	return actions;
}

function sameLabels(left: string[], right: string[]): boolean {
	const a = [...new Set(left)].sort();
	const b = [...new Set(right)].sort();
	return a.length === b.length && a.every((value, index) => value === b[index]);
}
