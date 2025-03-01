import { writable, type Writable } from 'svelte/store';
import {
	applyChange,
	type Change,
	type Entry,
	type Format,
	type HumanReadable,
	type Input,
	type Output,
	type Query,
	type ViewFactory,
	type ViewChange
} from '@rocicorp/zero/advanced';
import type { Schema, ResultType } from '@rocicorp/zero';

export type QueryResultDetails = {
	readonly type: ResultType;
};

type State = [Entry, QueryResultDetails];

const complete = { type: 'complete' } as const;
const unknown = { type: 'unknown' } as const;

export class SvelteView<V> implements Output {
	readonly #input: Input;
	readonly #format: Format;
	readonly #onDestroy: () => void;

	#store: Writable<State>;
	#state: State;

	// Optimization: if the store is currently empty we build up
	// the view on a plain old JS object stored at #builderRoot, and return
	// that for the new state on transaction commit.
	#builderRoot: Entry | undefined;
	#pendingChanges: ViewChange[] = [];

	constructor(
		input: Input,
		onTransactionCommit: (cb: () => void) => void,
		format: Format,
		onDestroy: () => void,
		queryComplete: true | Promise<true>
	) {
		this.#input = input;
		onTransactionCommit(this.#onTransactionCommit);
		this.#format = format;
		this.#onDestroy = onDestroy;
		input.setOutput(this);

		const initialRoot = this.#createEmptyRoot();
		this.#applyChangesToRoot(input.fetch({}), (node) => ({ type: 'add', node }), initialRoot);
		this.#state = [initialRoot, queryComplete === true ? complete : unknown];
		this.#store = writable<State>(this.#state);

		if (isEmptyRoot(initialRoot)) {
			this.#builderRoot = this.#createEmptyRoot();
		}

		if (queryComplete !== true) {
			void queryComplete.then(() => {
				this.#updateState([this.#state[0], complete]);
			});
		}
	}

	get data(): V {
		return this.#state[0][''] as V;
	}

	get resultDetails(): QueryResultDetails {
		return this.#state[1];
	}

	destroy(): void {
		this.#onDestroy();
	}

	#updateState(newState: State): void {
		this.#state = newState;
		this.#store.set(newState);
	}

	#onTransactionCommit = () => {
		const builderRoot = this.#builderRoot;
		if (builderRoot) {
			if (!isEmptyRoot(builderRoot)) {
				this.#updateState([builderRoot, this.#state[1]]);
				this.#builderRoot = undefined;
			}
		} else {
			try {
				this.#applyChanges(this.#pendingChanges, (c) => c);
			} finally {
				this.#pendingChanges = [];
			}
		}
	};

	push(change: Change): void {
		// Delay updating the store state until the transaction commit
		if (this.#builderRoot) {
			this.#applyChangeToRoot(change, this.#builderRoot);
		} else {
			this.#pendingChanges.push(materializeRelationships(change));
		}
	}

	#applyChanges<T>(changes: Iterable<T>, mapper: (v: T) => ViewChange): void {
		// Create a shallow copy of the current state's first element
		const root = { ...this.#state[0] };

		this.#applyChangesToRoot<T>(changes, mapper, root);

		this.#updateState([root, this.#state[1]]);

		if (isEmptyRoot(root)) {
			this.#builderRoot = this.#createEmptyRoot();
		}
	}

	#applyChangesToRoot<T>(changes: Iterable<T>, mapper: (v: T) => ViewChange, root: Entry) {
		for (const change of changes) {
			this.#applyChangeToRoot(mapper(change), root);
		}
	}

	#applyChangeToRoot(change: ViewChange, root: Entry) {
		applyChange(root, change, this.#input.getSchema(), '', this.#format);
	}

	#createEmptyRoot(): Entry {
		return {
			'': this.#format.singular ? undefined : []
		};
	}
}

function materializeRelationships(change: Change): ViewChange {
	switch (change.type) {
		case 'add':
			return { type: 'add', node: materializeNodeRelationships(change.node) };
		case 'remove':
			return { type: 'remove', node: materializeNodeRelationships(change.node) };
		case 'child':
			return {
				type: 'child',
				node: { row: change.node.row },
				child: {
					relationshipName: change.child.relationshipName,
					change: materializeRelationships(change.child.change)
				}
			};
		case 'edit':
			return {
				type: 'edit',
				node: { row: change.node.row },
				oldNode: { row: change.oldNode.row }
			};
	}
}

function materializeNodeRelationships(node: any): any {
	const relationships: Record<string, () => any> = {};
	for (const relationship in node.relationships) {
		const materialized: any[] = [];
		for (const n of node.relationships[relationship]()) {
			materialized.push(materializeNodeRelationships(n));
		}
		relationships[relationship] = () => materialized;
	}
	return {
		row: node.row,
		relationships
	};
}

function isEmptyRoot(entry: Entry) {
	const data = entry[''];
	return data === undefined || (Array.isArray(data) && data.length === 0);
}

export function svelteViewFactory<
	TSchema extends Schema,
	TTable extends keyof TSchema['tables'] & string,
	TReturn
>(
	_query: Query<TSchema, TTable, TReturn>,
	input: Input,
	format: Format,
	onDestroy: () => void,
	onTransactionCommit: (cb: () => void) => void,
	queryComplete: true | Promise<true>
) {
	return new SvelteView<HumanReadable<TReturn>>(
		input,
		onTransactionCommit,
		format,
		onDestroy,
		queryComplete
	);
}

// Type assertion to ensure the factory satisfies the ViewFactory interface
svelteViewFactory satisfies ViewFactory<Schema, string, unknown, unknown>;
