<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div>
	{#if data.userId}
		<div>User ID: {data.userId}</div>
		<form method="GET" action="/auth/logout">
			<button type="submit">Logout</button>
		</form>
	{:else}
		<div>Please log in to view your user ID.</div>
		<form method="POST" action="/login">
			<button type="submit">Login</button>
		</form>
	{/if}
</div>
