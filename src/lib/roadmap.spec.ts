import { describe, expect, it } from 'vitest';
import {
	classifyStatus,
	findMarker,
	isTemplateItem,
	issueFor,
	parseRoadmap,
	planSync,
	slugify,
	topReadyItem,
	type ExistingIssue
} from './roadmap';

const ROADMAP = [
	'# ROADMAP.md',
	'',
	'## North star',
	'',
	'Something.',
	'',
	'## Feature Queue — ordered; top unblocked item ships next',
	'',
	'### 1. Skip the browser gate loudly',
	'- **Promise:** The gate passes with no Chromium and prints one skip line.',
	'- **Evidence:** The gate run exits 0.',
	'- **Use case:** Run the gate',
	'- **Scope guard:** No new component tests.',
	'- **Status:** ready',
	'',
	'### 2. Publish a feed',
	'- **Promise:** `/blog/rss.xml` returns a valid feed.',
	'- **Evidence:** The feed validates.',
	'- **Status:** blocked on a decision about the domain',
	'',
	'## Later — candidates, not yet specced',
	'',
	'### 9. Not a queue item',
	'- **Promise:** Should never be parsed.',
	''
].join('\n');

describe('parseRoadmap', () => {
	it('reads the queue items and their fields', () => {
		const items = parseRoadmap(ROADMAP);

		expect(items).toHaveLength(2);
		expect(items[0].position).toBe(1);
		expect(items[0].name).toBe('Skip the browser gate loudly');
		expect(items[0].promise).toBe('The gate passes with no Chromium and prints one skip line.');
		expect(items[0].useCase).toBe('Run the gate');
		expect(items[0].statusKind).toBe('ready');
	});

	it('stops at the next section', () => {
		const items = parseRoadmap(ROADMAP);

		expect(items.map((item) => item.name)).not.toContain('Not a queue item');
	});

	it('keeps the blocked reason in the status', () => {
		const items = parseRoadmap(ROADMAP);

		expect(items[1].statusKind).toBe('blocked');
		expect(items[1].status).toBe('blocked on a decision about the domain');
	});

	it('returns nothing when there is no queue section', () => {
		expect(parseRoadmap('# ROADMAP.md\n\n## Shipped\n')).toEqual([]);
	});
});

describe('isTemplateItem', () => {
	it('flags the kit template that SETUP.md has not filled', () => {
		const items = parseRoadmap(
			[
				'## Feature Queue',
				'### 1. <feature name>',
				'- **Promise:** <one sentence that is provably true when done>',
				'- **Status:** ready'
			].join('\n')
		);

		expect(isTemplateItem(items[0])).toBe(true);
	});

	it('flags an item whose promise is still an ellipsis', () => {
		const items = parseRoadmap(
			['## Feature Queue', '### 2. Real name', '- **Promise:** …', '- **Status:** ready'].join('\n')
		);

		expect(isTemplateItem(items[0])).toBe(true);
	});

	it('accepts a filled item', () => {
		expect(isTemplateItem(parseRoadmap(ROADMAP)[0])).toBe(false);
	});
});

describe('classifyStatus and slugify', () => {
	it('classifies the statuses the kit allows', () => {
		expect(classifyStatus('ready')).toBe('ready');
		expect(classifyStatus('blocked on the adapter')).toBe('blocked');
		expect(classifyStatus('in progress (week of 2026-09-14)')).toBe('in-progress');
		expect(classifyStatus('nearly done')).toBe('unknown');
	});

	it('makes a url-safe slug', () => {
		expect(slugify('Skip the browser gate — loudly!')).toBe('skip-the-browser-gate-loudly');
	});
});

describe('topReadyItem', () => {
	it('takes the top item that is ready', () => {
		expect(topReadyItem(parseRoadmap(ROADMAP))?.name).toBe('Skip the browser gate loudly');
	});

	it('returns nothing when every item is blocked', () => {
		const items = parseRoadmap(ROADMAP).map((item) => ({
			...item,
			statusKind: 'blocked' as const
		}));

		expect(topReadyItem(items)).toBeUndefined();
	});
});

describe('issueFor', () => {
	it('carries a marker that ties the issue to the item', () => {
		const plan = issueFor(parseRoadmap(ROADMAP)[0]);

		expect(findMarker(plan.body)).toBe('skip-the-browser-gate-loudly');
	});

	it('labels the item by its status', () => {
		const [first, second] = parseRoadmap(ROADMAP).map(issueFor);

		expect(first.labels).toEqual(['roadmap', 'ready']);
		expect(second.labels).toEqual(['roadmap', 'blocked']);
	});

	it('omits a field the item does not set', () => {
		const plan = issueFor(parseRoadmap(ROADMAP)[1]);

		expect(plan.body).not.toContain('Use case');
	});
});

function existing(overrides: Partial<ExistingIssue> = {}): ExistingIssue {
	const plan = issueFor(parseRoadmap(ROADMAP)[0]);
	return {
		number: 7,
		title: plan.title,
		body: plan.body,
		labels: plan.labels,
		state: 'open',
		...overrides
	};
}

describe('planSync', () => {
	it('creates an issue for an item that has none', () => {
		const actions = planSync(parseRoadmap(ROADMAP), []);

		expect(actions.map((action) => action.kind)).toEqual(['create', 'create']);
	});

	it('leaves a matching issue alone', () => {
		const actions = planSync([parseRoadmap(ROADMAP)[0]], [existing()]);

		expect(actions).toEqual([expect.objectContaining({ kind: 'unchanged', number: 7 })]);
	});

	it('updates an issue whose body lost the marker, rather than filing a duplicate', () => {
		const actions = planSync([parseRoadmap(ROADMAP)[0]], [existing({ body: 'edited by hand' })]);

		expect(actions).toEqual([expect.objectContaining({ kind: 'update', number: 7 })]);
	});

	it('updates an issue whose label drifted', () => {
		const actions = planSync([parseRoadmap(ROADMAP)[0]], [existing({ labels: ['roadmap'] })]);

		expect(actions).toEqual([expect.objectContaining({ kind: 'update', number: 7 })]);
	});

	it('reopens an issue whose item is back on the queue', () => {
		const actions = planSync([parseRoadmap(ROADMAP)[0]], [existing({ state: 'closed' })]);

		expect(actions).toEqual([expect.objectContaining({ kind: 'update', number: 7 })]);
	});

	it('closes an issue whose item left the queue', () => {
		const actions = planSync([], [existing()]);

		expect(actions).toEqual([expect.objectContaining({ kind: 'close', number: 7 })]);
	});

	it('leaves an already closed orphan alone', () => {
		expect(planSync([], [existing({ state: 'closed' })])).toEqual([]);
	});

	it('never files an issue for the kit template', () => {
		const items = parseRoadmap(
			['## Feature Queue', '### 1. <feature name>', '- **Promise:** …', '- **Status:** ready'].join(
				'\n'
			)
		);

		expect(planSync(items, [])).toEqual([]);
	});
});
