<script>
	import { onMount, onDestroy } from 'svelte';
    import '../main.css'

	let canvasContainer;
	let myP5;

	onMount(async () => {
		const p5 = (await import('p5')).default;

		function sketch(p) {
			p.setup = function () {
				p.createCanvas(p.windowWidth, p.windowHeight);
				p.fill(255, 204, 0);
			};

			p.draw = function () {
				p.background(220);
				p.ellipse(p.mouseX, p.mouseY, 80, 80);
			};
		}

		myP5 = new p5(sketch, canvasContainer);
	});

	// Cleanup to prevent memory leaks

	onDestroy(() => {
		if (myP5) myP5.remove();
	});
</script>

<div bind:this={canvasContainer}></div>
