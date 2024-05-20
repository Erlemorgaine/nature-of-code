<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type p5 from 'p5';
	import '../main.css';

	let canvasContainer: HTMLDivElement;
	let myP5: p5;

	onMount(async () => {
		const p5 = (await import('p5')).default;

		function sketch(p: p5) {
			// const mover =  Mover

			p.setup = function () {
				p.createCanvas(p.windowWidth, p.windowHeight);
				p.fill(255, 204, 0);
			};

			rotateBatonByAngle(p);
		}

		myP5 = new p5(sketch, canvasContainer);
	});

	// 3 Oscillation - 3.2
	function rotateBatonByAngle(p) {
		let angle = 0;
		let angularVelocity = 0;
		let angularAcceleration = 0.001;
		let direction = 1;

		p.draw = function () {
			p.background(220);
			p.translate(p.width * 0.5, p.height * 0.5);
			p.rotate(angle);
			p.line(0, 0, 0, -160);
			p.ellipse(0, 0, 40, 40);
			p.ellipse(0, -160, 40, 40);

			if (angularVelocity > 0.2) {
				direction = -1;
			} else if (angularVelocity <= 0.01) {
				direction = 1;
			}

			if (direction === -1) {
				angularVelocity -= angularAcceleration;
				angle += angularVelocity;
			} else {
				angularVelocity += angularAcceleration;
				angle += angularVelocity;
			}
		};
	}

	// Cleanup to prevent memory leaks

	onDestroy(() => {
		if (myP5) myP5.remove();
	});
</script>

<div bind:this={canvasContainer}></div>
