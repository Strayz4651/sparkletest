import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { base } from '$app/paths';
export function load() {
	redirect(307, resolve(base+'/home'));
}