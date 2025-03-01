import type { ZeroAdvancedOptions } from '@rocicorp/zero/advanced';
import { Zero, type Schema, type ZeroOptions } from '@rocicorp/zero';

export function createZero<S extends Schema>(options: ZeroOptions<S>): Zero<S> {
	const opts: ZeroAdvancedOptions<S> = {
		...options
	};
	return new Zero(opts);
}
