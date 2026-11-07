let dancer;

function setup() {
  createCanvas(windowWidth, windowHeight);
  dancer = new ShruthiDancer(width / 2, height / 2);
}

function draw() {
  background(0);
  drawFloor(); // for reference only

  dancer.update();
  dancer.display();
}

// ===================================================================
// SHRUTHI DANCER
// A lantern headed dancer in a spinning petal skirt.
// Everything it needs lives inside this class: no global variables,
// no outside functions, nothing to call but update() and display().
// ===================================================================

class ShruthiDancer {
  constructor(startX, startY) {
    this.x = startX;
    this.y = startY;

    // its own clock, started at a random point, so two of these are
    // never in step with each other at the dance party
    this.t = random(1000);
    this.speed = random(0.035, 0.055);

    // randomised looks: a different dancer every time one is made
    // measured at its largest the dancer comes to 184 tall, which
    // keeps it inside the 200x200 rule
    this.scaleAmt = random(0.74, 0.9);
    this.armSegments = floor(random(3, 6));
    this.petalCount = floor(random(7, 11));
    this.colorShift = random(6.28);
    this.wobbleSeed = random(1000);

    // worked out in update(), read in display()
    this.bounce = 0;
    this.sway = 0;
    this.lean = 0;
    this.spin = 0;
    this.flare = 1;
    this.step = 0;
  }

  // =================================================================
  // UPDATE: all the movement is decided here
  // =================================================================
  update() {
    this.t = this.t + this.speed;

    // bob twice per sway, like weight shifting from foot to foot
    this.bounce = sin(this.t * 2) * 7;

    // the body leans side to side once per cycle
    this.sway = sin(this.t) * 0.22;

    // how near is the viewer's cursor? 1 is close, 0 is far away.
    let d = dist(mouseX, mouseY, this.x, this.y);
    let pull = map(d, 320, 60, 0, 1);
    if (pull < 0) { pull = 0; }
    if (pull > 1) { pull = 1; }

    // lean toward the cursor on top of the normal sway
    this.lean = this.sway + (mouseX - this.x) * 0.0014 * pull;

    // the skirt always turns, and turns harder when the cursor nears
    this.spin = this.spin + 0.02 + pull * 0.09;

    // and lifts as it turns faster
    this.flare = 1 + pull * 0.35 + sin(this.t * 2) * 0.07;

    // legs alternate: one swings forward while the other goes back
    this.step = sin(this.t * 2);
  }

  // =================================================================
  // DISPLAY: back to front, so the layers overlap correctly
  // =================================================================
  display() {
    push();
    translate(this.x, this.y);
    scale(this.scaleAmt);
    rotate(this.lean * 0.3);

    this.drawShadow();
    this.drawLegs();
    this.drawSkirt(-1);  // the petals behind the body
    this.drawTorso();
    this.drawArm(-1);
    this.drawArm(1);
    this.drawSkirt(1);   // the petals in front of it
    this.drawHead();

    pop();
  }

  // ---- colour ------------------------------------------------------
  // three sine waves spaced a third of a cycle apart walk red, green
  // and blue around the spectrum together, so the whole dancer shifts
  // hue without ever leaving the 0 to 255 range
  setColor(offset, alpha) {
    let a = this.t * 0.3 + this.colorShift + offset;
    fill(
      140 + sin(a) * 110,
      140 + sin(a + 2.094) * 110,
      140 + sin(a + 4.188) * 110,
      alpha
    );
  }

  // ---- one tapered petal, drawn pointing down from the origin ------
  // built out of plain vertices so it works in any version of p5
  petalShape(len, wide) {
    beginShape();
    for (let k = 0; k <= 10; k++) {
      let u = k / 10;
      vertex(sin(u * 3.1416) * wide * (1 - u * 0.3), u * len);
    }
    for (let k = 10; k >= 0; k--) {
      let u = k / 10;
      vertex(-sin(u * 3.1416) * wide * (1 - u * 0.3), u * len);
    }
    endShape(CLOSE);
  }

  // ---- body parts --------------------------------------------------

  drawShadow() {
    noStroke();
    fill(0, 90);
    ellipse(0, 82, 84 - this.bounce * 1.5, 13);
  }

  drawLegs() {
    noStroke();
    for (let side = -1; side <= 1; side = side + 2) {
      push();
      translate(side * 12, 22 + this.bounce);
      rotate(this.step * 0.3 * side);
      this.setColor(1.6, 235);
      rect(-5, 0, 10, 46, 5);
      ellipse(0, 50, 19, 10); // foot
      pop();
    }
  }

  // half is -1 for the petals behind the body, 1 for the ones in front
  drawSkirt(half) {
    push();
    translate(0, 18 + this.bounce);
    noStroke();

    for (let i = 0; i < this.petalCount; i++) {
      // where this petal sits on the ring, once the ring has turned
      let a = (6.283 / this.petalCount) * i + this.spin;

      // sin(a) says how far round the back or the front it is
      let depth = sin(a);

      if (depth * half > 0) {
        // across the body, and a touch lower when it swings forward
        let px = cos(a) * 38;
        let py = depth * 6;

        // a petal seen side on looks narrow, seen face on looks wide
        let wide = 4 + 9 * abs(depth);

        // each petal breathes on its own so the ring is never even
        let n = noise(this.wobbleSeed + i * 0.4, this.t * 0.25);
        let len = (32 + n * 17) * this.flare;

        push();
        translate(px, py);
        rotate(px * 0.005); // the outer petals fan outward
        this.setColor(i * 0.16, 65);
        push();
        scale(1.5, 1.12);
        this.petalShape(len, wide);
        pop();
        this.setColor(i * 0.16, 220);
        this.petalShape(len, wide);
        pop();
      }
    }
    pop();
  }

  drawTorso() {
    push();
    translate(0, this.bounce);
    noStroke();
    this.setColor(0.9, 240);

    // one loop walks down the left side, a second walks back up the
    // right side, which closes the shape
    beginShape();
    for (let k = 0; k <= 12; k++) {
      let u = k / 12;
      vertex(-(17 - 5 * sin(u * 3.1416) + u * 5), -44 + u * 68);
    }
    for (let k = 12; k >= 0; k--) {
      let u = k / 12;
      vertex(17 - 5 * sin(u * 3.1416) + u * 5, -44 + u * 68);
    }
    endShape(CLOSE);

    // a seam down the middle that bends with the sway
    stroke(255, 110);
    strokeWeight(2);
    noFill();
    beginShape();
    for (let k = 0; k <= 10; k++) {
      let u = k / 10;
      vertex(sin(u * 6.283) * this.sway * 22, -42 + u * 64);
    }
    endShape();
    pop();
  }

  // side is -1 for the left arm and 1 for the right
  drawArm(side) {
    push();
    translate(side * 14, -36 + this.bounce);

    // flipping the x axis makes the left arm a mirror of the right,
    // so the same chain of code below builds both of them
    scale(side, 1);
    noStroke();

    let segLen = 18;
    for (let s = 0; s < this.armSegments; s++) {
      // each joint bends slightly later than the one before it, and
      // that delay is what turns a stack of rotations into a wave
      rotate(sin(this.t * 1.6 + s * 0.8 + side) * 0.4 + 0.3);

      let f = s / this.armSegments;
      let w = 10 * (1 - f) + 3;

      // a big faint copy behind a small bright one fakes a glow
      this.setColor(2.4 + f, 70);
      ellipse(segLen * 0.5, 0, segLen * 1.3, w * 2.1);
      this.setColor(2.4 + f, 230);
      ellipse(segLen * 0.5, 0, segLen, w);

      translate(segLen * 0.78, 0);
    }

    this.setColor(3.6, 245); // hand
    ellipse(0, 0, 12, 12);
    pop();
  }

  drawHead() {
    push();
    translate(0, -60 + this.bounce);
    rotate(this.sway * 0.5);
    noStroke();

    this.setColor(0.2, 55);
    ellipse(0, 0, 54, 54); // glow

    // a ring of points pushed in and out by noise, so the outline
    // keeps shifting instead of sitting still as a plain circle
    this.setColor(0.2, 245);
    beginShape();
    for (let i = 0; i < 20; i++) {
      let ang = (6.283 / 20) * i;
      let n = noise(
        this.wobbleSeed + cos(ang) * 0.8,
        this.wobbleSeed + sin(ang) * 0.8,
        this.t * 0.3
      );
      let r = 16 + n * 9;
      vertex(cos(ang) * r, sin(ang) * r);
    }
    endShape(CLOSE);

    // eyes drift a little way toward the cursor
    let dx = (mouseX - this.x) * 0.004;
    let dy = (mouseY - this.y) * 0.004;
    if (dx > 2) { dx = 2; }
    if (dx < -2) { dx = -2; }
    if (dy > 2) { dy = 2; }
    if (dy < -2) { dy = -2; }

    fill(15);
    ellipse(-6 + dx, -2 + dy, 5, 7);
    ellipse(6 + dx, -2 + dy, 5, 7);

    // antenna: a short chain of line segments ending in a bead
    let tip = sin(this.t * 1.3) * 12;
    stroke(255, 160);
    strokeWeight(2);
    let px = 0;
    let py = -15;
    for (let k = 1; k <= 6; k++) {
      let u = k / 6;
      let nx = tip * u * u;
      let ny = -15 - u * 18;
      line(px, py, nx, ny);
      px = nx;
      py = ny;
    }
    noStroke();
    this.setColor(4.5, 245);
    ellipse(px, py, 9, 9);
    pop();
  }
}
