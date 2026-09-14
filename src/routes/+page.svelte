<script lang="ts">
	import { resolve } from '$app/paths';
	import { docs, posts } from '$lib/content';

	const latest = posts.slice(0, 3);

	const stages = [
		{
			step: '1',
			title: 'Feedback arrives',
			body: 'A user sends an email. It becomes a GitHub issue. The issue is the inbox.'
		},
		{
			step: '2',
			title: 'The roadmap decides',
			body: 'ROADMAP.md holds the queue. Every item carries one testable promise and the evidence that will prove it. A CI job opens an issue for each item, so the queue is visible on GitHub.'
		},
		{
			step: '3',
			title: 'The agent builds',
			body: 'The agent takes the top ready item and runs the weekly cycle: spec, build, prove, document, ship.'
		},
		{
			step: '4',
			title: 'The gate decides',
			body: 'One command answers whether the repo is healthy. No green, no push. The gate is the same locally and in CI.'
		},
		{
			step: '5',
			title: 'The work is told',
			body: 'The devlog records what happened, including the weeks that broke. The blog post is the devlog retold for a reader. This site publishes it.'
		}
	];

	const files = [
		{ name: 'ROUTING.md', body: 'The dispatch table. It says which file governs which situation.' },
		{
			name: 'AGENTS.md',
			body: 'The binding contract: commands, invariants, landmines, house style.'
		},
		{
			name: 'ROADMAP.md',
			body: 'The single source of work. Nothing gets built that is not traceable to it.'
		},
		{ name: 'WEEKLY.md', body: 'One cycle takes one queue item from promise to released.' },
		{
			name: 'LOOP.md',
			body: 'The autonomous build loop: file format, field rules, stop conditions.'
		},
		{
			name: 'TONE.md',
			body: 'How the agent writes its own words. Short claims, evidence attached.'
		}
	];
</script>

<svelte:head>
	<title>agent-kit — a process an agent can run</title>
	<meta
		name="description"
		content="agent-kit is a set of markdown files that govern an AI agent working on a repository. This site is the kit documenting itself."
	/>
</svelte:head>

<section class="hero">
	<p class="eyebrow">Agent kit</p>
	<h1>A process an agent can actually run.</h1>
	<p class="lede">
		agent-kit is a folder of markdown files that govern an AI agent working on a repository. It sets
		the contract for changing code, the queue that decides what gets built, the gate that decides
		what ships, and the voice the agent writes in.
	</p>
	<p>
		This site is the test. It is built by the kit it documents, from the repository's own markdown.
		When the kit changes, these pages change.
	</p>
	<p class="actions">
		<a class="button" href={resolve('/docs')}>Read the kit</a>
		<a href={resolve('/blog')}>Read the devlog posts</a>
	</p>
</section>

<section>
	<h2>The loop</h2>
	<p>
		Maintenance and marketing run on the same cycle. The kit treats the write-up as part of
		shipping, not as work that happens afterwards.
	</p>
	<ol class="stages">
		{#each stages as stage (stage.step)}
			<li>
				<span class="step">{stage.step}</span>
				<div>
					<h3>{stage.title}</h3>
					<p>{stage.body}</p>
				</div>
			</li>
		{/each}
	</ol>
</section>

<section>
	<h2>The files that do the work</h2>
	<p>
		The kit holds {docs.length} files. These six carry most of the weight.
	</p>
	<dl class="files">
		{#each files as file (file.name)}
			<div>
				<dt><code>{file.name}</code></dt>
				<dd>{file.body}</dd>
			</div>
		{/each}
	</dl>
	<p><a href={resolve('/docs')}>Every file, in reading order →</a></p>
</section>

{#if latest.length > 0}
	<section>
		<h2>Latest posts</h2>
		<ul class="posts">
			{#each latest as post (post.slug)}
				<li>
					<a href={resolve('/blog/[slug]', { slug: post.slug })}>{post.title}</a>
					{#if post.date}<span class="muted date">{post.date}</span>{/if}
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.hero {
		padding-bottom: 1rem;
	}

	.lede {
		font-size: 1.12rem;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		flex-wrap: wrap;
		margin-top: 1.5rem;
	}

	.button {
		display: inline-block;
		background: var(--accent);
		color: var(--bg);
		text-decoration: none;
		padding: 0.5rem 1.1rem;
		border-radius: var(--radius);
		font-weight: 550;
	}

	section + section {
		margin-top: 3rem;
		border-top: 1px solid var(--border);
		padding-top: 1rem;
	}

	.stages {
		list-style: none;
		padding: 0;
		margin: 1.5rem 0 0;
	}

	.stages li {
		display: flex;
		gap: 1rem;
		padding-bottom: 1.25rem;
	}

	.stages h3 {
		margin: 0 0 0.25rem;
	}

	.stages p {
		margin: 0;
	}

	.step {
		flex: 0 0 1.85rem;
		height: 1.85rem;
		border: 1px solid var(--border);
		border-radius: 50%;
		display: grid;
		place-items: center;
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--muted);
		background: var(--surface);
	}

	.files {
		margin: 1.25rem 0;
	}

	.files > div {
		padding: 0.6rem 0;
		border-bottom: 1px solid var(--border);
	}

	.files dt {
		font-weight: 600;
	}

	.files dd {
		margin: 0.15rem 0 0;
		color: var(--muted);
	}

	.posts {
		list-style: none;
		padding: 0;
	}

	.posts li {
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.date {
		font-family: var(--font-mono);
		font-size: 0.85rem;
	}
</style>
