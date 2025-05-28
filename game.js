// Flappy Bird Clone - game.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const GRAVITY = 0.22; // even slower fall
const FLAP = -6;      // gentler flap
const BIRD_X = 80;
const BIRD_RADIUS = 20;
const PIPE_WIDTH = 60;
const INITIAL_PIPE_GAP = 260; // easier first pipes (was 200)
const MIN_PIPE_GAP = 180;     // minimum gap as difficulty increases (was 120)
const PIPE_SPEED = 1.4;       // even slower pipes
const GROUND_HEIGHT = 80;
const INITIAL_PIPE_INTERVAL = 140; // pipes further apart at start (was 110)
const MIN_PIPE_INTERVAL = 100;      // minimum interval as difficulty increases (was 70)

// Game state
let birdY, birdVelocity, pipes, score, bestScore, frameCount, gameOver, gameStarted, pipeGap, pipeInterval;

// DOM elements
const gameOverDiv = document.getElementById('game-over');
const scoreDisplay = document.getElementById('score-display');
const medalDisplay = document.getElementById('medal-display');
const restartBtn = document.getElementById('restart-btn');
const startScreen = document.getElementById('start-screen');

function resetGame() {
  birdY = canvas.height / 2;
  birdVelocity = 0;
  pipes = [];
  score = 0;
  frameCount = 0;
  gameOver = false;
  gameStarted = false;
  pipeGap = INITIAL_PIPE_GAP;
  pipeInterval = INITIAL_PIPE_INTERVAL;
  gameOverDiv.classList.add('hidden');
  startScreen.classList.remove('hidden');
}

function drawBird() {
  ctx.save();
  ctx.translate(BIRD_X, birdY);

  // Draw airplane shadow
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.ellipse(0, 22, 18, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#222';
  ctx.fill();
  ctx.restore();

  // Main fuselage (body)
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#7DA7D9'; // blue-gray
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = '#4B6EAF';
  ctx.stroke();

  // Cockpit window
  ctx.beginPath();
  ctx.ellipse(10, -3, 6, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#B0D0F0';
  ctx.stroke();

  // Left wing
  ctx.save();
  ctx.rotate(-0.18);
  ctx.beginPath();
  ctx.moveTo(-4, 4);
  ctx.lineTo(-28, 12);
  ctx.lineTo(-24, 16);
  ctx.lineTo(-2, 8);
  ctx.closePath();
  ctx.fillStyle = '#B0B0B0';
  ctx.fill();
  ctx.restore();

  // Right wing
  ctx.save();
  ctx.rotate(0.18);
  ctx.beginPath();
  ctx.moveTo(4, 4);
  ctx.lineTo(28, 12);
  ctx.lineTo(24, 16);
  ctx.lineTo(2, 8);
  ctx.closePath();
  ctx.fillStyle = '#B0B0B0';
  ctx.fill();
  ctx.restore();

  // Tail fin
  ctx.beginPath();
  ctx.moveTo(-18, -4);
  ctx.lineTo(-26, -12);
  ctx.lineTo(-16, -8);
  ctx.closePath();
  ctx.fillStyle = '#E94F37'; // red
  ctx.fill();
  ctx.strokeStyle = '#B0301B';
  ctx.stroke();

  // Nose cone
  ctx.beginPath();
  ctx.arc(22, 0, 4, Math.PI * 0.7, Math.PI * 1.3, false);
  ctx.fillStyle = '#F6F6F7';
  ctx.fill();
  ctx.strokeStyle = '#B0B0B0';
  ctx.stroke();

  ctx.restore();
}

function drawPipes() {
  ctx.fillStyle = '#008060'; // Shopify green
  pipes.forEach(pipe => {
    // Top pipe
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
    // Bottom pipe
    ctx.fillRect(pipe.x, pipe.gapY + pipe.gap, PIPE_WIDTH, canvas.height - pipe.gapY - pipe.gap - GROUND_HEIGHT);
    // Pipe border
    ctx.strokeStyle = '#00542C';
    ctx.lineWidth = 3;
    ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
    ctx.strokeRect(pipe.x, pipe.gapY + pipe.gap, PIPE_WIDTH, canvas.height - pipe.gapY - pipe.gap - GROUND_HEIGHT);
  });
}

function drawGround() {
  ctx.fillStyle = '#5E8E3E'; // Shopify dark green
  ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
  ctx.strokeStyle = '#3A5B22';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
}

function drawScore() {
  ctx.font = '36px Arial Black, Arial, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 4;
  ctx.textAlign = 'center';
  ctx.strokeText(score, canvas.width / 2, 80);
  ctx.fillText(score, canvas.width / 2, 80);
}

function update() {
  if (!gameStarted || gameOver) return;
  frameCount++;
  // Bird physics
  birdVelocity += GRAVITY;
  birdY += birdVelocity;

  // Gradually increase difficulty
  if (score > 0 && score % 5 === 0) {
    pipeGap = Math.max(MIN_PIPE_GAP, INITIAL_PIPE_GAP - score * 4);
    pipeInterval = Math.max(MIN_PIPE_INTERVAL, INITIAL_PIPE_INTERVAL - Math.floor(score / 2));
  }

  // Add pipes
  if (frameCount % pipeInterval === 0) {
    const gapY = Math.floor(Math.random() * (canvas.height - pipeGap - GROUND_HEIGHT - 60)) + 30;
    pipes.push({ x: canvas.width, gapY, passed: false, gap: pipeGap });
  }

  // Move pipes
  pipes.forEach(pipe => pipe.x -= PIPE_SPEED);
  // Remove off-screen pipes
  if (pipes.length && pipes[0].x + PIPE_WIDTH < 0) pipes.shift();

  // Collision detection
  pipes.forEach(pipe => {
    // Bird within pipe x range
    if (
      BIRD_X + BIRD_RADIUS > pipe.x &&
      BIRD_X - BIRD_RADIUS < pipe.x + PIPE_WIDTH
    ) {
      // Bird hits top pipe
      if (birdY - BIRD_RADIUS < pipe.gapY || birdY + BIRD_RADIUS > pipe.gapY + pipe.gap) {
        triggerGameOver();
      }
    }
    // Score
    if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
      score++;
      pipe.passed = true;
    }
  });

  // Ground collision
  if (birdY + BIRD_RADIUS > canvas.height - GROUND_HEIGHT) {
    triggerGameOver();
  }
  // Ceiling collision
  if (birdY - BIRD_RADIUS < 0) {
    birdY = BIRD_RADIUS;
    birdVelocity = 0;
  }
}

function triggerGameOver() {
  gameOver = true;
  bestScore = Math.max(score, bestScore || 0);
  showGameOver();
}

function showGameOver() {
  scoreDisplay.textContent = `Score: ${score} | Best: ${bestScore}`;
  let medal = '';
  if (score >= 40) medal = '🏅 Platinum Medal!';
  else if (score >= 30) medal = '🥇 Gold Medal!';
  else if (score >= 20) medal = '🥈 Silver Medal!';
  else if (score >= 10) medal = '🥉 Bronze Medal!';
  else medal = 'No Medal';
  medalDisplay.textContent = medal;
  gameOverDiv.classList.remove('hidden');
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGround();
  drawPipes();
  drawBird();
  if (gameStarted) drawScore();
}

function gameLoop() {
  update();
  draw();
  if (!gameOver && gameStarted) {
    requestAnimationFrame(gameLoop);
  }
}

function flap() {
  if (!gameStarted || gameOver) return;
  birdVelocity = FLAP;
}

// Input handlers
canvas.addEventListener('mousedown', () => {
  if (gameOver) resetGame();
  else if (!gameStarted) startGame();
});
canvas.addEventListener('touchstart', () => {
  if (gameOver) resetGame();
  else if (!gameStarted) startGame();
});
document.addEventListener('keydown', e => {
  if (!gameStarted && (e.code === 'Space' || e.code === 'Enter')) {
    startGame();
  } else if (e.code === 'Space') {
    flap();
  } else if (gameOver && (e.code === 'Space' || e.code === 'Enter')) {
    resetGame();
  }
});

restartBtn.addEventListener('click', () => {
  resetGame();
});

// Initialize
bestScore = 0;
resetGame();
// gameLoop(); // No autostart

function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  startScreen.classList.add('hidden');
  requestAnimationFrame(gameLoop);
} 