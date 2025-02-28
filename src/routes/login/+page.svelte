<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div>
	<div>{JSON.stringify(data)}</div>
	<form method="POST" action="/login">
		<button type="submit">Login</button>
	</form>
</div>
