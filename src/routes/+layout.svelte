<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import '../app.css';

	let { children } = $props();

	const home = resolve('/');

	const links = [
		{ href: home, label: 'Overview' },
		{ href: resolve('/docs'), label: 'Docs' },
		{ href: resolve('/blog'), label: 'Blog' }
	];

	function isCurrent(href: string): boolean {
		return href === home ? page.url.pathname === home : page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header>
	<div class="shell bar">
		<a class="wordmark" href={home}>agent-kit</a>
		<nav>
			{#each links as link (link.href)}
				<a href={link.href} aria-current={isCurrent(link.href) ? 'page' : undefined}>
					{link.label}
				</a>
			{/each}
		</nav>
	</div>
</header>

<main class="shell">
	{@render children()}
</main>

<footer>
	<div class="shell">
		<p class="muted">
			This site is built by the kit it documents. The content is the repository's own markdown.
		</p>
		<p class="muted">
			<a href="https://github.com/reagent-systems/agent-kit-testing">Source on GitHub</a>
		</p>
	</div>
</footer>

<style>
	header {
		border-bottom: 1px solid var(--border);
		background: var(--bg);
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		min-height: 3.5rem;
		flex-wrap: wrap;
	}

	.wordmark {
		font-family: var(--font-mono);
		font-weight: 600;
		color: var(--text);
		text-decoration: none;
	}

	nav {
		display: flex;
		gap: 1.15rem;
		font-size: 0.95rem;
	}

	nav a {
		color: var(--muted);
		text-decoration: none;
	}

	nav a:hover,
	nav a[aria-current='page'] {
		color: var(--text);
	}

	nav a[aria-current='page'] {
		text-decoration: underline;
		text-underline-offset: 4px;
	}

	main {
		padding-top: 2.5rem;
		padding-bottom: 4rem;
		min-height: 60vh;
	}

	footer {
		border-top: 1px solid var(--border);
		padding: 1.5rem 0 2.5rem;
		font-size: 0.9rem;
	}

	footer p {
		margin: 0 0 0.4rem;
	}
</style>
