import { error } from '@sveltejs/kit';
import { docs, findDoc } from '$lib/content';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const doc = findDoc(params.slug);
	if (!doc) {
		error(404, `No kit file at /docs/${params.slug}`);
	}

	const index = docs.indexOf(doc);
	return {
		doc,
		previous: index > 0 ? docs[index - 1] : undefined,
		next: index < docs.length - 1 ? docs[index + 1] : undefined
	};
};
