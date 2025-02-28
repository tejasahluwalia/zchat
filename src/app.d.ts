// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import { subjects } from '../../auth/subjects';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: subjects.User | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
