import type p5 from 'p5';
import type { Vector } from 'p5';

export class Mover {
	location: Vector;
	velocity: Vector;
	acceleration: Vector;
	mass: number;

	angle: number = 0;
	aVelocity: number = 0;
	aAcceleration: number = 0;

	constructor(location: Vector, velocity: Vector, acceleration: Vector, mass: number) {
		this.location = location;
		this.velocity = velocity;
		this.acceleration = acceleration;
		this.mass = mass;
	}

	update(p: p5) {
		// For now, calculate angular acceleration based on normal acceleration.
		// Look into torque and inertia later
		this.aAcceleration = this.acceleration.x / 10;

		// Motion
		this.velocity.add(this.acceleration);
		this.location.add(this.velocity);

		// Rotation
		this.aVelocity += this.aAcceleration;
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
		p.translate(this.location.x, this.location.y);
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
	r: number; // Length of pendulum arm
	angle: number;
	aVelocity: number;
	aAcceleration: number = 0;
	dampingFactor: number = 1;

	constructor(r: number, angle: number, aVelocity: number) {
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
		// Arbitrary pendulum location
		const location = { x: p.width * 0.5, y: 5 };

		const pendulumStartLocation = {
			x: location.x + p.cos(this.angle + Math.PI * 0.5) * this.r,
			y: location.y + p.sin(this.angle + Math.PI * 0.5) * this.r
		};

		p.background(220);
		p.stroke(0);
		p.fill(175, 200);

		// Pendulum location
		p.circle(location.x, location.y, 3);
		p.circle(pendulumStartLocation.x, pendulumStartLocation.y, 16);

		p.line(location.x, location.y, pendulumStartLocation.x, pendulumStartLocation.y);
	}
}
