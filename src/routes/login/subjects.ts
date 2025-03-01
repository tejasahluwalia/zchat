import { object, number } from 'valibot';
import { createSubjects } from '@openauthjs/openauth/subject';

export const subjects = createSubjects({
	user: object({
		id: number()
	})
});
