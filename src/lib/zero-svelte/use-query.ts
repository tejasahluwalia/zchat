import { derived, type Readable } from 'svelte/store';
import { onDestroy } from 'svelte';
import type { AdvancedQuery, HumanReadable, Query } from '@rocicorp/zero/advanced';
import type { Schema } from '@rocicorp/zero';
import { svelteViewFactory, type QueryResultDetails } from './svelte-view';

export function useQuery<
	TSchema extends Schema,
	TTable extends keyof TSchema['tables'] & string,
	TReturn
>(querySignal: () => Query<TSchema, TTable, TReturn>) {
	let view = $state<{
		data: HumanReadable<TReturn>;
		resultDetails: QueryResultDetails;
		destroy: () => void;
	} | null>(null);

	// Initialize the view
	function initView() {
		const query = querySignal();
		view = (query as AdvancedQuery<TSchema, TTable, TReturn>).materialize(svelteViewFactory);
	}

	// Set up the initial view
	initView();

	// Clean up on component destruction
	onDestroy(() => {
		if (view) {
			view.destroy();
		}
	});

	// These are reactive in Svelte 5 when used within a component
	const data = $derived(view?.data as HumanReadable<TReturn>);
	const resultDetails = $derived(view?.resultDetails as QueryResultDetails);

	return { data, resultDetails };
}
