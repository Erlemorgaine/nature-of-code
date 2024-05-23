<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type p5 from 'p5';
	import '../main.css';
	import { Mover, Pendulum } from '../types/types';

	let canvasContainer: HTMLDivElement;
	let myP5: p5;

	onMount(async () => {
		const p5 = (await import('p5')).default;

		function sketch(p: p5) {
			const mover = new Mover(
				p.createVector(p.windowWidth * 0.5, p.windowHeight * 0.5),
				p.createVector(0, 0),
				p.createVector(0.5, 0),
				3
			);

			const pendulum = new Pendulum(200, Math.PI * 0.5, 0);

			p.setup = function () {
				p.createCanvas(p.windowWidth, p.windowHeight);
				p.fill(255, 204, 0);
				// mover.display(p);
			};

			p.draw = function () {
				// mover.update(p);
				// mover.display(p);

				pendulum.display(p);
				pendulum.update(p);
			};

			// rotateBatonByAngle(p);
			// makeWaves(p);
		}

		myP5 = new p5(sketch, canvasContainer);
	});

	// 3 Oscillation - 3.2
	function rotateBatonByAngle(p: p5) {
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

	function makeWaves(p: p5) {
		let startAngle = 0;
		const startAngleVelocity = 0.1;

		p.draw = function () {
			let angle = startAngle;

			p.background(220);
			p.stroke(0);
			p.strokeWeight(2);
			p.noFill();

			// p.beginShape();

			for (let x = 0; x < p.width; x += 20) {
				// Map the sinus  from a value between -1 and 1 to a value between the last two arguments.
				// This in practice determines the amplitude
				const y = p.map(
					p.sin(angle) + p.sin(angle * 0.1) + p.sin(angle * 2),
					-1,
					1,
					p.height * 0.3,
					p.height * 0.7
				);

				p.circle(x, y, 10, 10);
				angle += startAngleVelocity;
			}

			startAngle += 0.02;

			// p.endShape();
		};
	}

	// Cleanup to prevent memory leaks

	onDestroy(() => {
		if (myP5) myP5.remove();
	});
</script>

<div bind:this={canvasContainer}></div>
