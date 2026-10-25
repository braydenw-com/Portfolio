// Sphere appearance and audio sensitivity settings
const SPHERE_DETAIL = 48;
const BASE_RADIUS = 150;
const GRADIENT_TOP = '#ff6ec7';
const GRADIENT_BOTTOM = '#00eaff';
const MIC_SENSITIVITY = 15;
const MIN_THRESHOLD = 0.005;
const SMOOTH_FACTOR = 0.85;
const EASE_AMOUNT = 0.05;

// Keeps track of the current state and audio variables
let mic, fft, speechRec;
let started = false;
let showEntryPage = true;
let rotXAngle = 0, rotYAngle = 0, targetRotX = 0, targetRotY = 0;
let smoothLevel = 0, smoothWave = 0;
let partyImages = {};
let popups = [];

// These are the keywords and images for the speech-triggered popups
const triggers = {
  dance: ["dance", "move", "boogie"],
  party: ["party", "fun", "celebrate"],
  music: ["music", "beat", "song"]
};

const partyPopups = [
  {imgKey: "dance", file: "assets/pic.png"},
  {imgKey: "party", file: "assets/picc.png"},
  {imgKey: "music", file: "assets/piccc.png"}
];

// Loads all popup images before the sketch starts
function preload() {
  partyPopups.forEach(popup => {
    partyImages[popup.imgKey] = loadImage(popup.file);
  });
}

// Sets up the canvas, audio input, and speech recognition
function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  colorMode(RGB, 255);

  mic = new p5.AudioIn();
  fft = new p5.FFT(0.8, 1024);

  setupSpeechRecognition();
}

// The main animation loop: handles background, user interaction, and drawing everything
function draw() {
  background(0);

  if (showEntryPage) return;

  orbitControl();

  if (!started) return;

  updateMicLevels();
  updateRotation();

  drawSphere();
  drawPopups();
}

// Handles smoothing the mic input for more natural animation
function updateMicLevels() {
  let currentLevel = mic.getLevel();
  let scaledLevel = currentLevel < MIN_THRESHOLD ? 0 : currentLevel * MIC_SENSITIVITY;
  smoothLevel = lerp(smoothLevel, scaledLevel, 1 - SMOOTH_FACTOR);
  smoothWave = lerp(smoothWave, scaledLevel * 100, 1 - SMOOTH_FACTOR);
}

// Calculates smooth, gentle rotation for the sphere using noise
function updateRotation() {
  targetRotX = map(noise(frameCount * 0.002), 0, 1, -0.1, 0.1);
  targetRotY = map(noise(frameCount * 0.001 + 500), 0, 1, -0.1, 0.1);
  rotXAngle = lerp(rotXAngle, targetRotX, EASE_AMOUNT);
  rotYAngle = lerp(rotYAngle, targetRotY, EASE_AMOUNT);
}

// Draws the animated, audio-reactive sphere in 3D
function drawSphere() {
  push();
  rotateX(frameCount * 0.003 + rotXAngle);
  rotateY(frameCount * 0.004 + rotYAngle);
  rotateZ(sin(frameCount * 0.001) * 0.1);

  let basePulse = 1.0;
  let micPulse = map(smoothLevel, 0, 1, 0, 0.4);
  let pulse = basePulse + micPulse;

  noFill();
  strokeWeight(1.2);

  for (let lat = 0; lat <= PI; lat += PI / SPHERE_DETAIL) {
    beginShape();
    let amt = map(lat, 0, PI, 0, 1);
    let gradCol = lerpColor(color(GRADIENT_TOP), color(GRADIENT_BOTTOM), amt);
    stroke(gradCol);

    for (let lon = 0; lon <= TWO_PI; lon += TWO_PI / SPHERE_DETAIL) {
      let x = sin(lat) * cos(lon);
      let y = sin(lat) * sin(lon);
      let z = cos(lat);

      // Add wavy distortion based on mic and time
      let wave1 = sin(lon * 8 + lat * 6 + frameCount * 0.15) * smoothWave;
      let wave2 = cos(lon * 4 + lat * 3 + frameCount * 0.1) * smoothWave * 0.5;
      let r = BASE_RADIUS * pulse + wave1 + wave2;

      vertex(x * r, y * r, z * r);
    }
    endShape(CLOSE);
  }
  pop();
}

// Draws popups in the center of the screen when speech triggers them
function drawPopups() {
  for (let i = popups.length - 1; i >= 0; i--) {
    let p = popups[i];
    push();
    resetMatrix();
    imageMode(CENTER);

    // Animate popup with fade and scale
    let t = 1 - p.timer / p.duration;
    let alpha = 255 * (t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1);
    tint(255, alpha);

    let scale = lerp(0.7, 1.2, sin(PI * t));
    image(p.img, 0, 0, 120 * scale, 120 * scale);

    pop();

    p.timer--;
    if (p.timer <= 0) popups.splice(i, 1);
  }
}

// Sets up the speech recognition and keeps it running
function setupSpeechRecognition() {
  speechRec = new p5.SpeechRec('en-US', gotSpeech);
  speechRec.continuous = true;
  speechRec.interimResults = false;
  speechRec.onEnd = () => speechRec.start();
  speechRec.start();
}

// Handles what happens when speech is recognized (shows a popup if a keyword is detected)
function gotSpeech() {
  if (speechRec.resultValue) {
    let said = speechRec.resultString.toLowerCase().trim();
    for (let key in triggers) {
      if (triggers[key].some(trigger => said.includes(trigger))) {
        popups.push({
          img: partyImages[key],
          timer: 60,
          duration: 60,
          angleOffset: random(TWO_PI)
        });
        return;
      }
    }
  }
}

// Starts the audio and visuals when the user clicks (required by browsers)
function mousePressed() {
  if (showEntryPage) {
    showEntryPage = false;
    userStartAudio().then(() => {
      mic.start();
      fft.setInput(mic);
      started = true;
    });
  }
}

// Makes sure the canvas always fills the window
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
