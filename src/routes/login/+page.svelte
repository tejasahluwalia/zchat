<script lang="ts">
</script>

<div class="login-container">
	<h1>Welcome to ZChat</h1>
	<p>Please log in to continue using the application.</p>
	<form method="POST" action="/login">
		<button type="submit" class="login-button">Login with GitHub</button>
	</form>
</div>

<style>
	.login-container {
		max-width: 400px;
		margin: 100px auto;
		padding: 2rem;
		text-align: center;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		background-color: white;
	}

	h1 {
		margin-bottom: 1rem;
		color: #333;
	}

	p {
		margin-bottom: 2rem;
		color: #666;
	}

	.login-button {
		background-color: #24292e;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.login-button:hover {
		background-color: #0366d6;
	}
</style>
