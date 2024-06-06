<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type p5 from 'p5';
	import '../main.css';
	import {
		Mover,
		Pendulum,
		Spring,
		Repeller,
		Emitter,
		Organism,
		Particle,
		CustomShape,
		Boundary,
		LittleAlien,
		SeeSaw
	} from '../types/types';
	import Matter, { type Engine } from 'matter-js';

	let canvasContainer: HTMLDivElement;
	let myP5: p5;

	const { Engine, Mouse, MouseConstraint, Composite } = Matter;

	let engine: Engine;

	onMount(async () => {
		const p5 = (await import('p5')).default;

		function sketch(p: p5) {
			const mover = new Mover(
				p.createVector(p.windowWidth * 0.5, p.windowHeight * 0.5),
				p.createVector(0, 0),
				p.createVector(0.5, 0),
				3
			);

			const pendulum = new Pendulum(p.createVector(p.windowWidth * 0.5, 5), 200, Math.PI * 0.5, 0);

			const emitters: Emitter[] = [];
			const repeller = new Repeller(p.createVector(p.windowWidth * 0.33, p.windowHeight - 100));

			const organism = new Organism(
				p.createVector(p.windowWidth * 0.33, p.windowHeight * 0.5),
				p.createVector(0, 0),
				p.createVector(1, 0.5)
			);

			const seekTarget = new Particle(
				p.createVector(p.windowWidth * 0.5, p.windowHeight * 0.5),
				p.createVector(0, 0),
				p.createVector(p.random(-2, 2), p.random(-2, 2)),

				Math.random() * 10 + 10
			);

			p.setup = function () {
				const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
				p.fill(255, 204, 0);
				// mover.display(p);

				engine = Engine.create();

				const mouse = Mouse.create(canvas.elt);
				const mouseConstraint = MouseConstraint.create(engine, {
					mouse,
					constraint: { stiffness: 0.7 }
				});
				Composite.add(engine.world, mouseConstraint);
			};

			p.draw = function () {
				// mover.update(p);
				// mover.display(p);
				// pendulum.display(p);
				// pendulum.update(p);
				// showEmitter(p, emitters, repeller);
				// wanderingOrganism(p, organism);
				// boundariesOrganism(p, organism);
			};

			// rotateBatonByAngle(p);
			// makeWaves(p);
			// showSpring(p);
			fallingShapes(p);

			// TODO: Matter attractor
			// TODO: Matter bridge with constraints
		}

		myP5 = new p5(sketch, canvasContainer);
	});

	function fallingShapes(p: p5) {
		const shapes: (CustomShape | LittleAlien)[] = [];
		let boundaries: Boundary[];
		let seeSaw: SeeSaw;

		p.draw = function () {
			if (engine) {
				if (!boundaries) {
					boundaries = [
						new Boundary(
							p.windowWidth * 0.35 + 20,
							p.height * 0.5,
							p.windowWidth * 0.45,
							10,
							engine.world
						)
					];
				}

				if (!seeSaw) {
					seeSaw = new SeeSaw(
						p.windowWidth * 0.75,
						p.windowHeight - 200,
						p.windowWidth * 0.25,
						20,
						engine.world
					);
				}

				p.background(220);

				Engine.update(engine);

				if (p.random(1) < 0.05) {
					const newShape =
						Math.random() < 0.33
							? new CustomShape(p.windowWidth / 2, 50, engine.world)
							: new LittleAlien(
									p.windowWidth / 2,
									50,
									Math.random() * 25 + 25,
									Math.random() * 25 + 25,
									engine.world
								);
					shapes.push(newShape);
				}

				seeSaw.show(p);

				// Display all the boundaries
				for (let i = 0; i < boundaries.length; i++) {
					boundaries[i].show(p);
				}

				// Iterate over the boxes backwards
				for (let i = shapes.length - 1; i >= 0; i--) {
					shapes[i].show(p);
					// Remove the Body from the world and the array
					if (shapes[i].checkEdge(p)) {
						shapes[i].removeBody(engine.world);
						shapes.splice(i, 1);
					}
				}
			}
		};
	}

	function boundariesOrganism(p: p5, organism: Organism) {
		// target.update();
		organism.boundaries(p, 25);
		organism.update();
		organism.show(p);
	}

	function wanderingOrganism(p: p5, organism: Organism) {
		organism.maxspeed = 1;

		// target.update();
		organism.wander(p, 200);
		organism.update();
		organism.show(p);
	}

	function seekingOrganism(p: p5, organism: Organism, target: Particle) {
		organism.update();

		target.position = p.createVector(p.mouseX, p.mouseY);
		// target.update();
		organism.seek(p, target.position);
		organism.show(p);
		target.show(p);
	}

	function showEmitter(p: p5, emitters: Emitter[], repeller: Repeller) {
		p.background(20, 30); // Add also value for alpha

		if (!emitters.length) {
			emitters.push(new Emitter(p.createVector(p.windowWidth * 0.5, p.windowHeight * 0.5)));
		}

		emitters.forEach((emitter) => {
			if (!emitter.systemDying) {
				emitter.addParticle(p);
			}

			emitter.applyForce(p.createVector(0, 0.25)); // Simulate 'gravity'
			emitter.applyRepeller(repeller);

			emitter.run(p);
			repeller.show(p);

			if (emitter.isDead()) {
				emitters.splice(0, 1);
			}
		});
	}

	function showSpring(p: p5) {
		const bob = new Mover(
			p.createVector(p.windowWidth * 0.75, 100),
			p.createVector(0, 0),
			p.createVector(0, 0),
			5
		);

		const spring = new Spring(p.createVector(p.windowWidth * 0.5, 5), 200);

		p.draw = function () {
			let gravity = p.createVector(0, 1); // Arbitrary gravity force
			bob.applyForce(gravity);
			bob.update(p);

			spring.connect(bob);

			bob.display(p);
			spring.showLine(p, bob);
			spring.display(p);
		};
	}

	// 3 Oscillation - 3.2
	function rotateBatonByAngle(p: p5) {
		let angle = 0;
		let angularVelocity = 0;
		let angularAcceleration = 0.001;
		let direction = 1;

		p.draw = function () {
			p.background(220);
			p.translate(p.windowWidth * 0.5, p.height * 0.5);
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

			for (let x = 0; x < p.windowWidth; x += 20) {
				// Map the sinus  from a value between -1 and 1 to a value between the last two arguments.
				// This in practice determines the amplitude
				const y = p.map(
					p.sin(angle) + p.sin(angle * 0.1) + p.sin(angle * 2),
					-1,
					1,
					p.height * 0.3,
					p.height * 0.7
				);

				p.circle(x, y, 10);
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
