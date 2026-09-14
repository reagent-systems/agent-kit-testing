<script lang="ts">
	import { resolve } from '$app/paths';
	import { posts } from '$lib/content';
</script>

<svelte:head>
	<title>Blog — agent-kit</title>
	<meta name="description" content="Posts written from the kit's devlog after each cycle." />
</svelte:head>

<p class="eyebrow">Blog</p>
<h1>What shipped, and what broke</h1>
<p>
	Each post is written from <a href={resolve('/docs/[slug]', { slug: 'devlog' })}>DEVLOG.md</a> after
	a cycle, by the blog-post skill in the kit. The devlog records the weeks that failed as well as the
	weeks that shipped, so the posts do too.
</p>

{#if posts.length === 0}
	<p class="muted">No posts yet.</p>
{:else}
	<ul>
		{#each posts as post (post.slug)}
			<li>
				<h2><a href={resolve('/blog/[slug]', { slug: post.slug })}>{post.title}</a></h2>
				<p class="meta">
					{#if post.date}<span class="date">{post.date}</span>{/if}
					{#each post.tags as tag (tag)}<span class="tag">{tag}</span>{/each}
				</p>
				<p class="muted">{post.summary}</p>
			</li>
		{/each}
	</ul>
{/if}

<style>
	ul {
		list-style: none;
		padding: 0;
		margin-top: 2rem;
	}

	li {
		padding-bottom: 1.5rem;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid var(--border);
	}

	li h2 {
		margin: 0 0 0.3rem;
		font-size: 1.25rem;
	}

	li h2 a {
		color: var(--text);
		text-decoration: none;
	}

	li h2 a:hover {
		color: var(--accent);
	}

	.meta {
		display: flex;
		gap: 0.6rem;
		align-items: center;
		flex-wrap: wrap;
		margin: 0 0 0.5rem;
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--muted);
	}

	.tag {
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 0.05rem 0.5rem;
	}
</style>
