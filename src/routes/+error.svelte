<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>{page.status} — agent-kit</title>
</svelte:head>

<p class="eyebrow">Error {page.status}</p>
<h1>{page.error?.message ?? 'That page does not exist.'}</h1>
<p>
	Try <a href={resolve('/docs')}>the kit</a> or <a href={resolve('/blog')}>the posts</a>.
</p>
