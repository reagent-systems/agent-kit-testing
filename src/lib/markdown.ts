import { marked } from 'marked';

export type FrontmatterValue = string | string[];

export interface Frontmatter {
	[key: string]: FrontmatterValue;
}

export interface ParsedDocument {
	frontmatter: Frontmatter;
	body: string;
}

const FENCE = '---';

/**
 * Splits a YAML-style frontmatter block off the top of a markdown source.
 *
 * This reads the small subset the blog-post skill writes: `key: value`
 * pairs, one per line, where a value is a scalar or a bracketed list.
 * A source with no frontmatter block returns empty frontmatter and the
 * whole source as the body.
 */
export function parseFrontmatter(source: string): ParsedDocument {
	const normalised = source.replace(/\r\n/g, '\n');
	if (!normalised.startsWith(FENCE + '\n')) {
		return { frontmatter: {}, body: normalised.trim() };
	}

	const end = normalised.indexOf('\n' + FENCE, FENCE.length);
	if (end === -1) {
		return { frontmatter: {}, body: normalised.trim() };
	}

	const block = normalised.slice(FENCE.length + 1, end);
	const body = normalised.slice(end + FENCE.length + 1).trim();

	const frontmatter: Frontmatter = {};
	for (const line of block.split('\n')) {
		const trimmed = line.trim();
		if (trimmed === '' || trimmed.startsWith('#')) continue;

		const separator = trimmed.indexOf(':');
		if (separator === -1) continue;

		const key = trimmed.slice(0, separator).trim();
		const raw = trimmed.slice(separator + 1).trim();
		if (key === '') continue;

		frontmatter[key] = parseValue(raw);
	}

	return { frontmatter, body };
}

function parseValue(raw: string): FrontmatterValue {
	if (raw.startsWith('[') && raw.endsWith(']')) {
		return raw
			.slice(1, -1)
			.split(',')
			.map((entry) => unquote(entry.trim()))
			.filter((entry) => entry !== '');
	}
	return unquote(raw);
}

function unquote(value: string): string {
	if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
		return value.slice(1, -1);
	}
	if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
		return value.slice(1, -1);
	}
	return value;
}

/** Reads a frontmatter key that must be a single string. */
export function readString(frontmatter: Frontmatter, key: string): string | undefined {
	const value = frontmatter[key];
	return typeof value === 'string' ? value : undefined;
}

/** Reads a frontmatter key as a list, accepting `a, b` as well as `[a, b]`. */
export function readList(frontmatter: Frontmatter, key: string): string[] {
	const value = frontmatter[key];
	if (Array.isArray(value)) return value;
	if (typeof value === 'string' && value !== '') {
		return value
			.split(',')
			.map((entry) => entry.trim())
			.filter((entry) => entry !== '');
	}
	return [];
}

/**
 * Derives a URL slug from a content filename.
 *
 * The blog-post skill writes `YYYY-MM-DD-<slug>.md`. The date prefix is
 * metadata, not part of the URL, so it is dropped.
 */
export function slugFromFilename(path: string): string {
	const base = path.split('/').pop() ?? path;
	return base.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

/** Renders markdown to HTML. */
export function renderMarkdown(body: string): string {
	return marked.parse(body, { async: false, gfm: true });
}
