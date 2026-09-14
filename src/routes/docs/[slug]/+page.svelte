<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.doc.title} — agent-kit</title>
	{#if data.doc.tagline}
		<meta name="description" content={data.doc.tagline} />
	{/if}
</svelte:head>

<p class="eyebrow"><a href={resolve('/docs')}>Docs</a> / {data.doc.group}</p>

<article>
	<!-- The kit files are trusted repository content, rendered from markdown. -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html data.doc.html}
</article>

<nav class="pager">
	{#if data.previous}
		<a href={resolve('/docs/[slug]', { slug: data.previous.slug })}>← {data.previous.title}</a>
	{:else}
		<span></span>
	{/if}
	{#if data.next}
		<a href={resolve('/docs/[slug]', { slug: data.next.slug })}>{data.next.title} →</a>
	{/if}
</nav>

<style>
	article :global(h1) {
		margin-bottom: 1.5rem;
	}

	.pager {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 3rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border);
		font-size: 0.95rem;
	}
</style>
