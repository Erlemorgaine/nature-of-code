import type p5 from 'p5';
import type { Vector } from 'p5';

export class Mover {
	position: Vector;
	velocity: Vector;
	acceleration: Vector;
	mass: number;

	angle: number = 0;
	aVelocity: number = 0;
	aAcceleration: number = 0;

	// Arbitrary damping to simulate friction / drag
	damping = 0.98;

	constructor(position: Vector, velocity: Vector, acceleration: Vector, mass: number) {
		this.position = position;
		this.velocity = velocity;
		this.acceleration = acceleration;
		this.mass = mass;
	}

	applyForce(force: Vector) {
		const f = force.copy();
		f.div(this.mass);
		this.acceleration.add(f);
	}

	update(p: p5) {
		// For now, calculate angular acceleration based on normal acceleration.
		// Look into torque and inertia later
		this.aAcceleration = this.acceleration.x / 10;

		// Motion
		this.velocity.add(this.acceleration);
		this.velocity.mult(this.damping);
		this.position.add(this.velocity);

		// Rotation
		this.aVelocity += this.aAcceleration;
		this.aVelocity *= this.damping;
		this.aVelocity = p.constrain(this.aVelocity, -0.1, 0.1); // Makes sure object doesn't spin out of control
		this.angle += this.aVelocity;

		// Reset acceleration to 0, to not keep adding it
		this.acceleration.mult(0);
	}

	display(p: p5) {
		// Make object rotate in direction of velocity (i.e. following the mouse).
		// atan2 instead of atan, to differ between angle for velocity (-3, 4) and (3, -4)
		// const angle = p.atan2(this.velocity.y, this.velocity.x);
		// This does the same!
		this.angle += this.velocity.heading();

		p.background(220);
		p.stroke(0);
		p.fill(175, 200);

		// Push and pop make sure the transformations only affect the object in between
		p.push();

		p.rectMode(p.CENTER);
		p.translate(this.position.x, this.position.y);
		// p.rotate(this.angle);
		p.rotate(this.angle);
		p.rect(0, 0, this.mass * 16, this.mass * 16);

		p.pop();
	}
}

export class Oscillator {
	angle: Vector;
	aVelocity: Vector;
	amplitude: Vector;

	constructor(aVelocity: Vector, amplitude: Vector, angle: Vector) {
		this.angle = angle;
		this.aVelocity = aVelocity;
		this.amplitude = amplitude;
	}
}

export class Pendulum {
	anchor: Vector;
	r: number; // Length of pendulum arm
	angle: number;
	aVelocity: number;
	aAcceleration: number = 0;
	dampingFactor: number = 1;

	constructor(anchor: Vector, r: number, angle: number, aVelocity: number) {
		this.anchor = anchor;
		this.r = r;
		this.angle = angle;
		this.aVelocity = aVelocity;
	}

	update(p: p5) {
		const gravity = 0.4; // This is a random initalization

		// Acceleration = force (gravity) * sinus of current angle.
		// Also, the longer the arm, the slower acceleration (A = F / M)
		this.aAcceleration = (-1 * gravity * p.sin(this.angle)) / this.r;
		this.aVelocity += this.aAcceleration;
		this.aVelocity *= this.dampingFactor;
		this.angle += this.aVelocity;

		this.dampingFactor *= 0.99999;
	}

	display(p: p5) {
		// Arbitrary pendulum position

		const bobStartposition = {
			x: this.anchor.x + p.cos(this.angle + Math.PI * 0.5) * this.r,
			y: this.anchor.y + p.sin(this.angle + Math.PI * 0.5) * this.r
		};

		p.background(220);
		p.stroke(0);
		p.fill(175, 200);

		// Pendulum position
		p.circle(this.anchor.x, this.anchor.y, 3);
		p.circle(bobStartposition.x, bobStartposition.y, 16);

		p.line(this.anchor.x, this.anchor.y, bobStartposition.x, bobStartposition.y);
	}
}

export class Spring {
	anchor: Vector;
	restLength: number; // Length of the spring when it is at rest

	k: number = 0.1; // A constant, determines if spring is very rigid or very elastic

	constructor(anchor: Vector, restLength: number) {
		this.anchor = anchor;
		this.restLength = restLength;
	}

	connect(bob: Mover) {
		const force = this.anchor.copy().sub(bob.position);
		const currentLength = force.mag();
		const stretch = currentLength - this.restLength;

		force.setMag(1 * this.k * stretch);

		bob.applyForce(force);
	}

	display(p: p5) {
		p.fill(0);
		p.circle(this.anchor.x, this.anchor.y, 5);
	}

	showLine(p: p5, bob: Mover) {
		p.stroke(0);
		// Draw the spring connection between the bob position and the anchor.

		p.line(bob.position.x, bob.position.y, this.anchor.x, this.anchor.y);
	}
}

export class Particle {
	position: Vector;
	velocity: Vector;
	acceleration: Vector;

	angle: number = 0;
	aVelocity: number = 0;
	aAcceleration: number = 0;

	mass: number;
	lifespan: number = 510; // Expressed in opacity, the older particles are the more they fade out

	constructor(position: Vector, velocity: Vector, acceleration: Vector, mass: number = 10) {
		this.position = position;
		this.velocity = velocity;
		this.acceleration = acceleration;
		this.mass = mass;
	}

	update() {
		this.velocity.add(this.acceleration);
		this.position.add(this.velocity);
		this.acceleration.mult(0);

		this.aVelocity = this.velocity.mag() * 0.05;
		this.angle += this.aVelocity;

		this.lifespan -= 2.0; // Lifespan decreases with each new frame
	}

	show(p: p5) {
		p.stroke(0, this.lifespan);
		p.fill(
			255 * Math.abs(this.velocity.x),
			125 * Math.abs(this.velocity.y),
			this.lifespan,
			this.lifespan
		);

		p.push();

		p.rectMode(p.CENTER);

		// Lifespan as alpha value
		p.translate(this.position.x, this.position.y);
		p.rotate(this.angle);

		p.rect(0, 0, 8);

		p.pop();
	}

	isDead() {
		return this.lifespan <= 0;
	}

	run(p: p5) {
		this.show(p);
		this.update();
	}

	applyForce(force: Vector) {
		const f = force.copy();

		// Acceleration = force / mass
		f.div(this.mass);
		this.acceleration.add(f);
	}
}

export class Emitter {
	emitterOrigin: Vector;
	particles: Particle[];
	systemDying: boolean = false;

	constructor(emitterOrigin: Vector) {
		this.emitterOrigin = emitterOrigin;
		this.particles = [];
	}

	addParticle(p: p5) {
		this.particles.push(
			new Particle(
				this.emitterOrigin.copy(),
				p.createVector(p.random(-2, 2), p.random(-2, 2)),
				p.createVector(0, 0)
			)
		);
	}

	run(p: p5) {
		if (!this.systemDying) {
			this.addParticle(p);
		}

		const particlesLength = this.particles.length;

		for (let i = particlesLength - 1; i >= 0; i--) {
			const particle = this.particles[i];
			particle.run(p);

			if (particle.isDead()) {
				this.particles.splice(i, 1);
			}
		}

		if (particlesLength >= 250) {
			this.systemDying = true;
		}
	}
}
