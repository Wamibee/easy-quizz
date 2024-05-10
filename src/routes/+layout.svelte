<script>
	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	import '../app.scss';
</script>

<div class="app">
	<main>
		<slot />
	</main>
</div>