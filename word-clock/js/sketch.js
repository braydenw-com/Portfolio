var canvas;
var previousDateNow = 0;
var ghostX = 0;
var ghostY = 0;
var ghostVX = 0;
var ghostVY = 0;
var colors = [];
var lastResetTime = 0;
var resetInterval = 20000;
var paletteGen;


function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  colorMode(HSB);
  frameRate(60);
  noCursor();
  background(255);

  paletteGen = new PaletteGenerator();
  colors = paletteGen.getColors();
  ghostX = random(windowWidth);
  ghostY = random(windowHeight);

  ghostVX = random(-120, 120);
  ghostVY = random(-50, 60);
}

function draw() {
  if (millis() - lastResetTime > resetInterval) {
    resetSketch();
    lastResetTime = millis();
  }

  ghostX += ghostVX;
  ghostY += ghostVY;

  if (ghostX <= 0 || ghostX >= width) ghostVX *= -1;
  if (ghostY <= 0 || ghostY >= height) ghostVY *= -1;

  let randomColor = random(colors);
  let [h, s, b] = randomColor.hsb;
  let brushOpacity = 0.3;

  noStroke();
  fill(h, s, b, brushOpacity);
  circle(ghostX, ghostY, 1);

  noFill();
  stroke(h, s, b, brushOpacity);
  strokeWeight((sin(frameCount / 100) / 2 + 0.5) * 10);

  push();
  translate(ghostX, ghostY);
  rotate(random(TWO_PI));
  for (let i = 0; i < 5; i++) {
    let r = random(5, 25);
    ellipse(random(-r, r), random(-r, r), r, r);
  }
  pop();

  for (let i = 0; i < 3; i++) {
    let x1 = ghostX + random(-15, 15);
    let y1 = ghostY + random(-15, 15);
    let x2 = x1 + random(-30, 30);
    let y2 = y1 + random(-30, 30);
    line(x1, y1, x2, y2);
  }

  var dateNow = Date.now();
  previousDateNow = dateNow;

  noStroke();
  fill(h, s, b, brushOpacity);
  ellipse(mouseX, mouseY, 40, 40);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(0, 0, 100);
}

function resetSketch() {
  background(255);

  paletteGen = new PaletteGenerator();
  colors = paletteGen.getColors();

  ghostX = random(windowWidth);
  ghostY = random(windowHeight);
  ghostVX = random(-60, 60);
  ghostVY = random(-30, 30);
}

class PaletteGenerator {
  constructor(baseHue = random(0, 360)) {
    this.baseHue = baseHue;
    this.palette = [];
    this.generateComplementaryPalette();
  }

  generateComplementaryPalette() {
    this.palette = [];

    let sat1 = random(80, 100);
    let bright1 = random(80, 100);
    let baseColor = new AscaColor(this.baseHue, sat1, bright1, AscaColor.MODE_HSB);

    let compHue = (this.baseHue + 180) % 360;
    let sat2 = random(80, 100);
    let bright2 = random(80, 100);
    let compColor = new AscaColor(compHue, sat2, bright2, AscaColor.MODE_HSB);

    this.palette.push(baseColor, compColor);
  }

  getColors() {
    return this.palette;
  }

  getRandomColor() {
    return random(this.palette);
  }
}


class AscaColor {
  static MODE_RGB = "rgb";
  static MODE_HEX = "hex";
  static MODE_HSB = "hsb";

  static floar2int(value) {
    return value | 0;
  }

  #h;
  #s;
  #b;
  #validModes;

  constructor(...args) {
    this.#validModes = [AscaColor.MODE_RGB, AscaColor.MODE_HEX, AscaColor.MODE_HSB];
    this.setValue(...args);
  }

  get hsb() {
    var result = [this.#h, this.#s, this.#b];
    return result;
  }

  get rgb() {
    var result = this.#hsbToRgb([this.#h, this.#s, this.#b]);
    return result;
  }

  get hex() {
    var result = this.#rgbToHex(this.rgb);
    return "#" + result;
  }


  setValue(...args) {
    if (!args.length) {
      throw new Error("AscaColor.setValue expects arguments.");
    }

    let mode = AscaColor.MODE_RGB;

    if (typeof args[0] === 'string' || args[0] instanceof String) {
      mode = AscaColor.MODE_HEX;
    } else if (
      args.length > 3 &&
      typeof args[args.length - 1] === 'string' &&
      this.#isValidMode(args[args.length - 1])
    ) {
      mode = args[args.length - 1];
    }

    var rgb, hsb;

    switch (mode) {
      case AscaColor.MODE_HEX:
        rgb = this.#hexToRgb(args[0]);
        hsb = this.#rgbToHsb(...rgb);
        break;
      case AscaColor.MODE_RGB:
        rgb = [args[0], args[1], args[2]];
        hsb = this.#rgbToHsb(...rgb);
        break;
      case AscaColor.MODE_HSB:
        hsb = [args[0], args[1], args[2]];
        break;
    }

    this.#h = hsb[0];
    this.#s = hsb[1];
    this.#b = hsb[2];
  }

  #isValidMode(mode) {
    var result = false;
    if (this.#validModes.includes(mode)) {
      result = true;
    }
    return result;
  }

  #hexToRgb(hex) {
    let alpha = false,
      h = hex.slice(hex.startsWith('#') ? 1 : 0);
    if (h.length === 3) h = [...h].map(x => x + x).join('');
    else if (h.length === 8) alpha = true;
    h = parseInt(h, 16);
    var result = [];
    result.push(h >>> (alpha ? 24 : 16));
    result.push((h & (alpha ? 0x00ff0000 : 0x00ff00)) >>> (alpha ? 16 : 8));
    result.push((h & (alpha ? 0x0000ff00 : 0x0000ff)) >>> (alpha ? 8 : 0));
    if (alpha) {
      result.push(h & 0x000000ff);
    }
    return result;
  };

  #rgbToHsb = (r, g, b) => {
    r = r / 255;
    g = g / 255;
    b = b / 255;

    const v = Math.max(r, g, b);
    const n = v - Math.min(r, g, b);
    const h =
      n === 0 ? 0 :
        v === r ? (g - b) / n :
          v === g ? 2 + (b - r) / n :
            4 + (r - g) / n;

    return [
      60 * (h < 0 ? h + 6 : h),
      v && (n / v) * 100,
      v * 100
    ];
  };

  #hsbToRgb(value) {
    var h = value[0];
    var s = value[1] / 100;
    var b = value[2] / 100;
    const k = (n) => (n + h / 60) % 6;
    const f = (n) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));

    var result = [];
    result.push(AscaColor.floar2int(255 * f(5)));
    result.push(AscaColor.floar2int(255 * f(3)));
    result.push(AscaColor.floar2int(255 * f(1)));
    return result;
  };

  #rgbToHex(value) {
    var r = value[0];
    var g = value[1];
    var b = value[2];
    var result = ((r << 16) + (g << 8) + b).toString(16).padStart(6, '0');
    return result;
  }
}

