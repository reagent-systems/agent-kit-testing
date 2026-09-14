import { describe, expect, it } from 'vitest';
import {
	parseFrontmatter,
	readList,
	readString,
	renderMarkdown,
	slugFromFilename
} from './markdown';

describe('parseFrontmatter', () => {
	it('splits frontmatter from the body', () => {
		const { frontmatter, body } = parseFrontmatter(
			['---', 'title: A post', 'date: 2026-09-14', '---', '', 'The body.'].join('\n')
		);

		expect(frontmatter.title).toBe('A post');
		expect(frontmatter.date).toBe('2026-09-14');
		expect(body).toBe('The body.');
	});

	it('reads a bracketed list', () => {
		const { frontmatter } = parseFrontmatter(
			['---', 'tags: [kit, release]', '---', 'Body.'].join('\n')
		);

		expect(frontmatter.tags).toEqual(['kit', 'release']);
	});

	it('strips quotes from a value', () => {
		const { frontmatter } = parseFrontmatter(
			['---', 'title: "Quoted: with a colon"', '---', 'Body.'].join('\n')
		);

		expect(frontmatter.title).toBe('Quoted: with a colon');
	});

	it('returns the whole source when there is no frontmatter', () => {
		const { frontmatter, body } = parseFrontmatter('# Just markdown');

		expect(frontmatter).toEqual({});
		expect(body).toBe('# Just markdown');
	});

	it('returns the whole source when the block is never closed', () => {
		const source = ['---', 'title: Broken', '', 'Body without a fence.'].join('\n');
		const { frontmatter, body } = parseFrontmatter(source);

		expect(frontmatter).toEqual({});
		expect(body).toContain('title: Broken');
	});
});

describe('readString and readList', () => {
	it('reads a scalar only as a string', () => {
		const { frontmatter } = parseFrontmatter(['---', 'tags: [a, b]', '---', 'Body.'].join('\n'));

		expect(readString(frontmatter, 'tags')).toBeUndefined();
		expect(readList(frontmatter, 'tags')).toEqual(['a', 'b']);
	});

	it('accepts a comma-separated scalar as a list', () => {
		const { frontmatter } = parseFrontmatter(['---', 'tags: a, b', '---', 'Body.'].join('\n'));

		expect(readList(frontmatter, 'tags')).toEqual(['a', 'b']);
	});

	it('returns an empty list for a missing key', () => {
		expect(readList({}, 'tags')).toEqual([]);
	});
});

describe('slugFromFilename', () => {
	it('drops the directory, the date prefix and the extension', () => {
		expect(slugFromFilename('/src/content/blog/2026-09-14-the-first-post.md')).toBe(
			'the-first-post'
		);
	});

	it('keeps a name that carries no date', () => {
		expect(slugFromFilename('notes.md')).toBe('notes');
	});
});

describe('renderMarkdown', () => {
	it('renders headings and links', () => {
		const html = renderMarkdown('# Title\n\nSee [the kit](/docs).');

		expect(html).toContain('<h1>Title</h1>');
		expect(html).toContain('href="/docs"');
	});

	it('renders GitHub tables', () => {
		const html = renderMarkdown(['| A | B |', '| --- | --- |', '| 1 | 2 |'].join('\n'));

		expect(html).toContain('<table>');
	});
});
