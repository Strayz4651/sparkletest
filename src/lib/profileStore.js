import { writable } from 'svelte/store';

const DEFAULT_PICTURE = '/pink skull.png';
const STORAGE_CURRENT_USER = 'currentUserEmail';
const STORAGE_REGISTERED_USERS = 'registeredUsers';

function getInitial() {
	if (typeof window !== 'undefined' && window.localStorage) {
		try {
			const currentUserEmail = window.localStorage.getItem(STORAGE_CURRENT_USER);
			if (currentUserEmail) {
				const storedUsers = window.localStorage.getItem(STORAGE_REGISTERED_USERS);
				const users = storedUsers ? JSON.parse(storedUsers) : [];
				const user = users.find((item) => item.email === currentUserEmail);
				if (user) {
					return {
						picture: user.profilePicture || DEFAULT_PICTURE,
						name: user.name || '',
						about: user.about || '',
						email: currentUserEmail,
					};
				}
			}
		} catch (e) {
			// ignore
		}
	}

	return { picture: DEFAULT_PICTURE, name: '', about: '', email: '' };
}

const initial = getInitial();
export const profilePicture = writable(initial.picture);
export const profileName = writable(initial.name);
export const profileAbout = writable(initial.about);
export const currentUserEmail = writable(initial.email);
