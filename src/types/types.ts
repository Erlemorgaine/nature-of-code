import type p5 from 'p5';
import type { Vector } from 'p5';
import Matter, { type Constraint, type Body, type World } from 'matter-js';

const {
	Bodies,
	Composite,
	Body: MatterBody,
	Vector: MatterVector,
	Constraint: MatterConstraint
} = Matter;

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
		p.stroke(220, 0);
		p.fill(
			255 * Math.abs(this.velocity.x),
			125 * Math.abs(this.velocity.y),
			this.lifespan,
			this.lifespan
		);

		p.circle(this.position.x, this.position.y, this.mass);
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

export class Confetti extends Particle {
	constructor(position: Vector, velocity: Vector, acceleration: Vector, mass: number = 10) {
		super(position, velocity, acceleration, mass);
	}

	show(p: p5) {
		p.stroke(220, 0);
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

		p.rect(0, 0, this.mass);

		p.pop();
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
		const newParticle =
			Math.random() < 0.5
				? new Particle(
						this.emitterOrigin.copy(),
						p.createVector(0, 0),
						p.createVector(p.random(-2, 2), p.random(-2, 2)),

						Math.random() * 10 + 10
					)
				: new Confetti(
						this.emitterOrigin.copy(),
						p.createVector(0, 0),
						p.createVector(p.random(-2, 2), p.random(-2, 2)),

						Math.random() * 10 + 10
					);

		this.particles.push(newParticle);
	}

	applyForce(force: Vector) {
		this.particles.forEach((particle) => {
			particle.applyForce(force);
		});
	}

	applyRepeller(repeller: Repeller) {
		this.particles.forEach((particle) => {
			const repulsion = repeller.repel(particle);

			particle.applyForce(repulsion);
		});
	}

	run(p: p5) {
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

	isDead() {
		return !this.particles.length;
	}
}

export class Repeller {
	position: Vector;
	power: number; // Power of repulsion
	wanderRadius: number;

	constructor(position: Vector, power = 5, wanderRadius = 132) {
		this.position = position;
		this.power = power;
		this.wanderRadius = wanderRadius;
	}

	repel(particle: Particle) {
		const force = this.position.copy().sub(particle.position);
		let distance = force.mag();

		// Constrain distance so that it never gets too big or too small
		distance = Math.max(5, Math.min(50, distance));

		const strength = (-1 * this.power * this.wanderRadius) / (distance * distance); // Calculate strength of force

		force.setMag(strength);

		return force;
	}

	show(p: p5) {
		p.stroke(0);
		p.fill(127);
		p.circle(this.position.x, this.position.y, this.wanderRadius);
	}
}

export class Organism {
	position: Vector;
	velocity: Vector;
	acceleration: Vector;
	mass: number;
	maxspeed: number;
	maxforce: number;

	constructor(
		position: Vector,
		velocity: Vector,
		acceleration: Vector,
		mass = 6,
		maxspeed: number = 8,
		maxforce: number = 0.2
	) {
		this.position = position;
		this.velocity = velocity;
		this.acceleration = acceleration;
		this.mass = mass;
		this.maxspeed = maxspeed;
		this.maxforce = maxforce;
	}

	update() {
		this.velocity.add(this.acceleration);
		this.velocity.limit(this.maxspeed);
		this.position.add(this.velocity);
		this.acceleration.mult(0);
	}

	applyForce(force: Vector) {
		const f = force.copy();

		this.acceleration.add(f);
	}

	/**
	 * Seeks a target
	 */
	seek(p: p5, target: Vector) {
		const desiredVelocity = target.copy().sub(this.position);

		const distance = desiredVelocity.mag();

		// If the organism comes close enough to its target, it should slow down
		if (distance < 100) {
			const m = p.map(distance, 0, 100, 0, this.maxspeed); // Is like linearScale
			desiredVelocity.setMag(m);
		} else {
			// Limits the velocity, since the organism is likely not as fast as possible.
			// Some organisms are more speedy, some less.
			desiredVelocity.setMag(this.maxspeed);
		}

		// Ultimate velocity depends on the organism's current velocity
		const steeringForce = desiredVelocity.copy().sub(this.velocity);

		// Limits how agile the organism is (some lightweight organisms might be able to adjust their
		// velocity more easily than some other heavyset organisms)
		steeringForce.limit(this.maxforce);
		this.applyForce(steeringForce);
	}

	wander(p: p5, wanderRadius = 5) {
		// Choose a location somewhere ahead of the organism, based on its velocity.
		// Then, choose a random point on a circle around that location.
		const targetCenterLocation = this.velocity.copy().normalize().mult(80).add(this.position);

		// Restrict target angle by current angle
		const currentAngle = this.velocity.heading();
		const angle = currentAngle + Math.PI * Math.random() - Math.PI * 0.5;
		const x = Math.cos(angle) * wanderRadius;
		const y = Math.sin(angle) * wanderRadius;
		const targetLocation = p.createVector(targetCenterLocation.x + x, targetCenterLocation.y + y);

		this.seek(p, targetLocation);
	}

	boundaries(p: p5, offset: number) {
		let desiredForce = null;

		// Desired x force should point away from the edge that it's almost in contact with
		if (this.position.x < offset) {
			desiredForce = p.createVector(this.maxspeed, this.velocity.y);
		} else if (this.position.x > p.windowWidth - offset) {
			desiredForce = p.createVector(-this.maxspeed, this.velocity.y);
		}

		if (this.position.y < offset) {
			desiredForce = p.createVector(this.velocity.x, this.maxspeed);
		} else if (this.position.y > p.windowHeight - offset) {
			desiredForce = p.createVector(this.velocity.x, -this.maxspeed);
		}

		if (desiredForce) {
			const steeringForce = desiredForce.normalize().mult(this.maxspeed).sub(this.velocity);
			steeringForce.limit(this.maxforce);

			this.applyForce(steeringForce);
		}
	}

	show(p: p5) {
		p.background(220);
		// The vehicle is a triangle pointing in the direction of velocity.
		const angle = this.velocity.heading();

		p.fill(127);
		p.stroke(0);
		p.push();
		p.translate(this.position.x, this.position.y);
		p.rotate(angle);
		p.beginShape();
		p.vertex(this.mass * 2, 0);
		p.vertex(-this.mass * 2, -this.mass);
		p.vertex(-this.mass * 2, this.mass);
		p.endShape(p.CLOSE);
		p.pop();
	}
}

export class FlowField {
	resolution: number;
	cols: number;
	rows: number;
	field: Vector[][];

	constructor(p: p5, resolution: number = 10) {
		this.cols = Math.floor(p.windowWidth / resolution);
		this.rows = Math.floor(p.windowHeight / resolution);
		this.resolution = resolution;

		this.field = new Array(this.cols);

		for (let i = 0; i < this.cols; i++) {
			for (let j = 0; j < this.rows; j++) {
				this.field[i][j] = p.createVector();
			}
		}
	}
}

export class CustomShape {
	body: Body;
	color: { r: number; g: number; b: number };

	constructor(x: number, y: number, world: World) {
		const vertices = [];

		vertices[0] = MatterVector.create(-10, -10);
		vertices[1] = MatterVector.create(20, -15);
		vertices[2] = MatterVector.create(15, 0);
		vertices[3] = MatterVector.create(0, 10);
		vertices[4] = MatterVector.create(-20, 15);

		const options = { restitution: 0.5 }; // Set bounciness
		this.body = Bodies.fromVertices(x, y, [vertices], options);
		this.color = { r: Math.random() * 200, g: Math.random() * 200, b: Math.random() * 200 };

		const velocityRandomness = Math.random();
		MatterBody.setVelocity(this.body, MatterVector.create(velocityRandomness * 10 - 5, 0));
		MatterBody.setAngularVelocity(this.body, Math.PI * 0.15 * velocityRandomness);

		Composite.add(world, this.body);
	}

	show(p: p5) {
		p.fill(this.color.r, this.color.g, this.color.b);
		// p.stroke(0);
		// p.strokeWeight(2);

		p.beginShape();

		this.body.vertices.forEach((vertex) => {
			p.vertex(vertex.x, vertex.y);
		});

		p.endShape(p.CLOSE);
	}

	checkEdge(p: p5) {
		return this.body.position.y > p.height + 100;
	}

	removeBody(world: World) {
		Composite.remove(world, this.body);
	}
}

export class LittleAlien {
	body: Body;
	torso: Body;
	eye1: Body;
	eye2: Body;
	eyeRadius: number;
	color: { r: number; g: number; b: number };

	constructor(x: number, y: number, w: number, h: number, world: World) {
		this.eyeRadius = w * 0.25;
		this.color = { r: Math.random() * 125, g: 200, b: Math.random() * 125 };

		this.torso = Bodies.rectangle(x, y, w, h);
		this.eye1 = Bodies.circle(x - w * 0.5, y - h * 0.5, this.eyeRadius);
		this.eye2 = Bodies.circle(x + w * 0.5, y - h * 0.5, this.eyeRadius);

		this.body = MatterBody.create({ parts: [this.torso, this.eye1, this.eye2], restitution: 1 });
		const velocityRandomness = Math.random();
		MatterBody.setVelocity(this.body, MatterVector.create(velocityRandomness * 10 - 5, 0));
		MatterBody.setAngularVelocity(this.body, Math.PI * 0.25 * velocityRandomness);

		Composite.add(world, this.body);
	}

	show(p: p5) {
		const angle = this.body.angle;
		// The angle comes from the compound body.

		// const torsoPosition = this.torso.position;
		const eye1Position = this.eye1.position;
		const eye2Position = this.eye2.position;
		// Get the position for each part.

		p.fill(this.color.r, this.color.g, this.color.b);
		// p.stroke(0);
		p.beginShape();

		this.torso.vertices.forEach((vertex) => {
			p.vertex(vertex.x, vertex.y);
		});

		p.endShape(p.CLOSE);

		p.push();
		p.fill(255);
		p.translate(eye1Position.x, eye1Position.y);
		p.rotate(angle);
		p.circle(0, 0, this.eyeRadius * 2);
		p.pop();

		p.push();
		p.fill(0);
		p.translate(eye1Position.x, eye1Position.y);
		p.rotate(angle);
		p.circle(0, 0, this.eyeRadius);
		p.pop();

		p.push();
		p.fill(255);
		p.translate(eye2Position.x, eye2Position.y);
		p.rotate(angle);
		p.circle(0, 0, this.eyeRadius * 2);
		p.pop();

		p.push();
		p.fill(0);
		p.translate(eye2Position.x, eye2Position.y);
		p.rotate(angle);
		p.circle(0, 0, this.eyeRadius);
		p.pop();
	}

	checkEdge(p: p5) {
		return this.body.position.y > p.height + 100;
	}

	removeBody(world: World) {
		Composite.remove(world, this.body);
	}
}

export class Boundary {
	body: Body;

	constructor(x: number, y: number, w: number, h: number, world: World) {
		const vertices = [];

		vertices[0] = MatterVector.create(-200, -10);
		vertices[1] = MatterVector.create(150, -45);
		vertices[2] = MatterVector.create(300, 100);
		vertices[3] = MatterVector.create(0, 150);
		vertices[4] = MatterVector.create(-75, 125);

		this.body = Bodies.fromVertices(x, y, [vertices], { isStatic: true });

		Composite.add(world, this.body);
	}

	show(p: p5) {
		p.rectMode(p.CENTER);
		p.fill(127);
		p.strokeWeight(0);

		p.beginShape();

		this.body.vertices.forEach((vertex) => {
			p.vertex(vertex.x, vertex.y);
		});

		p.endShape(p.CLOSE);
	}
}

export class SeeSaw {
	body: Body;
	constraint: Constraint;

	constructor(x: number, y: number, w: number, h: number, world: World) {
		this.body = Bodies.rectangle(x, y, w, h);

		Composite.add(world, this.body);

		// One body and one fixed point to which the body is anchored
		const options = {
			bodyA: this.body,
			pointB: { x, y }, // Instead of bodyB
			length: 0,
			stiffness: 0.5
		};

		this.constraint = MatterConstraint.create(options);
		Composite.add(world, this.constraint);
	}

	show(p: p5) {
		p.rectMode(p.CENTER);
		p.fill(127);
		p.strokeWeight(0);

		p.beginShape();

		this.body.vertices.forEach((vertex) => {
			p.vertex(vertex.x, vertex.y);
		});

		p.endShape(p.CLOSE);
	}
}
