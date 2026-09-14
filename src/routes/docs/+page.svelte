<script lang="ts">
	import { asset, resolve } from '$app/paths';
	import { groupedDocs } from '$lib/content';

	const groups = groupedDocs();
</script>

<svelte:head>
	<title>Docs — agent-kit</title>
	<meta
		name="description"
		content="Every file in the agent kit, in the reading order set by ROUTING.md."
	/>
</svelte:head>

<p class="eyebrow">Docs</p>
<h1>The kit, in reading order</h1>
<p>
	These pages render the repository's own files under <code>agent-kit/</code>. They are not a copy.
	When a file changes, its page changes with it.
</p>
<p class="muted">
	Start with <a href={resolve('/docs/[slug]', { slug: 'routing' })}>ROUTING.md</a>. It says which
	file governs which situation.
</p>
<p class="muted">
	<a href={asset('/agent-kit.zip')} download>Download every file as a zip →</a>
</p>

{#each groups as group (group.group)}
	<section>
		<h2>{group.group}</h2>
		<ul>
			{#each group.pages as doc (doc.slug)}
				<li>
					<a href={resolve('/docs/[slug]', { slug: doc.slug })}>{doc.title}</a>
					{#if doc.tagline}<span class="muted"> — {doc.tagline}</span>{/if}
				</li>
			{/each}
		</ul>
	</section>
{/each}

<style>
	ul {
		list-style: none;
		padding: 0;
	}

	li {
		padding: 0.45rem 0;
		border-bottom: 1px solid var(--border);
	}
</style>
