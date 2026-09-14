import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

// Component tests run in a real Chromium. CI installs one with
// `npx playwright install chromium`. Set CHROMIUM_PATH to point at a
// Chromium that is already on the machine instead.
const chromiumPath = process.env.CHROMIUM_PATH;

// GitHub Pages serves a project site from a subdirectory, so the built
// site needs to know its prefix. The deploy workflow sets BASE_PATH to
// the repository name. It stays empty for local development and for a
// custom domain served from the root.
function normaliseBase(value: string | undefined): '' | `/${string}` {
	const trimmed = (value ?? '').replace(/\/+$/, '');
	if (trimmed === '') return '';
	return trimmed.startsWith('/') ? (trimmed as `/${string}`) : `/${trimmed}`;
}

const base = normaliseBase(process.env.BASE_PATH);

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// Every page prerenders, so the site is a folder of files.
			adapter: adapter({ fallback: '404.html' }),
			paths: { base }
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(
							chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}
						),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
