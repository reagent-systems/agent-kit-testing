/**
 * Packages `agent-kit/` into `static/agent-kit.zip`, the file behind the
 * site's download button.
 *
 * The site is a folder of prerendered files with no server, so the
 * archive is built here rather than assembled on request. It runs before
 * `dev` and `build` (see package.json), so the download always matches
 * the repository's current kit files.
 *
 * Usage:
 *   node scripts/build-agent-kit-zip.ts
 */

import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createZip, type ZipEntry } from '../src/lib/server/zip.ts';

const SOURCE_DIR = 'agent-kit';
const OUTPUT_PATH = 'static/agent-kit.zip';

function collectFiles(dir: string): string[] {
	const files: string[] = [];
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) {
			files.push(...collectFiles(path));
		} else {
			files.push(path);
		}
	}
	return files;
}

const entries: ZipEntry[] = collectFiles(SOURCE_DIR)
	.sort()
	.map((path) => ({
		path: relative('.', path).split(sep).join('/'),
		data: readFileSync(path)
	}));

const zip = createZip(entries);

mkdirSync('static', { recursive: true });
writeFileSync(OUTPUT_PATH, zip);

console.log(
	`Wrote ${OUTPUT_PATH}: ${entries.length} file(s) from ${SOURCE_DIR}/, ${zip.length} bytes.`
);
