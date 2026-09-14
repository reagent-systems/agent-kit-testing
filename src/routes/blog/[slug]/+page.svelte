<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.post.title} — agent-kit</title>
	<meta name="description" content={data.post.summary} />
</svelte:head>

<p class="eyebrow"><a href={resolve('/blog')}>Blog</a></p>

<h1>{data.post.title}</h1>
<p class="meta">
	{#if data.post.date}<span>{data.post.date}</span>{/if}
	{#each data.post.tags as tag (tag)}<span class="tag">{tag}</span>{/each}
</p>

<article>
	<!-- Posts are trusted repository content, rendered from markdown. -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html data.post.html}
</article>

<p class="back"><a href={resolve('/blog')}>← All posts</a></p>

<style>
	h1 {
		margin-bottom: 0.5rem;
	}

	.meta {
		display: flex;
		gap: 0.6rem;
		align-items: center;
		flex-wrap: wrap;
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--muted);
		margin-bottom: 2rem;
	}

	.tag {
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 0.05rem 0.5rem;
	}

	.back {
		margin-top: 3rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border);
		font-size: 0.95rem;
	}
</style>
