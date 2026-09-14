import { describe, expect, it } from 'vitest';
import { LABELS, findLabel, labelsByAxis, planLabelSync, type ExistingLabel } from './labels';
import { classifyStatus, issueFor, parseRoadmap, type StatusKind } from './roadmap';

describe('the label list', () => {
	it('has no duplicate names', () => {
		const names = LABELS.map((label) => label.name);

		expect(new Set(names).size).toBe(names.length);
	});

	it('gives every label a six-digit hex color with no hash', () => {
		for (const label of LABELS) {
			expect(label.color, label.name).toMatch(/^[0-9a-f]{6}$/);
		}
	});

	it('gives every label a description that fits GitHub s limit', () => {
		for (const label of LABELS) {
			expect(label.description, label.name).not.toBe('');
			expect(label.description.length, label.name).toBeLessThanOrEqual(100);
		}
	});

	it('covers all four axes', () => {
		for (const axis of ['kind', 'state', 'source', 'help'] as const) {
			expect(labelsByAxis(axis).length, axis).toBeGreaterThan(0);
		}
	});
});

describe('the labels the roadmap sync applies', () => {
	// The sync labels every generated issue. A label it emits that is not
	// in the list gets created by GitHub with a random color and no
	// description, which is how `roadmap` and `ready` first appeared grey.
	const statuses: StatusKind[] = ['ready', 'blocked', 'in-progress', 'unknown'];

	it.each(statuses)('emits a defined label for status %s', (status) => {
		const item = {
			position: 1,
			name: 'An item',
			promise: 'It is done.',
			evidence: 'The gate.',
			useCase: 'A case',
			scopeGuard: 'Nothing else.',
			status,
			statusKind: status,
			slug: 'an-item'
		};

		for (const name of issueFor(item).labels) {
			expect(findLabel(name), name).toBeDefined();
		}
	});

	it('matches the status words the roadmap actually uses', () => {
		const roadmap = [
			'## Feature Queue',
			'### 1. First',
			'- **Promise:** Done.',
			'- **Status:** in progress (week of 2026-09-14)'
		].join('\n');

		const item = parseRoadmap(roadmap)[0];

		expect(classifyStatus(item.status)).toBe('in-progress');
		expect(issueFor(item).labels).toContain('in-progress');
	});
});

function existing(overrides: Partial<ExistingLabel> = {}): ExistingLabel {
	return { name: 'roadmap', color: '5319e7', description: LABELS[0].description, ...overrides };
}

describe('planLabelSync', () => {
	it('creates every label on an empty repository', () => {
		const actions = planLabelSync([]);

		expect(actions).toHaveLength(LABELS.length);
		expect(actions.every((action) => action.kind === 'create')).toBe(true);
	});

	it('leaves a matching label alone', () => {
		const target = findLabel('roadmap')!;
		const actions = planLabelSync([
			{ name: target.name, color: target.color, description: target.description }
		]);

		expect(actions).toContainEqual({ kind: 'unchanged', label: target });
	});

	it('updates a label whose color drifted', () => {
		const target = findLabel('roadmap')!;
		const actions = planLabelSync([
			{ name: 'roadmap', color: 'ededed', description: target.description }
		]);

		expect(actions).toContainEqual({ kind: 'update', label: target });
	});

	it('updates a label that has no description', () => {
		const target = findLabel('ready')!;
		const actions = planLabelSync([{ name: 'ready', color: target.color, description: '' }]);

		expect(actions).toContainEqual({ kind: 'update', label: target });
	});

	it('ignores case in the stored color', () => {
		const target = findLabel('roadmap')!;
		const actions = planLabelSync([
			{ name: 'roadmap', color: target.color.toUpperCase(), description: target.description }
		]);

		expect(actions).toContainEqual({ kind: 'unchanged', label: target });
	});

	it('reports an unknown label as extra and never deletes it', () => {
		const actions = planLabelSync([existing({ name: 'invalid' })]);

		expect(actions).toContainEqual({ kind: 'extra', name: 'invalid' });
		expect(
			actions.some((action) => action.kind === 'create' && action.label.name === 'invalid')
		).toBe(false);
	});
});
