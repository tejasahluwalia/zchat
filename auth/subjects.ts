import { object, string, number, email, date } from 'valibot';
import { createSubjects } from '@openauthjs/openauth/subject';

export const subjects = createSubjects({
	user: object({
		id: number()
	})
});
