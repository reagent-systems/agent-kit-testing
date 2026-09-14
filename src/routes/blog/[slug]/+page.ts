import { error } from '@sveltejs/kit';
import { findPost } from '$lib/content';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const post = findPost(params.slug);
	if (!post) {
		error(404, `No post at /blog/${params.slug}`);
	}
	return { post };
};
