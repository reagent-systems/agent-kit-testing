import {
	parseFrontmatter,
	readList,
	readString,
	renderMarkdown,
	slugFromFilename
} from '$lib/markdown';

export interface Post {
	slug: string;
	title: string;
	date: string;
	tags: string[];
	summary: string;
	html: string;
}

export interface DocPage {
	slug: string;
	/** The kit filename, e.g. `ROUTING.md`. */
	file: string;
	title: string;
	tagline: string;
	group: string;
	html: string;
}

const postSources = import.meta.glob('/src/content/blog/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const docSources = import.meta.glob('/agent-kit/**/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

/**
 * The reading order of the kit, taken from the dispatch table in
 * ROUTING.md. A kit file that is not listed still gets a page; it sorts
 * to the end of the Reference group.
 */
const DOC_ORDER: { file: string; group: string }[] = [
	{ file: 'ROUTING.md', group: 'Start here' },
	{ file: 'SETUP.md', group: 'Start here' },
	{ file: 'AGENTS.md', group: 'The contract' },
	{ file: 'TONE.md', group: 'The contract' },
	{ file: 'ROADMAP.md', group: 'The cycle' },
	{ file: 'WEEKLY.md', group: 'The cycle' },
	{ file: 'LOOP.md', group: 'The cycle' },
	{ file: 'VERIFICATION.md', group: 'The cycle' },
	{ file: 'RELEASING.md', group: 'The cycle' },
	{ file: 'STATUS.md', group: 'The record' },
	{ file: 'DEVLOG.md', group: 'The record' },
	{ file: 'CHANGELOG.md', group: 'The record' },
	{ file: 'docs/ARCHITECTURE.md', group: 'Reference' },
	{ file: 'docs/CONFIGURATION.md', group: 'Reference' },
	{ file: 'docs/ADAPTERS.md', group: 'Reference' },
	{ file: 'docs/USE-CASES.md', group: 'Reference' },
	{ file: 'docs/STYLE.md', group: 'Reference' },
	{ file: 'CI.md', group: 'Reference' },
	{ file: 'MAINTENANCE.md', group: 'Reference' },
	{ file: 'CONTRIBUTING.md', group: 'Reference' },
	{ file: 'SECURITY.md', group: 'Reference' }
];

/**
 * Splits `# ROUTING.md — read this first` into its title and tagline.
 * The em dash is the kit's own convention for that split.
 */
export function splitHeading(body: string, fallback: string): { title: string; tagline: string } {
	const heading = body.split('\n').find((line) => line.startsWith('# '));
	if (!heading) return { title: fallback, tagline: '' };

	const text = heading.slice(2).trim();
	const dash = text.indexOf('—');
	if (dash === -1) return { title: text, tagline: '' };

	return { title: text.slice(0, dash).trim(), tagline: text.slice(dash + 1).trim() };
}

/** Takes the first paragraph of a body as its summary. */
export function firstParagraph(body: string): string {
	for (const block of body.split('\n\n')) {
		const text = block.trim();
		if (text === '' || text.startsWith('#') || text.startsWith('<!--')) continue;
		return text.replace(/\n/g, ' ');
	}
	return '';
}

function buildPosts(): Post[] {
	return Object.entries(postSources)
		.map(([path, source]) => {
			const { frontmatter, body } = parseFrontmatter(source);
			const slug = slugFromFilename(path);
			return {
				slug,
				title: readString(frontmatter, 'title') ?? slug,
				date: readString(frontmatter, 'date') ?? '',
				tags: readList(frontmatter, 'tags'),
				summary: firstParagraph(body),
				html: renderMarkdown(body)
			};
		})
		.sort((a, b) =>
			a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date)
		);
}

function buildDocs(): DocPage[] {
	const rank = new Map(DOC_ORDER.map((entry, index) => [entry.file, index]));
	const groups = new Map(DOC_ORDER.map((entry) => [entry.file, entry.group]));

	return Object.entries(docSources)
		.map(([path, source]) => {
			const file = path.replace('/agent-kit/', '');
			const { title, tagline } = splitHeading(source, file);
			return {
				slug: file.replace(/\.md$/, '').replace(/\//g, '-').toLowerCase(),
				file,
				title,
				tagline,
				group: groups.get(file) ?? 'Reference',
				html: renderMarkdown(source)
			};
		})
		.sort((a, b) => {
			const left = rank.get(a.file) ?? Number.MAX_SAFE_INTEGER;
			const right = rank.get(b.file) ?? Number.MAX_SAFE_INTEGER;
			return left === right ? a.file.localeCompare(b.file) : left - right;
		});
}

export const posts: Post[] = buildPosts();
export const docs: DocPage[] = buildDocs();

export function findPost(slug: string): Post | undefined {
	return posts.find((post) => post.slug === slug);
}

export function findDoc(slug: string): DocPage | undefined {
	return docs.find((doc) => doc.slug === slug);
}

/** Groups the doc pages for the navigation, keeping DOC_ORDER's order. */
export function groupedDocs(): { group: string; pages: DocPage[] }[] {
	const result: { group: string; pages: DocPage[] }[] = [];
	for (const doc of docs) {
		const last = result.at(-1);
		if (last && last.group === doc.group) {
			last.pages.push(doc);
		} else {
			result.push({ group: doc.group, pages: [doc] });
		}
	}
	return result;
}
